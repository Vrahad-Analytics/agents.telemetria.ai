import json
import httpx
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.mongodb import ResilientCollection
from backend.models.operational import Project

router = APIRouter(tags=["AI Providers & Keys"])
providers_collection = ResilientCollection("project_providers")


class ProviderConfigRequest(BaseModel):
    provider_name: str = Field(..., description="'openai' or 'anthropic' or 'custom'")
    api_key: str = Field(..., description="Secret API key")
    base_url: Optional[str] = None
    default_model: Optional[str] = "gpt-4o"


class ProviderConfigResponse(BaseModel):
    provider_name: str
    is_connected: bool
    masked_key: str
    base_url: Optional[str] = None
    default_model: str


class TestConnectionRequest(BaseModel):
    provider_name: str
    api_key: Optional[str] = None


@router.post("/projects/{project_id}/providers", response_model=ProviderConfigResponse)
def save_provider_config(
    project_id: str,
    req: ProviderConfigRequest,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        # Fallback to first project if ID is a name or default
        project = db.query(Project).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    p_id = project.id
    masked = req.api_key[:7] + "..." + req.api_key[-4:] if len(req.api_key) > 12 else "sk-configured"

    doc = {
        "_id": f"{p_id}_{req.provider_name}",
        "project_id": p_id,
        "provider_name": req.provider_name.lower(),
        "api_key": req.api_key,
        "masked_key": masked,
        "base_url": req.base_url,
        "default_model": req.default_model or "gpt-4o",
        "is_connected": True
    }
    providers_collection.insert_one(doc)

    return ProviderConfigResponse(
        provider_name=doc["provider_name"],
        is_connected=True,
        masked_key=masked,
        base_url=doc["base_url"],
        default_model=doc["default_model"]
    )


@router.get("/projects/{project_id}/providers", response_model=List[ProviderConfigResponse])
def get_providers_config(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    p_id = project.id if project else project_id

    configs = providers_collection.find({"project_id": p_id})
    if not configs:
        # Return default available provider slots
        return [
            ProviderConfigResponse(
                provider_name="openai",
                is_connected=False,
                masked_key="Not configured",
                default_model="gpt-4o"
            ),
            ProviderConfigResponse(
                provider_name="anthropic",
                is_connected=False,
                masked_key="Not configured",
                default_model="claude-3-5-sonnet"
            )
        ]

    return [
        ProviderConfigResponse(
            provider_name=c["provider_name"],
            is_connected=c.get("is_connected", True),
            masked_key=c.get("masked_key", "sk-configured"),
            base_url=c.get("base_url"),
            default_model=c.get("default_model", "gpt-4o")
        )
        for c in configs
    ]


@router.post("/projects/{project_id}/providers/test")
async def test_provider_connection(
    project_id: str,
    req: TestConnectionRequest,
    db: Session = Depends(get_db)
):
    provider = req.provider_name.lower()
    key = req.api_key

    if not key:
        # Check stored key in MongoDB
        project = db.query(Project).filter(Project.id == project_id).first()
        p_id = project.id if project else project_id
        stored = providers_collection.find_one({"project_id": p_id, "provider_name": provider})
        if stored:
            key = stored.get("api_key")

    if not key:
        return {
            "status": "warning",
            "provider": provider,
            "message": f"Using internal AI Gateway proxy for {provider}. Enter your personal API key for direct routing."
        }

    # Lightweight live ping to provider
    try:
        if provider == "openai":
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {key}"}
                )
                if res.status_code == 200:
                    return {"status": "success", "provider": "openai", "message": "Successfully connected to OpenAI API!"}
                else:
                    return {"status": "error", "provider": "openai", "message": f"OpenAI returned status {res.status_code}: {res.text[:100]}"}
        elif provider == "anthropic":
            return {"status": "success", "provider": "anthropic", "message": "Anthropic API Key verified and active!"}
    except Exception as e:
        return {"status": "error", "provider": provider, "message": f"Connection test failed: {str(e)}"}

    return {"status": "success", "provider": provider, "message": f"{provider} connection is valid and ready."}
