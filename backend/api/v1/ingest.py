from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.api.v1.schemas import IngestBatchRequest, IngestBatchResponse
from backend.core.database import get_db
from backend.core.deps import get_current_project
from backend.models.operational import Project
from backend.services.ingestion_service import IngestionService

router = APIRouter(tags=["Ingestion"])
ingestion_service = IngestionService()


@router.post(
    "/ingest",
    response_model=IngestBatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest batch telemetry (Traces & Spans)",
    description="Accepts arrays of Trace and Span JSON payloads from the SDK, validates project API key, and persists to operational DB & raw data lake staging.",
)
def ingest_telemetry(
    batch: IngestBatchRequest,
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
) -> IngestBatchResponse:
    return ingestion_service.ingest_batch(batch, project, db)
