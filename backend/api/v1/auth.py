import uuid
import bcrypt
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel, Field

from backend.core.mongodb import users_collection, is_atlas_connected
from backend.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication & User Plans"])


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    name: Optional[str] = "Telemetria Developer"
    org_name: Optional[str] = "vrahad"


class LoginRequest(BaseModel):
    email: str
    password: str


class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    org_name: str
    plan: str
    is_paid: bool
    plan_credits: float
    logs_quota_gb: float
    evals_quota: int
    atlas_connected: bool
    created_at: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# Initialize default seed admin user if not exists
def _ensure_default_user():
    existing = users_collection.find_one({"email": "admin@telemetria.ai"})
    if not existing:
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow().isoformat()
        users_collection.insert_one({
            "_id": user_id,
            "id": user_id,
            "email": "admin@telemetria.ai",
            "password_hash": hash_password("telemetria2026"),
            "name": "Vrahad Analytics Admin",
            "org_name": "vrahad",
            "plan": "Pro (Paid Active)",
            "is_paid": True,
            "plan_credits": 100.0,
            "logs_quota_gb": 50.0,
            "evals_quota": 100000,
            "created_at": now
        })

_ensure_default_user()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    existing = users_collection.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    hashed_pwd = hash_password(req.password)
    now = datetime.utcnow().isoformat()

    doc = {
        "_id": user_id,
        "id": user_id,
        "email": req.email,
        "password_hash": hashed_pwd,
        "name": req.name or "Developer",
        "org_name": req.org_name or "vrahad",
        "plan": "Pro (Paid Active)",
        "is_paid": True,
        "plan_credits": 100.0,
        "logs_quota_gb": 50.0,
        "evals_quota": 100000,
        "created_at": now
    }
    users_collection.insert_one(doc)

    user_profile = UserProfileResponse(
        id=user_id,
        email=doc["email"],
        name=doc["name"],
        org_name=doc["org_name"],
        plan=doc["plan"],
        is_paid=doc["is_paid"],
        plan_credits=doc["plan_credits"],
        logs_quota_gb=doc["logs_quota_gb"],
        evals_quota=doc["evals_quota"],
        atlas_connected=is_atlas_connected(),
        created_at=doc["created_at"]
    )

    return AuthResponse(
        access_token=f"tlm_jwt_{user_id}_{uuid.uuid4().hex[:8]}",
        user=user_profile
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    user = users_collection.find_one({"email": req.email})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    user_profile = UserProfileResponse(
        id=user["id"],
        email=user["email"],
        name=user.get("name", "Developer"),
        org_name=user.get("org_name", "vrahad"),
        plan=user.get("plan", "Pro (Paid Active)"),
        is_paid=user.get("is_paid", True),
        plan_credits=float(user.get("plan_credits", 100.0)),
        logs_quota_gb=float(user.get("logs_quota_gb", 50.0)),
        evals_quota=int(user.get("evals_quota", 100000)),
        atlas_connected=is_atlas_connected(),
        created_at=user.get("created_at", datetime.utcnow().isoformat())
    )

    return AuthResponse(
        access_token=f"tlm_jwt_{user['id']}_{uuid.uuid4().hex[:8]}",
        user=user_profile
    )


@router.get("/me", response_model=UserProfileResponse)
def get_current_user(authorization: Optional[str] = Header(None)):
    # If token passed or default to first user
    user = None
    if authorization and "tlm_jwt_" in authorization:
        parts = authorization.replace("Bearer ", "").split("_")
        if len(parts) >= 3:
            usr_id = f"usr_{parts[2]}"
            user = users_collection.find_one({"id": usr_id})
    
    if not user:
        user = users_collection.find_one({"email": "admin@telemetria.ai"})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserProfileResponse(
        id=user["id"],
        email=user["email"],
        name=user.get("name", "Developer"),
        org_name=user.get("org_name", "vrahad"),
        plan=user.get("plan", "Pro (Paid Active)"),
        is_paid=user.get("is_paid", True),
        plan_credits=float(user.get("plan_credits", 100.0)),
        logs_quota_gb=float(user.get("logs_quota_gb", 50.0)),
        evals_quota=int(user.get("evals_quota", 100000)),
        atlas_connected=is_atlas_connected(),
        created_at=user.get("created_at", datetime.utcnow().isoformat())
    )
