from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models.operational import Project, PromptTemplate

router = APIRouter(tags=["Prompts"])


class PromptTemplateCreate(BaseModel):
    name: str = Field(..., description="Name of the prompt template")
    template_string: str = Field(..., description="Prompt string with variables like {query}")
    version: int = Field(1, description="Version number")
    model_params: Dict[str, Any] = Field(
        default_factory=lambda: {"model": "gpt-4o", "temperature": 0.2, "max_tokens": 1024}
    )


class PromptTemplateResponse(BaseModel):
    id: str
    project_id: str
    name: str
    template_string: str
    version: int
    model_params: Dict[str, Any]


@router.post("/projects/{project_id}/prompts", response_model=PromptTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_prompt_template(
    project_id: str,
    req: PromptTemplateCreate,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    prompt = PromptTemplate(
        project_id=project_id,
        name=req.name,
        template_string=req.template_string,
        version=req.version,
        model_params=req.model_params,
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)

    return PromptTemplateResponse(
        id=prompt.id,
        project_id=prompt.project_id,
        name=prompt.name,
        template_string=prompt.template_string,
        version=prompt.version,
        model_params=prompt.model_params,
    )


@router.get("/projects/{project_id}/prompts", response_model=List[PromptTemplateResponse])
def list_prompt_templates(project_id: str, db: Session = Depends(get_db)):
    prompts = (
        db.query(PromptTemplate)
        .filter(PromptTemplate.project_id == project_id)
        .order_by(PromptTemplate.name, PromptTemplate.version.desc())
        .all()
    )
    return [
        PromptTemplateResponse(
            id=p.id,
            project_id=p.project_id,
            name=p.name,
            template_string=p.template_string,
            version=p.version,
            model_params=p.model_params,
        )
        for p in prompts
    ]
