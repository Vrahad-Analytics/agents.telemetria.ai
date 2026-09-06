import time
from pathlib import Path
import pytest
from starlette.testclient import TestClient

from backend.core.database import SessionLocal
from backend.core.security import generate_api_key
from backend.models.operational import Organization, Project
from backend.main import app
from sdk.src.observability import init, trace, flush, shutdown


@pytest.fixture(scope="module")
def test_project():
    """Create a test organization and project in the database."""
    db = SessionLocal()
    org = Organization(name="Test SDK Org")
    db.add(org)
    db.flush()

    raw_key, hashed_key = generate_api_key(prefix="tlm_test_")
    proj = Project(name="SDK Verification Project", org_id=org.id, api_key=hashed_key)
    db.add(proj)
    db.commit()
    db.refresh(proj)

    yield {"project_id": proj.id, "api_key": raw_key}
    db.close()


def test_sdk_telemetry_flow(test_project):
    project_id = test_project["project_id"]
    api_key = test_project["api_key"]

    client = TestClient(app)

    # 1. Initialize SDK with Starlette TestClient
    init(
        api_key=api_key,
        endpoint="/v1/ingest",
        project_id=project_id,
        batch_size=5,
        flush_interval_seconds=0.1,
        client=client,
    )

    # 2. Define instrumented functions
    @trace(tags={"stage": "retrieval"})
    def mock_retrieve_documents(query: str):
        time.sleep(0.01)
        return [{"doc_id": "doc-1", "score": 0.95, "snippet": f"Content for {query}"}]

    @trace(tags={"stage": "generation"}, metadata={"pipeline": "rag"})
    def mock_rag_pipeline(user_query: str):
        docs = mock_retrieve_documents(user_query)
        time.sleep(0.02)
        return f"Synthesized answer based on {len(docs)} documents."

    # 3. Execute function
    result = mock_rag_pipeline("Explain active observability")
    assert "Synthesized answer" in result

    # 4. Flush SDK queue
    assert flush(timeout=5.0) is True

    # 5. Query backend to verify telemetry was received and stored
    resp = client.get(f"/v1/projects/{project_id}/traces")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total"] >= 1
    items = data["items"]
    matching_traces = [t for t in items if "mock_rag_pipeline" in str(t.get("tags", {}))]
    assert len(matching_traces) >= 1

    target_trace = matching_traces[0]
    assert target_trace["latency_ms"] >= 20.0
    assert "Explain active observability" in target_trace["input"]
    assert "Synthesized answer" in target_trace["output"]
    assert target_trace["tags"]["stage"] == "generation"

    # Check child spans
    assert len(target_trace["spans"]) >= 1
    span = target_trace["spans"][0]
    assert span["span_type"] == "function"

    # 6. Verify raw JSONL log files are written for PySpark data engine
    from backend.core.config import settings
    raw_files = list(settings.RAW_LOGS_DIR.glob("**/*.jsonl"))
    assert len(raw_files) >= 1
    with open(raw_files[0], "r", encoding="utf-8") as f:
        lines = f.readlines()
        assert len(lines) >= 1

    shutdown()
