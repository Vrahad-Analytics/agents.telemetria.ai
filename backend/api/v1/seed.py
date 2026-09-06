from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models.operational import Project
from backend.services.telemetry_generator import seed_project_traffic

router = APIRouter(tags=["Telemetry Traffic Seeder"])


class SeedTrafficResponse(BaseModel):
    status: str
    project_id: str
    traces_generated: int
    message: str


@router.post("/projects/{project_id}/seed-traffic", response_model=SeedTrafficResponse)
def generate_live_traffic(
    project_id: str,
    count: int = Query(35, ge=1, le=100),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter((Project.id == project_id) | (Project.name == project_id)).first()
    if not project:
        project = db.query(Project).first()
        if not project:
            raise HTTPException(status_code=404, detail="No projects found.")

    inserted = seed_project_traffic(project.id, count=count, db=db)
    return SeedTrafficResponse(
        status="success",
        project_id=project.id,
        traces_generated=inserted,
        message=f"Successfully injected {inserted} realistic production traces and spans for project '{project.name}'."
    )
