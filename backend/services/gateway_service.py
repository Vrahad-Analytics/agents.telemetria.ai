import json
import time
import uuid
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, Optional, Tuple
import httpx
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.models.operational import Project
from backend.models.telemetry import TraceRecord, SpanRecord
from backend.services.ingestion_service import IngestionService
from backend.api.v1.schemas import IngestBatchRequest, TraceIngestItem, SpanIngestItem


class GatewayService:
    def __init__(self):
        self.ingestion_service = IngestionService()

    async def forward_chat_completion(
        self,
        payload: Dict[str, Any],
        provider: str,
        project: Project,
        db: Session,
        client_api_key: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], Optional[AsyncGenerator[str, None]]]:
        """
        Forward chat completion to OpenAI or Anthropic, or mock response if keys not configured.
        Returns: (initial_response_data, stream_generator_or_none)
        """
        model = payload.get("model", "gpt-4o")
        stream = payload.get("stream", False)
        messages = payload.get("messages", [])

        # Detect provider if not explicitly given
        if not provider:
            if "claude" in model.lower():
                provider = "anthropic"
            else:
                provider = "openai"

        # Check for user-connected provider key in MongoDB or parameter
        actual_key = client_api_key
        if not actual_key:
            try:
                from backend.core.mongodb import ResilientCollection
                providers_col = ResilientCollection("project_providers")
                p_doc = providers_col.find_one({"project_id": project.id, "provider_name": provider})
                if p_doc and p_doc.get("api_key"):
                    actual_key = p_doc.get("api_key")
            except Exception:
                pass

        if not actual_key:
            if provider == "openai":
                actual_key = settings.OPENAI_API_KEY
            elif provider == "anthropic":
                actual_key = settings.ANTHROPIC_API_KEY

        # Check if we should use Mock Mode
        is_mock = settings.GATEWAY_MOCK_MODE or not actual_key

        start_time = datetime.now(timezone.utc)
        start_mono = time.monotonic()
        trace_id = f"trace_{uuid.uuid4().hex[:16]}"
        span_id = f"span_{uuid.uuid4().hex[:16]}"

        if is_mock:
            if stream:
                generator = self._mock_streaming_response(
                    model=model,
                    messages=messages,
                    trace_id=trace_id,
                    span_id=span_id,
                    project=project,
                    db=db,
                    start_time=start_time,
                    start_mono=start_mono,
                    raw_request=json.dumps(payload),
                )
                return {}, generator
            else:
                resp_json = self._mock_non_streaming_response(model, messages)
                end_time = datetime.now(timezone.utc)
                latency_ms = (time.monotonic() - start_mono) * 1000.0
                self._record_gateway_telemetry(
                    trace_id=trace_id,
                    span_id=span_id,
                    project=project,
                    db=db,
                    start_time=start_time,
                    end_time=end_time,
                    latency_ms=latency_ms,
                    model_name=model,
                    prompt_tokens=resp_json["usage"]["prompt_tokens"],
                    completion_tokens=resp_json["usage"]["completion_tokens"],
                    raw_request=json.dumps(payload),
                    raw_response=json.dumps(resp_json),
                    input_text=json.dumps(messages),
                    output_text=resp_json["choices"][0]["message"]["content"],
                )
                return resp_json, None

        # Real Upstream Forwarding via httpx
        if provider == "openai":
            upstream_url = f"{settings.OPENAI_BASE_URL}/chat/completions"
            headers = {
                "Authorization": f"Bearer {actual_key}",
                "Content-Type": "application/json",
            }
        else:
            # Anthropic messages API
            upstream_url = f"{settings.ANTHROPIC_BASE_URL}/messages"
            headers = {
                "x-api-key": actual_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            }

        async with httpx.AsyncClient(timeout=60.0) as client:
            if stream:
                # Streaming forwarding
                async def stream_upstream() -> AsyncGenerator[str, None]:
                    accumulated_content = []
                    prompt_tokens = sum(len(m.get("content", "").split()) for m in messages) * 2

                    async with client.stream("POST", upstream_url, json=payload, headers=headers) as upstream_resp:
                        async for chunk in upstream_resp.aiter_text():
                            yield chunk
                            # Parse SSE data chunk to collect content
                            for line in chunk.splitlines():
                                if line.startswith("data: ") and not line.endswith("[DONE]"):
                                    try:
                                        data = json.loads(line[6:])
                                        delta = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                        if delta:
                                            accumulated_content.append(delta)
                                    except Exception:
                                        pass

                    end_time = datetime.now(timezone.utc)
                    latency_ms = (time.monotonic() - start_mono) * 1000.0
                    output_text = "".join(accumulated_content)
                    completion_tokens = max(1, int(len(output_text.split()) * 1.3))

                    self._record_gateway_telemetry(
                        trace_id=trace_id,
                        span_id=span_id,
                        project=project,
                        db=db,
                        start_time=start_time,
                        end_time=end_time,
                        latency_ms=latency_ms,
                        model_name=model,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        raw_request=json.dumps(payload),
                        raw_response=output_text,
                        input_text=json.dumps(messages),
                        output_text=output_text,
                    )

                return {}, stream_upstream()
            else:
                response = await client.post(upstream_url, json=payload, headers=headers)
                resp_json = response.json()
                end_time = datetime.now(timezone.utc)
                latency_ms = (time.monotonic() - start_mono) * 1000.0

                usage = resp_json.get("usage", {})
                p_tokens = usage.get("prompt_tokens", 0)
                c_tokens = usage.get("completion_tokens", 0)
                output_content = resp_json.get("choices", [{}])[0].get("message", {}).get("content", "")

                self._record_gateway_telemetry(
                    trace_id=trace_id,
                    span_id=span_id,
                    project=project,
                    db=db,
                    start_time=start_time,
                    end_time=end_time,
                    latency_ms=latency_ms,
                    model_name=model,
                    prompt_tokens=p_tokens,
                    completion_tokens=c_tokens,
                    raw_request=json.dumps(payload),
                    raw_response=json.dumps(resp_json),
                    input_text=json.dumps(messages),
                    output_text=output_content,
                )
                return resp_json, None

    def _mock_non_streaming_response(self, model: str, messages: list) -> Dict[str, Any]:
        last_prompt = messages[-1]["content"] if messages else "Hello"
        mock_reply = (
            f"[Telemetria AI Gateway] Synthesized inference for model '{model}'. "
            f"Observed input prompt: '{last_prompt[:60]}...'. System operational."
        )
        prompt_tokens = max(10, int(len(str(messages)) / 4))
        completion_tokens = max(15, int(len(mock_reply) / 4))

        return {
            "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": mock_reply,
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            },
        }

    async def _mock_streaming_response(
        self,
        model: str,
        messages: list,
        trace_id: str,
        span_id: str,
        project: Project,
        db: Session,
        start_time: datetime,
        start_mono: float,
        raw_request: str,
    ) -> AsyncGenerator[str, None]:
        tokens = [
            "[Telemetria ",
            "Gateway ",
            "Stream] ",
            "Active ",
            "observability ",
            "in ",
            "motion: ",
            "model ",
            f"'{model}' ",
            "completed ",
            "prompt ",
            "inference.",
        ]

        chat_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
        created = int(time.time())

        for idx, word in enumerate(tokens):
            chunk = {
                "id": chat_id,
                "object": "chat.completion.chunk",
                "created": created,
                "model": model,
                "choices": [
                    {
                        "index": 0,
                        "delta": {"content": word} if idx > 0 else {"role": "assistant", "content": word},
                        "finish_reason": None,
                    }
                ],
            }
            yield f"data: {json.dumps(chunk)}\n\n"

        # Final finish chunk
        finish_chunk = {
            "id": chat_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": model,
            "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
        }
        yield f"data: {json.dumps(finish_chunk)}\n\n"
        yield "data: [DONE]\n\n"

        end_time = datetime.now(timezone.utc)
        latency_ms = (time.monotonic() - start_mono) * 1000.0
        full_output = "".join(tokens)
        prompt_tokens = max(10, int(len(str(messages)) / 4))
        completion_tokens = max(15, int(len(full_output) / 4))

        self._record_gateway_telemetry(
            trace_id=trace_id,
            span_id=span_id,
            project=project,
            db=db,
            start_time=start_time,
            end_time=end_time,
            latency_ms=latency_ms,
            model_name=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            raw_request=raw_request,
            raw_response=full_output,
            input_text=json.dumps(messages),
            output_text=full_output,
        )

    def _record_gateway_telemetry(
        self,
        trace_id: str,
        span_id: str,
        project: Project,
        db: Session,
        start_time: datetime,
        end_time: datetime,
        latency_ms: float,
        model_name: str,
        prompt_tokens: int,
        completion_tokens: int,
        raw_request: str,
        raw_response: str,
        input_text: str,
        output_text: str,
    ):
        """Asynchronously commit trace & span records to DB and raw data lake staging."""
        trace_item = TraceIngestItem(
            trace_id=trace_id,
            project_id=project.id,
            session_id=f"gw_session_{uuid.uuid4().hex[:8]}",
            input=input_text,
            output=output_text,
            start_time=start_time,
            end_time=end_time,
            latency_ms=latency_ms,
            tags={"source": "ai_gateway", "model": model_name},
            metadata={"gateway_routing": "direct", "total_tokens": prompt_tokens + completion_tokens},
            spans=[
                SpanIngestItem(
                    span_id=span_id,
                    trace_id=trace_id,
                    span_type="llm",
                    model_name=model_name,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    raw_request=raw_request,
                    raw_response=raw_response,
                )
            ],
        )

        batch = IngestBatchRequest(traces=[trace_item])
        # Ingestion service saves to DB and raw JSON lines
        self.ingestion_service.ingest_batch(batch, project, db)
