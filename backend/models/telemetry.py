from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base, TimestampMixin, utc_now
from backend.models.operational import generate_uuid


class TraceRecord(Base, TimestampMixin):
    __tablename__ = "trace_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    input: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    output: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_output: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    tags: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), default=dict, nullable=False
    )
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"), default=dict, nullable=False
    )

    # Relationships
    spans: Mapped[List["SpanRecord"]] = relationship(
        "SpanRecord", back_populates="trace", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<TraceRecord id={self.id} project_id={self.project_id} latency={self.latency_ms}ms>"


class SpanRecord(Base, TimestampMixin):
    __tablename__ = "span_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    trace_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("trace_records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_span_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    span_type: Mapped[str] = mapped_column(String(32), default="llm", nullable=False)  # llm, tool, function
    model_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    raw_request: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    trace: Mapped["TraceRecord"] = relationship("TraceRecord", back_populates="spans")

    def __repr__(self) -> str:
        return f"<SpanRecord id={self.id} type={self.span_type} model={self.model_name}>"
