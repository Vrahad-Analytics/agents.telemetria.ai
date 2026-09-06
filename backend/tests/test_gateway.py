import json
import pytest
from starlette.testclient import TestClient

from backend.core.database import SessionLocal
from backend.core.security import generate_api_key
from backend.models.operational import Organization, Project
from backend.main import app


@pytest.fixture(scope="module")
def gateway_test_project():
    db = SessionLocal()
    org = Organization(name="Gateway Test Org")
    db.add(org)
    db.flush()

    raw_key, hashed_key = generate_api_key(prefix="tlm_gw_")
    proj = Project(name="AI Gateway Test Project", org_id=org.id, api_key=hashed_key)
    db.add(proj)
    db.commit()
    db.refresh(proj)

    yield {"project_id": proj.id, "api_key": raw_key}
    db.close()


def test_gateway_non_streaming_completion(gateway_test_project):
    project_id = gateway_test_project["project_id"]
    api_key = gateway_test_project["api_key"]

    client = TestClient(app)

    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is active evaluation?"},
        ],
        "temperature": 0.3,
        "stream": False,
    }

    resp = client.post(
        "/v1/gateway/chat/completions",
        json=payload,
        headers={"Authorization": f"Bearer {api_key}", "x-provider": "openai"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["object"] == "chat.completion"
    assert data["model"] == "gpt-4o"
    assert len(data["choices"]) >= 1
    assert "active observability" in data["choices"][0]["message"]["content"].lower() or len(data["choices"][0]["message"]["content"]) > 0
    assert data["usage"]["total_tokens"] > 0

    # Verify that telemetry trace was automatically logged by the gateway
    trace_resp = client.get(f"/v1/projects/{project_id}/traces")
    assert trace_resp.status_code == 200
    traces = trace_resp.json()["items"]
    assert len(traces) >= 1
    recent_trace = traces[0]
    assert recent_trace["tags"]["source"] == "ai_gateway"
    assert len(recent_trace["spans"]) >= 1
    assert recent_trace["spans"][0]["span_type"] == "llm"


def test_gateway_streaming_completion(gateway_test_project):
    project_id = gateway_test_project["project_id"]
    api_key = gateway_test_project["api_key"]

    client = TestClient(app)

    payload = {
        "model": "claude-3-5-sonnet",
        "messages": [{"role": "user", "content": "Stream a test response."}],
        "stream": True,
    }

    resp = client.post(
        "/v1/gateway/chat/completions",
        json=payload,
        headers={"X-API-Key": api_key, "x-provider": "anthropic"},
    )
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]

    lines = [line.strip() for line in resp.text.split("\n") if line.strip()]
    assert any("data: [DONE]" in l for l in lines)
    data_lines = [l for l in lines if l.startswith("data: {")]
    assert len(data_lines) >= 1

    first_chunk = json.loads(data_lines[0][6:])
    assert first_chunk["object"] == "chat.completion.chunk"


def test_gateway_unauthorized():
    client = TestClient(app)
    resp = client.post(
        "/v1/gateway/chat/completions",
        json={"model": "gpt-4o", "messages": []},
    )
    assert resp.status_code == 401
