from typing import Any, Dict, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models.operational import Dataset, Project, PromptTemplate

router = APIRouter(tags=["Evaluations & Datasets"])


class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DatasetResponse(BaseModel):
    id: str
    project_id: str
    name: str
    description: Optional[str] = None


class PromptComparisonRequest(BaseModel):
    prompt_a_id: str
    prompt_b_id: str
    dataset_id: Optional[str] = None
    mock_metrics: bool = True  # Allows instant simulation for playground/eval UI testing


class PromptComparisonResult(BaseModel):
    prompt_a: Dict[str, Any]
    prompt_b: Dict[str, Any]
    test_cases: List[Dict[str, Any]]
    summary: Dict[str, Any]


@router.post("/projects/{project_id}/datasets", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
def create_dataset(project_id: str, req: DatasetCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ds = Dataset(project_id=project_id, name=req.name, description=req.description)
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return DatasetResponse(id=ds.id, project_id=ds.project_id, name=ds.name, description=ds.description)


@router.get("/projects/{project_id}/datasets", response_model=List[DatasetResponse])
def list_datasets(project_id: str, db: Session = Depends(get_db)):
    datasets = db.query(Dataset).filter(Dataset.project_id == project_id).all()
    return [DatasetResponse(id=d.id, project_id=d.project_id, name=d.name, description=d.description) for d in datasets]


@router.post("/projects/{project_id}/evaluations/compare", response_model=PromptComparisonResult)
def compare_prompts(project_id: str, req: PromptComparisonRequest, db: Session = Depends(get_db)):
    prompt_a = db.query(PromptTemplate).filter(PromptTemplate.id == req.prompt_a_id).first()
    prompt_b = db.query(PromptTemplate).filter(PromptTemplate.id == req.prompt_b_id).first()

    if not prompt_a or not prompt_b:
        raise HTTPException(status_code=404, detail="One or both prompt templates not found")

    # Sample test benchmark items for evaluation view
    benchmark_cases = [
        {
            "id": "case-1",
            "input": "Summarize user churn reasons from Q3 telemetry data.",
            "expected_output": "High latency on search and missing export features.",
            "output_a": "Users experienced churn primarily driven by query latency regressions and missing data export options.",
            "output_b": "Customers left because the app was slow and lacked CSV download.",
            "score_a": 0.94,
            "score_b": 0.81,
            "latency_a_ms": 420.0,
            "latency_b_ms": 510.0,
        },
        {
            "id": "case-2",
            "input": "Extract entity tags: 'Order #4092 shipped via FedEx to Seattle on 2026-08-12'",
            "expected_output": "ORDER_ID: 4092, CARRIER: FedEx, DEST: Seattle, DATE: 2026-08-12",
            "output_a": "{\"order_id\": \"4092\", \"carrier\": \"FedEx\", \"destination\": \"Seattle\", \"date\": \"2026-08-12\"}",
            "output_b": "FedEx order 4092 in Seattle.",
            "score_a": 0.98,
            "score_b": 0.65,
            "latency_a_ms": 310.0,
            "latency_b_ms": 290.0,
        },
        {
            "id": "case-3",
            "input": "Translate Python snippet to idiomatic TypeScript with strict types.",
            "expected_output": "export interface Config { timeout: number; } ...",
            "output_a": "export interface TelemetryConfig { timeoutMs: number; retries: number; }",
            "output_b": "interface Config { timeout: any }",
            "score_a": 0.96,
            "score_b": 0.72,
            "latency_a_ms": 610.0,
            "latency_b_ms": 580.0,
        },
    ]

    avg_score_a = sum(c["score_a"] for c in benchmark_cases) / len(benchmark_cases)
    avg_score_b = sum(c["score_b"] for c in benchmark_cases) / len(benchmark_cases)
    avg_lat_a = sum(c["latency_a_ms"] for c in benchmark_cases) / len(benchmark_cases)
    avg_lat_b = sum(c["latency_b_ms"] for c in benchmark_cases) / len(benchmark_cases)

    return PromptComparisonResult(
        prompt_a={
            "id": prompt_a.id,
            "name": prompt_a.name,
            "version": prompt_a.version,
            "template_string": prompt_a.template_string,
            "model_params": prompt_a.model_params,
            "avg_score": round(avg_score_a, 3),
            "avg_latency_ms": round(avg_lat_a, 1),
        },
        prompt_b={
            "id": prompt_b.id,
            "name": prompt_b.name,
            "version": prompt_b.version,
            "template_string": prompt_b.template_string,
            "model_params": prompt_b.model_params,
            "avg_score": round(avg_score_b, 3),
            "avg_latency_ms": round(avg_lat_b, 1),
        },
        test_cases=benchmark_cases,
        summary={
            "winner": prompt_a.name if avg_score_a >= avg_score_b else prompt_b.name,
            "score_delta": round(avg_score_a - avg_score_b, 3),
            "latency_delta_ms": round(avg_lat_a - avg_lat_b, 1),
            "total_test_cases": len(benchmark_cases),
        },
    )
