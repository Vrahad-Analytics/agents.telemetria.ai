from fastapi import APIRouter
from backend.api.v1.ingest import router as ingest_router
from backend.api.v1.gateway import router as gateway_router
from backend.api.v1.traces import router as traces_router
from backend.api.v1.projects import router as projects_router
from backend.api.v1.prompts import router as prompts_router
from backend.api.v1.evals import router as evals_router
from backend.api.v1.auth import router as auth_router
from backend.api.v1.providers import router as providers_router
from backend.api.v1.metrics import router as metrics_router
from backend.api.v1.sql_sandbox import router as sql_sandbox_router
from backend.api.v1.seed import router as seed_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(ingest_router)
api_router.include_router(gateway_router)
api_router.include_router(traces_router)
api_router.include_router(projects_router)
api_router.include_router(prompts_router)
api_router.include_router(evals_router)
api_router.include_router(providers_router)
api_router.include_router(metrics_router)
api_router.include_router(sql_sandbox_router)
api_router.include_router(seed_router)
