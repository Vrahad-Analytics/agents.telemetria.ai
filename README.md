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
- **Overview Dashboard**: System metrics, token breakdown, and quick navigation.
- **Traces View** (`/traces`): Inspect LLM executions, latency metrics, and child spans in real time.
- **Playground** (`/playground`): Test prompts live through the AI Gateway reverse proxy with SSE streaming.
- **Evaluations** (`/evaluations`): Benchmark prompt versions side-by-side against golden datasets.

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