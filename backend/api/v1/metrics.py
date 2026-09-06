import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.core.database import get_db
from backend.models.operational import Project
from backend.models.telemetry import TraceRecord, SpanRecord

router = APIRouter(tags=["Metrics & Analytics"])


class LatencyPercentiles(BaseModel):
    p50_ms: float
    p90_ms: float
    p95_ms: float
    p99_ms: float
    avg_ms: float
    min_ms: float
    max_ms: float


class TimeSeriesBucket(BaseModel):
    timestamp: str
    count: int
    p50_ms: float
    p90_ms: float
    errors: int
    tokens: int


class ProjectMetricsResponse(BaseModel):
    project_id: str
    total_traces: int
    total_spans: int
    total_tokens: int
    prompt_tokens: int
    completion_tokens: int
    estimated_cost_usd: float
    error_count: int
    error_rate: float
    latency: LatencyPercentiles
    timeseries: List[TimeSeriesBucket]
    top_models: List[Dict[str, Any]]


def calculate_percentile(sorted_values: List[float], percentile: float) -> float:
    if not sorted_values:
        return 0.0
    k = (len(sorted_values) - 1) * (percentile / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_values[int(k)]
    d0 = sorted_values[int(f)] * (c - k)
    d1 = sorted_values[int(c)] * (k - f)
    return round(d0 + d1, 2)


@router.get("/projects/{project_id}/metrics", response_model=ProjectMetricsResponse)
def get_project_metrics(
    project_id: str,
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        (Project.id == project_id) | (Project.name == project_id)
    ).first()
    
    if not project:
        # Fallback to first available project
        project = db.query(Project).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    p_id = project.id
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

    traces = (
        db.query(TraceRecord)
        .filter(TraceRecord.project_id == p_id)
        .filter(TraceRecord.start_time >= cutoff)
        .order_by(TraceRecord.start_time.asc())
        .all()
    )

    if not traces:
        # If no traces in window, fallback to all traces for this project
        traces = (
            db.query(TraceRecord)
            .filter(TraceRecord.project_id == p_id)
            .order_by(TraceRecord.start_time.asc())
            .all()
        )

    total_traces = len(traces)
    latencies = sorted([t.latency_ms for t in traces if t.latency_ms is not None])
    
    p50 = calculate_percentile(latencies, 50)
    p90 = calculate_percentile(latencies, 90)
    p95 = calculate_percentile(latencies, 95)
    p99 = calculate_percentile(latencies, 99)
    avg_ms = round(sum(latencies) / len(latencies), 2) if latencies else 0.0
    min_ms = round(min(latencies), 2) if latencies else 0.0
    max_ms = round(max(latencies), 2) if latencies else 0.0

    # Spans & Tokens
    trace_ids = [t.id for t in traces]
    spans = []
    if trace_ids:
        spans = db.query(SpanRecord).filter(SpanRecord.trace_id.in_(trace_ids)).all()

    total_spans = len(spans)
    prompt_tokens = sum(s.prompt_tokens or 0 for s in spans)
    completion_tokens = sum(s.completion_tokens or 0 for s in spans)
    total_tokens = prompt_tokens + completion_tokens

    # Estimated Cost ($2.50 per 1M prompt tokens, $10.00 per 1M completion tokens for GPT-4o approx)
    cost = round((prompt_tokens * 0.0000025) + (completion_tokens * 0.000010), 4)

    # Error analysis
    error_count = sum(1 for t in traces if (t.tags and t.tags.get("error")) or (t.metadata_json and t.metadata_json.get("error")))
    error_rate = round((error_count / total_traces) * 100.0, 2) if total_traces > 0 else 0.0

    # Top models
    model_counts: Dict[str, int] = {}
    for s in spans:
        m = s.model_name or "gpt-4o"
        model_counts[m] = model_counts.get(m, 0) + 1
    
    top_models = [
        {"model": m, "count": cnt, "percentage": round((cnt / total_spans) * 100, 1) if total_spans else 100}
        for m, cnt in sorted(model_counts.items(), key=lambda x: x[1], reverse=True)
    ]
    if not top_models:
        top_models = [{"model": "gpt-4o", "count": total_traces, "percentage": 100.0}]

    # Time series aggregation (12 buckets)
    bucket_count = 12
    now = datetime.now(timezone.utc)
    interval = timedelta(hours=hours / bucket_count)
    timeseries: List[TimeSeriesBucket] = []

    for i in range(bucket_count):
        b_start = cutoff + (interval * i)
        b_end = b_start + interval
        b_traces = [
            t for t in traces
            if b_start <= (t.start_time.replace(tzinfo=timezone.utc) if t.start_time.tzinfo is None else t.start_time) < b_end
        ]
        b_lats = sorted([t.latency_ms for t in b_traces if t.latency_ms is not None])
        b_errors = sum(1 for t in b_traces if (t.tags and t.tags.get("error")) or (t.metadata_json and t.metadata_json.get("error")))
        
        # Approximate tokens
        b_tokens = sum(
            int(t.metadata_json.get("total_tokens", 150)) if (t.metadata_json and "total_tokens" in t.metadata_json) else 150
            for t in b_traces
        )

        timeseries.append(
            TimeSeriesBucket(
                timestamp=b_start.strftime("%H:%M"),
                count=len(b_traces),
                p50_ms=calculate_percentile(b_lats, 50),
                p90_ms=calculate_percentile(b_lats, 90),
                errors=b_errors,
                tokens=b_tokens,
            )
        )

    return ProjectMetricsResponse(
        project_id=p_id,
        total_traces=total_traces,
        total_spans=total_spans,
        total_tokens=total_tokens,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        estimated_cost_usd=cost,
        error_count=error_count,
        error_rate=error_rate,
        latency=LatencyPercentiles(
            p50_ms=p50,
            p90_ms=p90,
            p95_ms=p95,
            p99_ms=p99,
            avg_ms=avg_ms,
            min_ms=min_ms,
            max_ms=max_ms,
        ),
        timeseries=timeseries,
        top_models=top_models,
    )
