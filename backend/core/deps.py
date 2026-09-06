from typing import Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, APIKeyHeader
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import hash_api_key
from backend.models.operational import Project

bearer_scheme = HTTPBearer(auto_error=False)
api_key_header_scheme = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_current_project(
    bearer_token: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
    header_api_key: Optional[str] = Security(api_key_header_scheme),
    db: Session = Depends(get_db),
) -> Project:
    """Authenticate request via Bearer token or X-API-Key header against hashed project keys."""
    raw_key = None
    if bearer_token and bearer_token.credentials:
        raw_key = bearer_token.credentials
    elif header_api_key:
        raw_key = header_api_key

    if not raw_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key. Provide via 'X-API-Key' header or 'Authorization: Bearer <key>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    hashed = hash_api_key(raw_key)
    project = db.query(Project).filter(Project.api_key == hashed).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key. Project not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return project
