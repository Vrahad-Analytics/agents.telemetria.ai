from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Header, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.deps import get_current_project
from backend.models.operational import Project
from backend.services.gateway_service import GatewayService

router = APIRouter(prefix="/gateway", tags=["AI Gateway"])
gateway_service = GatewayService()


@router.post(
    "/chat/completions",
    summary="OpenAI-compatible chat completions proxy",
    description="Routes LLM requests to OpenAI/Anthropic based on headers, supports SSE streaming, and logs exact spans and tokens.",
)
async def chat_completions_proxy(
    request: Request,
    x_provider: Optional[str] = Header(None, description="Optional target provider: 'openai' or 'anthropic'"),
    x_provider_key: Optional[str] = Header(None, description="Optional personal API key for direct provider upstream"),
    project: Project = Depends(get_current_project),
    db: Session = Depends(get_db),
):
    try:
        body: Dict[str, Any] = await request.json()
    except Exception:
        body = {}

    resp_json, stream_gen = await gateway_service.forward_chat_completion(
        payload=body,
        provider=x_provider or "",
        project=project,
        db=db,
        client_api_key=x_provider_key,
    )

    if stream_gen is not None:
        return StreamingResponse(
            stream_gen,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    return JSONResponse(content=resp_json, status_code=status.HTTP_200_OK)
