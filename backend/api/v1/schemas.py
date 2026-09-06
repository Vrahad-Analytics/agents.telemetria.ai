from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class SpanIngestItem(BaseModel):
    span_id: str = Field(..., description="Unique span ID")
    trace_id: str = Field(..., description="Trace ID this span belongs to")
    parent_span_id: Optional[str] = Field(None, description="Parent span ID if nested")
    span_type: str = Field("llm", description="Type of span (llm, tool, function, retrieval, agent)")
    model_name: Optional[str] = Field(None, description="Model name if LLM span")
    prompt_tokens: int = Field(0, ge=0, description="Tokens used in prompt")
    completion_tokens: int = Field(0, ge=0, description="Tokens used in completion")
    raw_request: Optional[str] = Field(None, description="Raw request JSON or text")
    raw_response: Optional[str] = Field(None, description="Raw response JSON or text")
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    latency_ms: Optional[float] = 0.0


class TraceIngestItem(BaseModel):
    trace_id: str = Field(..., description="Unique trace ID")
    project_id: Optional[str] = Field(None, description="Associated Project ID (if not inferred from API key)")
    session_id: Optional[str] = Field(None, description="Optional user/session identifier")
    input: Optional[str] = Field(None, description="Input string or serialized representation")
    output: Optional[str] = Field(None, description="Output string or serialized representation")
    expected_output: Optional[str] = Field(None, description="Expected ground truth output")
    start_time: datetime = Field(..., description="Start timestamp")
    end_time: datetime = Field(..., description="End timestamp")
    latency_ms: float = Field(0.0, ge=0.0, description="Latency in milliseconds")
    tags: Dict[str, str] = Field(default_factory=dict, description="Metadata tags")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary nested JSON metadata")
    spans: List[SpanIngestItem] = Field(default_factory=list, description="Child spans")


class IngestBatchRequest(BaseModel):
    traces: List[TraceIngestItem] = Field(default_factory=list, description="Array of trace payloads")
    spans: List[SpanIngestItem] = Field(default_factory=list, description="Array of standalone span payloads")


class IngestBatchResponse(BaseModel):
    status: str = "success"
    project_id: str
    traces_ingested: int
    spans_ingested: int
    raw_log_file: Optional[str] = None
