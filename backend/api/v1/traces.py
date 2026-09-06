from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from backend.api.v1.schemas import TraceIngestItem, SpanIngestItem
from backend.core.database import get_db
from backend.models.operational import Project
from backend.models.telemetry import TraceRecord, SpanRecord

router = APIRouter(tags=["Traces"])


class PaginatedTracesResponse(BaseModel):
    total: int
    limit: int
    offset: int
    project_id: str
    items: List[TraceIngestItem]


@router.get(
    "/projects/{project_id}/traces",
    response_model=PaginatedTracesResponse,
    summary="Retrieve parsed traces for a project",
    description="Returns paginated traces with child spans, latency, and token metrics for the frontend UI.",
)
def get_project_traces(
    project_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> PaginatedTracesResponse:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{project_id}' not found.",
        )

    query = (
        db.query(TraceRecord)
        .options(joinedload(TraceRecord.spans))
        .filter(TraceRecord.project_id == project_id)
    )

    if session_id:
        query = query.filter(TraceRecord.session_id == session_id)

    total = query.count()
    records = query.order_by(TraceRecord.start_time.desc()).offset(offset).limit(limit).all()

    items = []
    for rec in records:
        spans = [
            SpanIngestItem(
                span_id=s.id,
                trace_id=s.trace_id,
                parent_span_id=s.parent_span_id,
                span_type=s.span_type,  # type: ignore
                model_name=s.model_name,
                prompt_tokens=s.prompt_tokens,
                completion_tokens=s.completion_tokens,
                raw_request=s.raw_request,
                raw_response=s.raw_response,
            )
            for s in rec.spans
        ]

        items.append(
            TraceIngestItem(
                trace_id=rec.id,
                project_id=rec.project_id,
                session_id=rec.session_id,
                input=rec.input,
                output=rec.output,
                expected_output=rec.expected_output,
                start_time=rec.start_time,
                end_time=rec.end_time,
                latency_ms=rec.latency_ms,
                tags=rec.tags or {},
                metadata=rec.metadata_json or {},
                spans=spans,
            )
        )

    return PaginatedTracesResponse(
        total=total,
        limit=limit,
        offset=offset,
        project_id=project_id,
        items=items,
    )
