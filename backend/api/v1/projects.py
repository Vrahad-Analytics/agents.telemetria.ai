from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import generate_api_key
from backend.models.operational import Organization, Project, PromptTemplate, Dataset

router = APIRouter(prefix="/projects", tags=["Projects"])


class CreateProjectRequest(BaseModel):
    name: str
    org_id: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    org_id: str
    api_key: Optional[str] = None  # Only returned upon initial creation


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(req: CreateProjectRequest, db: Session = Depends(get_db)):
    org_id = req.org_id
    if not org_id:
        # Default or first organization
        first_org = db.query(Organization).first()
        if not first_org:
            first_org = Organization(name="Default Organization")
            db.add(first_org)
            db.flush()
        org_id = first_org.id

    raw_key, hashed_key = generate_api_key()
    proj = Project(name=req.name, org_id=org_id, api_key=hashed_key)
    db.add(proj)
    db.commit()
    db.refresh(proj)

    # Persist in MongoDB
    try:
        from backend.core.mongodb import projects_collection
        from datetime import datetime
        projects_collection.insert_one({
            "_id": proj.id,
            "id": proj.id,
            "name": proj.name,
            "org_id": proj.org_id,
            "api_key_prefix": raw_key[:10] + "...",
            "created_at": datetime.utcnow().isoformat()
        })
    except Exception:
        pass

    return ProjectResponse(
        id=proj.id,
        name=proj.name,
        org_id=proj.org_id,
        api_key=raw_key,  # Returned only once upon creation
    )


@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return [ProjectResponse(id=p.id, name=p.name, org_id=p.org_id) for p in projects]
