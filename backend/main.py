from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.v1.router import api_router
from backend.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure logs staging directory exists on startup
    settings.RAW_LOGS_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="Telemetria AI - Active Observability & Evaluation Platform",
    description="Production-grade AI Observability, Tracing, Evaluation, and Gateway Control Plane.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Next.js frontend & arbitrary clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount v1 API
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "telemetria-backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
