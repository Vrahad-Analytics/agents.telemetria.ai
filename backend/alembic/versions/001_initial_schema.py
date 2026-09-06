"""Initial database schema for organizations, users, projects, prompts, datasets, traces, spans

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-06 21:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Organizations
    op.create_table(
        'organizations',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_organizations_name'), 'organizations', ['name'], unique=False)

    # 2. Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('org_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 3. Projects
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('org_id', sa.String(length=36), nullable=False),
        sa.Column('api_key', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_projects_name'), 'projects', ['name'], unique=False)
    op.create_index(op.f('ix_projects_api_key'), 'projects', ['api_key'], unique=True)

    # 4. Prompt Templates
    op.create_table(
        'prompt_templates',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('template_string', sa.Text(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column(
            'model_params',
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'),
            nullable=False
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_prompt_templates_name'), 'prompt_templates', ['name'], unique=False)

    # 5. Datasets
    op.create_table(
        'datasets',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_datasets_name'), 'datasets', ['name'], unique=False)

    # 6. Trace Records
    op.create_table(
        'trace_records',
        sa.Column('id', sa.String(length=64), primary_key=True, nullable=False),
        sa.Column('project_id', sa.String(length=36), nullable=False),
        sa.Column('session_id', sa.String(length=64), nullable=True),
        sa.Column('input', sa.Text(), nullable=True),
        sa.Column('output', sa.Text(), nullable=True),
        sa.Column('expected_output', sa.Text(), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('latency_ms', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column(
            'tags',
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'),
            nullable=False
        ),
        sa.Column(
            'metadata_json',
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql'),
            nullable=False
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_trace_records_project_id'), 'trace_records', ['project_id'], unique=False)
    op.create_index(op.f('ix_trace_records_session_id'), 'trace_records', ['session_id'], unique=False)

    # 7. Span Records
    op.create_table(
        'span_records',
        sa.Column('id', sa.String(length=64), primary_key=True, nullable=False),
        sa.Column('trace_id', sa.String(length=64), nullable=False),
        sa.Column('parent_span_id', sa.String(length=64), nullable=True),
        sa.Column('span_type', sa.String(length=32), nullable=False, server_default='llm'),
        sa.Column('model_name', sa.String(length=128), nullable=True),
        sa.Column('prompt_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completion_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('raw_request', sa.Text(), nullable=True),
        sa.Column('raw_response', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['trace_id'], ['trace_records.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_span_records_trace_id'), 'span_records', ['trace_id'], unique=False)


def downgrade() -> None:
    op.drop_table('span_records')
    op.drop_table('trace_records')
    op.drop_table('datasets')
    op.drop_table('prompt_templates')
    op.drop_table('projects')
    op.drop_table('users')
    op.drop_table('organizations')
