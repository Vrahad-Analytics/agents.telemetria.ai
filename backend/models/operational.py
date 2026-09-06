import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models.base import Base, TimestampMixin, utc_now


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User", back_populates="organization", cascade="all, delete-orphan"
    )
    projects: Mapped[List["Project"]] = relationship(
        "Project", back_populates="organization", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Organization id={self.id} name={self.name}>"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    org_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    org_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    api_key: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="projects")
    prompt_templates: Mapped[List["PromptTemplate"]] = relationship(
        "PromptTemplate", back_populates="project", cascade="all, delete-orphan"
    )
    datasets: Mapped[List["Dataset"]] = relationship(
        "Dataset", back_populates="project", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Project id={self.id} name={self.name}>"


class PromptTemplate(Base, TimestampMixin):
    __tablename__ = "prompt_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    template_string: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    # Strictly PostgreSQL JSONB with standard JSON fallback for SQLite/non-Postgres engines
    model_params: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        default=dict,
        nullable=False
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="prompt_templates")

    def __repr__(self) -> str:
        return f"<PromptTemplate id={self.id} name={self.name} v={self.version}>"


class Dataset(Base, TimestampMixin):
    __tablename__ = "datasets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="datasets")

    def __repr__(self) -> str:
        return f"<Dataset id={self.id} name={self.name}>"
