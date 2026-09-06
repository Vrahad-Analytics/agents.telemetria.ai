import dataclasses
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class SpanType(str, Enum):
    LLM = "llm"
    TOOL = "tool"
    FUNCTION = "function"


@dataclasses.dataclass
class SpanPayload:
    span_id: str
    trace_id: str
    parent_span_id: Optional[str] = None
    span_type: str = SpanType.FUNCTION.value
    model_name: Optional[str] = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    raw_request: Optional[str] = None
    raw_response: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    latency_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            k: v for k, v in dataclasses.asdict(self).items() if v is not None
        }


@dataclasses.dataclass
class TracePayload:
    trace_id: str
    start_time: str
    end_time: str
    latency_ms: float
    project_id: Optional[str] = None
    session_id: Optional[str] = None
    input: Optional[str] = None
    output: Optional[str] = None
    expected_output: Optional[str] = None
    tags: Dict[str, str] = dataclasses.field(default_factory=dict)
    metadata: Dict[str, Any] = dataclasses.field(default_factory=dict)
    spans: List[SpanPayload] = dataclasses.field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        d = dataclasses.asdict(self)
        d["spans"] = [s.to_dict() if hasattr(s, "to_dict") else s for s in self.spans]
        return {k: v for k, v in d.items() if v is not None}
