import asyncio
import contextvars
from datetime import datetime, timezone
import functools
import inspect
import json
import time
import traceback
import uuid
from typing import Any, Callable, Dict, Optional, TypeVar, cast

from sdk.src.observability.models import SpanPayload, SpanType, TracePayload
from sdk.src.observability.shipper import AsyncShipper

_current_trace_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "current_trace_id", default=None
)
_current_span_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "current_span_id", default=None
)

_global_shipper: Optional[AsyncShipper] = None
_global_project_id: Optional[str] = None

F = TypeVar("F", bound=Callable[..., Any])


def init(
    api_key: str,
    endpoint: str = "http://localhost:8000/v1/ingest",
    project_id: Optional[str] = None,
    batch_size: int = 25,
    flush_interval_seconds: float = 1.0,
    client: Optional[Any] = None,
) -> None:
    """Initialize the Telemetria Observability SDK with an API key and backend ingest endpoint."""
    global _global_shipper, _global_project_id
    _global_project_id = project_id
    _global_shipper = AsyncShipper(
        api_key=api_key,
        endpoint=endpoint,
        project_id=project_id,
        batch_size=batch_size,
        flush_interval_seconds=flush_interval_seconds,
        client=client,
    )


def flush(timeout: float = 5.0) -> bool:
    """Flush pending telemetry payloads to the backend."""
    if _global_shipper:
        return _global_shipper.flush(timeout=timeout)
    return True


def shutdown(timeout: float = 3.0) -> None:
    """Shut down the SDK background worker thread."""
    if _global_shipper:
        _global_shipper.shutdown(timeout=timeout)


def _safe_serialize(val: Any) -> str:
    """Safely serialize arbitrary Python values to string/JSON."""
    try:
        return json.dumps(val, default=str)
    except Exception:
        return str(val)


def trace(
    name_or_func: Any = None,
    *,
    span_type: str = SpanType.FUNCTION.value,
    tags: Optional[Dict[str, str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Any:
    """
    Decorator to wrap arbitrary Python functions (sync or async) with full active observability.
    Captures inputs, outputs, exceptions, timing, and nested execution spans.
    """

    def decorator(fn: F) -> F:
        fn_name = fn.__name__

        @functools.wraps(fn)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            return await _execute_traced(fn, True, fn_name, span_type, tags, metadata, *args, **kwargs)

        @functools.wraps(fn)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            return _execute_traced(fn, False, fn_name, span_type, tags, metadata, *args, **kwargs)

        if inspect.iscoroutinefunction(fn):
            return cast(F, async_wrapper)
        return cast(F, sync_wrapper)

    if callable(name_or_func):
        return decorator(name_or_func)
    return decorator


def _execute_traced(
    fn: Callable[..., Any],
    is_async: bool,
    name: str,
    span_type: str,
    tags: Optional[Dict[str, str]],
    metadata: Optional[Dict[str, Any]],
    *args: Any,
    **kwargs: Any,
) -> Any:
    start_dt = datetime.now(timezone.utc)
    start_mono = time.monotonic()

    # Determine trace hierarchy
    existing_trace_id = _current_trace_id.get()
    parent_span_id = _current_span_id.get()
    is_root = existing_trace_id is None

    trace_id = existing_trace_id or f"trc_{uuid.uuid4().hex[:16]}"
    span_id = f"spn_{uuid.uuid4().hex[:16]}"

    token_trace = _current_trace_id.set(trace_id)
    token_span = _current_span_id.set(span_id)

    # Serialize inputs
    call_args: Dict[str, Any] = {}
    try:
        sig = inspect.signature(fn)
        bound = sig.bind_partial(*args, **kwargs)
        call_args = {k: v for k, v in bound.arguments.items()}
    except Exception:
        call_args = {"args": args, "kwargs": kwargs}

    input_serialized = _safe_serialize(call_args)
    output_serialized = None
    error_raised = None

    try:
        if is_async:
            result = asyncio.run(fn(*args, **kwargs)) if not asyncio.iscoroutine(fn(*args, **kwargs)) else None  # type: ignore
        else:
            result = fn(*args, **kwargs)
        output_serialized = _safe_serialize(result)
        return result
    except Exception as exc:
        error_raised = exc
        output_serialized = f"ERROR: {type(exc).__name__}: {str(exc)}\n{traceback.format_exc()}"
        raise exc
    finally:
        end_dt = datetime.now(timezone.utc)
        latency_ms = (time.monotonic() - start_mono) * 1000.0

        _current_trace_id.reset(token_trace)
        _current_span_id.reset(token_span)

        span = SpanPayload(
            span_id=span_id,
            trace_id=trace_id,
            parent_span_id=parent_span_id,
            span_type=span_type,
            model_name=kwargs.get("model") or getattr(fn, "__model__", None),
            prompt_tokens=kwargs.get("prompt_tokens", 0),
            completion_tokens=kwargs.get("completion_tokens", 0),
            raw_request=input_serialized,
            raw_response=output_serialized,
            start_time=start_dt.isoformat(),
            end_time=end_dt.isoformat(),
            latency_ms=latency_ms,
        )

        if is_root:
            all_tags = {"function": name}
            if tags:
                all_tags.update(tags)
            all_meta = {"module": getattr(fn, "__module__", "")}
            if metadata:
                all_meta.update(metadata)
            if error_raised:
                all_tags["status"] = "error"
                all_meta["error_type"] = type(error_raised).__name__

            trace_payload = TracePayload(
                trace_id=trace_id,
                project_id=_global_project_id,
                start_time=start_dt.isoformat(),
                end_time=end_dt.isoformat(),
                latency_ms=latency_ms,
                input=input_serialized,
                output=output_serialized,
                tags=all_tags,
                metadata=all_meta,
                spans=[span],
            )
            if _global_shipper:
                _global_shipper.enqueue(trace_payload)
        else:
            if _global_shipper:
                _global_shipper.enqueue(span)
