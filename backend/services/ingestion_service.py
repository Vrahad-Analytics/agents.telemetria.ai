import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Tuple
from sqlalchemy.orm import Session

from backend.api.v1.schemas import IngestBatchRequest, IngestBatchResponse
from backend.core.config import settings
from backend.models.operational import Project
from backend.models.telemetry import TraceRecord, SpanRecord


class IngestionService:
    def __init__(self, raw_logs_dir: Path | None = None):
        self.raw_logs_dir = raw_logs_dir or settings.RAW_LOGS_DIR

    def ingest_batch(
        self,
        batch: IngestBatchRequest,
        project: Project,
        db: Session
    ) -> IngestBatchResponse:
        """
        Process a batch of Traces and Spans:
        1. Store operational records in PostgreSQL for immediate querying.
        2. Append raw JSONL lines to partitioned disk/storage for PySpark batch jobs.
        """
        now = datetime.now(timezone.utc)
        total_traces = 0
        total_spans = 0

        # 1. Operational Database Persistence
        for trace_item in batch.traces:
            trace_rec = TraceRecord(
                id=trace_item.trace_id,
                project_id=project.id,
                session_id=trace_item.session_id,
                input=trace_item.input,
                output=trace_item.output,
                expected_output=trace_item.expected_output,
                start_time=trace_item.start_time,
                end_time=trace_item.end_time,
                latency_ms=trace_item.latency_ms,
                tags=trace_item.tags,
                metadata_json=trace_item.metadata,
            )
            db.merge(trace_rec)  # Use merge for idempotence
            total_traces += 1

            for span_item in trace_item.spans:
                span_rec = SpanRecord(
                    id=span_item.span_id,
                    trace_id=trace_item.trace_id,
                    parent_span_id=span_item.parent_span_id,
                    span_type=span_item.span_type,
                    model_name=span_item.model_name,
                    prompt_tokens=span_item.prompt_tokens,
                    completion_tokens=span_item.completion_tokens,
                    raw_request=span_item.raw_request,
                    raw_response=span_item.raw_response,
                )
                db.merge(span_rec)
                total_spans += 1

        for span_item in batch.spans:
            span_rec = SpanRecord(
                id=span_item.span_id,
                trace_id=span_item.trace_id,
                parent_span_id=span_item.parent_span_id,
                span_type=span_item.span_type,
                model_name=span_item.model_name,
                prompt_tokens=span_item.prompt_tokens,
                completion_tokens=span_item.completion_tokens,
                raw_request=span_item.raw_request,
                raw_response=span_item.raw_response,
            )
            db.merge(span_rec)
            total_spans += 1

        db.commit()

        # 2. Raw JSON Staging for PySpark ingestion
        log_file_path = self._write_raw_logs(batch, project.id, now)

        return IngestBatchResponse(
            status="success",
            project_id=project.id,
            traces_ingested=total_traces,
            spans_ingested=total_spans,
            raw_log_file=str(log_file_path),
        )

    def _write_raw_logs(
        self,
        batch: IngestBatchRequest,
        project_id: str,
        timestamp: datetime
    ) -> Path:
        """Write raw telemetry records as JSON Lines into date-partitioned storage."""
        date_partition = timestamp.strftime("%Y/%m/%d")
        partition_dir = self.raw_logs_dir / date_partition
        partition_dir.mkdir(parents=True, exist_ok=True)

        batch_id = uuid.uuid4().hex[:12]
        file_path = partition_dir / f"telemetry_{project_id[:8]}_{batch_id}.jsonl"

        with open(file_path, "a", encoding="utf-8") as f:
            for trace_item in batch.traces:
                trace_dict = trace_item.model_dump(mode="json")
                trace_dict["project_id"] = project_id
                trace_dict["record_type"] = "trace"
                trace_dict["ingested_at"] = timestamp.isoformat()
                f.write(json.dumps(trace_dict) + "\n")

            for span_item in batch.spans:
                span_dict = span_item.model_dump(mode="json")
                span_dict["project_id"] = project_id
                span_dict["record_type"] = "span"
                span_dict["ingested_at"] = timestamp.isoformat()
                f.write(json.dumps(span_dict) + "\n")

        return file_path
