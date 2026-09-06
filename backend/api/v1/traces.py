from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from backend.api.v1.schemas import TraceIngestItem, SpanIngestItem
from backend.core.database import get_db
from backend.core.mongodb import ResilientCollection
from backend.models.operational import Project
from backend.models.telemetry import TraceRecord, SpanRecord

router = APIRouter(tags=["Traces"])
reviews_collection = ResilientCollection("trace_reviews")


class PaginatedTracesResponse(BaseModel):
    total: int
    limit: int
    offset: int
    project_id: str
    items: List[TraceIngestItem]


class TraceReviewRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="1 to 5 star rating")
    notes: Optional[str] = Field(None, description="Reviewer feedback or notes")
    label: Optional[str] = Field("good", description="'good', 'bad', 'ambiguous'")
    reviewer: Optional[str] = Field("admin@telemetria.ai", description="Reviewer email or username")


class TraceReviewResponse(BaseModel):
    status: str
    trace_id: str
    rating: int
    label: str
    notes: Optional[str] = None
    reviewed_at: str
    reviewer: str


def _resolve_project(project_id: str, db: Session) -> Optional[Project]:
    proj = db.query(Project).filter(
        (Project.id == project_id) | (Project.name == project_id)
    ).first()
    if not proj:
        proj = db.query(Project).first()
    return proj


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
    project = _resolve_project(project_id, db)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID or name '{project_id}' not found.",
        )

    p_id = project.id
    query = (
        db.query(TraceRecord)
        .options(joinedload(TraceRecord.spans))
        .filter(TraceRecord.project_id == p_id)
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

        # Attach review if present
        meta = dict(rec.metadata_json or {})
        stored_review = reviews_collection.find_one({"trace_id": rec.id})
        if stored_review:
            meta["review"] = {
                "rating": stored_review.get("rating"),
                "label": stored_review.get("label"),
                "notes": stored_review.get("notes"),
                "reviewer": stored_review.get("reviewer"),
            }

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
                metadata=meta,
                spans=spans,
            )
        )

    return PaginatedTracesResponse(
        total=total,
        limit=limit,
        offset=offset,
        project_id=p_id,
        items=items,
    )


@router.post(
    "/projects/{project_id}/traces/{trace_id}/review",
    response_model=TraceReviewResponse,
    summary="Submit human review score and feedback for a trace",
)
def submit_trace_review(
    project_id: str,
    trace_id: str,
    req: TraceReviewRequest,
    db: Session = Depends(get_db),
):
    project = _resolve_project(project_id, db)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    trace = db.query(TraceRecord).filter(
        TraceRecord.id == trace_id,
        TraceRecord.project_id == project.id
    ).first()

    if not trace:
        # Also try matching just by trace_id
        trace = db.query(TraceRecord).filter(TraceRecord.id == trace_id).first()
        if not trace:
            raise HTTPException(status_code=404, detail="Trace record not found")

    now_str = datetime.now(timezone.utc).isoformat()
    review_data = {
        "rating": req.rating,
        "label": req.label or "good",
        "notes": req.notes,
        "reviewer": req.reviewer or "admin@telemetria.ai",
        "reviewed_at": now_str,
    }

    # Persist in SQLite/Postgres
    meta = dict(trace.metadata_json or {})
    meta["review"] = review_data
    trace.metadata_json = meta
    db.commit()

    # Persist in MongoDB
    try:
        reviews_collection.insert_one({
            "_id": f"{trace.id}_review",
            "trace_id": trace.id,
            "project_id": project.id,
            **review_data
        })
    except Exception:
        pass

    return TraceReviewResponse(
        status="success",
        trace_id=trace.id,
        rating=req.rating,
        label=req.label or "good",
        notes=req.notes,
        reviewed_at=now_str,
        reviewer=req.reviewer or "admin@telemetria.ai",
    )


@router.get(
    "/projects/{project_id}/review-queue",
    summary="Get traces waiting for human review",
)
def get_review_queue(
    project_id: str,
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    project = _resolve_project(project_id, db)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get recent traces
    traces = (
        db.query(TraceRecord)
        .filter(TraceRecord.project_id == project.id)
        .order_by(TraceRecord.start_time.desc())
        .limit(limit * 2)
        .all()
    )

    unreviewed = []
    for t in traces:
        m = t.metadata_json or {}
        if "review" not in m:
            unreviewed.append({
                "trace_id": t.id,
                "project_id": t.project_id,
                "input": t.input,
                "output": t.output,
                "latency_ms": t.latency_ms,
                "start_time": t.start_time.isoformat() if t.start_time else None,
                "tags": t.tags or {},
            })
            if len(unreviewed) >= limit:
                break

    return {
        "project_id": project.id,
        "queue_count": len(unreviewed),
        "items": unreviewed,
    }
