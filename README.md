# Telemetria AI — Active Observability & Evaluation Platform

An enterprise-grade, high-throughput Active Observability and Evaluation platform for LLMs from scratch, functionally equivalent to Braintrust.

---

## Architecture Overview

```
                          ┌──────────────────────────┐
                          │   Next.js 14 Frontend    │
                          │ (Traces, Evals, Playgrd) │
                          └─────────────┬────────────┘
                                        │ HTTP / SSE
                                        ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│    User Applications    ├──►│    FastAPI AI Gateway    │◄── OpenAI / Anthropic
│   (Python SDK @trace)   │   │  & Control Plane (v1)    │
└────────────┬────────────┘   └─────────────┬────────────┘
             │ HTTP Ingest                  │
             ▼                              ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│   Raw JSONL Staging     │   │  PostgreSQL (SQLAlchemy) │
│ (Date-Partitioned Disk) │   │ (Orgs, Users, Prompts)   │
└────────────┬────────────┘   └──────────────────────────┘
             │ Daily Batch (ADF)
             ▼
┌────────────────────────────────────────────────────────┐
│             Databricks PySpark Lakehouse               │
│   ├── traces_silver     (Delta Lake Schema Evolution)  │
│   ├── spans_silver      (LLM / Tool / Function Spans)  │
│   └── evaluations_gold  (P95 Latency & Accuracy Score) │
└────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
agents.telemetria.ai/
├── sdk/                     # Python SDK for non-blocking instrumentation
│   ├── pyproject.toml       # SDK packaging
│   ├── src/observability/   # @trace decorator, models, async background shipper
│   └── tests/test_sdk.py    # End-to-end SDK shipment test
├── backend/                 # Control Plane & AI Gateway
│   ├── main.py              # FastAPI application entrypoint
│   ├── alembic/             # Database schema migrations
│   ├── api/v1/              # Routers (ingest, gateway, traces, prompts, evals)
│   ├── core/                # Configuration, database engine, security, auth
│   ├── models/              # SQLAlchemy operational & telemetry models
│   ├── services/            # Ingestion, Gateway reverse proxying, trace services
│   └── tests/               # AI Gateway and API integration tests
├── data_engine/             # PySpark & Delta Lake data engine
│   ├── notebooks/           # PySpark batch ETL job with schema evolution
│   └── adf_pipelines/       # Azure Data Factory pipeline definitions
├── frontend/                # Next.js 14 App Router web dashboard
│   ├── app/                 # Dashboard, Traces, Playground, Evaluations
│   └── components/          # Navigation, slide-over drawer, metric cards
├── infra/                   # Terraform IaC for Azure PostgreSQL, Databricks & ADLS
└── README.md
```

---

## Quickstart: Running Locally

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**

### 2. Backend Setup
```bash
# From repository root
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install fastapi uvicorn pydantic pydantic-settings sqlalchemy alembic httpx pytest

# Run database migrations
cd backend
alembic upgrade head
cd ..

# Start the FastAPI Control Plane & AI Gateway
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access:
- **Public Landing Page**: Branded for `agents.telemetria.ai` with active agent metrics, waveform ticker, and direct auth triggers.
- **Paid Project Dashboard** (`/app/vrahad/p/My%20Project`): Active observability dashboard displaying **Telemetria Pro Plan (Paid Active)** with $100 model credits, 50 GB ingestion logs, and 100k evals.
- **Interactive In-App Views**: Logs, Dashboards, Patterns, Topics, Review, Playgrounds, Experiments, Datasets, Prompts, Scorers, Parameters, Tools, SQL Sandbox, and Loop AI Agent.

---

## MongoDB Atlas Integration & Authentication

The platform stores users, passwords, organizations, and project records in **MongoDB Atlas** with bcrypt hashing:

- **Cluster**: `vrahad-analytics-cluste.laihf2o.mongodb.net`
- **Database**: `telemetria_agents`
- **Collections**:
  - `users`: User profiles, bcrypt password hashes, paid plan status (`plan: "Pro (Paid Active)"`, `is_paid: true`), and credit balance.
  - `projects`: Project IDs, names, organization namespaces, and live ingestion API keys.

### Authentication Endpoints:
- `POST /v1/auth/register`: Register new team accounts.
- `POST /v1/auth/login`: Authenticate email and password to receive JWT session tokens.
- `GET /v1/auth/me`: Fetch current authenticated profile and active paid plan quotas.

### Default Seed Admin:
- **Email**: `admin@telemetria.ai`
- **Password**: `telemetria2026`
- **Plan**: `Pro (Paid Active)`

---

## First-Time Project Onboarding Flow

1. On sign in, if a user has no projects or initializes a new workspace, the **Project Onboarding Wizard** prompts for Project Name, Primary Model (`GPT-4o` or `Claude 3.5 Sonnet`), and Environment.
2. The backend generates a secure API key (`tlm_live_...`) and registers it in MongoDB.
3. The dashboard transitions to the active project workspace and unlocks all **Paid Pro Plan** quotas.

---

## Using the Python SDK

Install or import the SDK in your Python application:

```python
from sdk.src.observability import init, trace, flush

# Initialize once at application startup
init(
    api_key="<YOUR_PROJECT_API_KEY>",
    endpoint="http://localhost:8000/v1/ingest"
)

# Instrument any function (sync or async)
@trace(tags={"module": "rag", "version": "v1"})
def retrieve_and_generate(user_query: str):
    # Function arguments, latency, exceptions, and return values are captured
    return f"Synthesized answer for: {user_query}"

# Call the function normally - user flow is never blocked
result = retrieve_and_generate("What is active evaluation?")

# Flush queue before process shutdown
flush()
```

---

## Running Test Suites

```bash
# Run all backend and SDK tests
PYTHONPATH=. .venv/bin/pytest -v
```

---

## Infrastructure (Terraform)

Deploy production infrastructure on Microsoft Azure (PostgreSQL Flexible Server, Azure Databricks, and ADLS Gen2):

```bash
cd infra
terraform init
terraform plan
terraform apply
```