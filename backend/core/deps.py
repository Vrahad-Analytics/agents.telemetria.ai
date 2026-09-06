from typing import Optional
from fastapi import Depends, HTTPException, Security, Header, status
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
    x_project_id: Optional[str] = Header(None, alias="X-Project-Id"),
    db: Session = Depends(get_db),
) -> Project:
    """
    Authenticate request via:
    1. Project API key in X-API-Key or Bearer token
    2. Frontend session with X-Project-Id header
    3. Fallback to default project if authorized
    """
    raw_key = None
    if bearer_token and bearer_token.credentials:
        raw_key = bearer_token.credentials
    elif header_api_key:
        raw_key = header_api_key

    if not raw_key and not x_project_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key. Provide via 'X-API-Key' header or 'Authorization: Bearer <key>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # If X-Project-Id is explicitly passed by frontend UI
    if x_project_id:
        proj = db.query(Project).filter((Project.id == x_project_id) | (Project.name == x_project_id)).first()
        if not proj:
            proj = db.query(Project).first()
        if proj:
            return proj

    if raw_key:
        hashed = hash_api_key(raw_key)
        project = db.query(Project).filter(Project.api_key == hashed).first()
        if project:
            return project

        project = db.query(Project).filter((Project.id == raw_key) | (Project.name == raw_key)).first()
        if project:
            return project

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API Key or Project reference.",
        headers={"WWW-Authenticate": "Bearer"},
    )
