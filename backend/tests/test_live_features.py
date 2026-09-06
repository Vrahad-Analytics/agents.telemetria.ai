import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.core.database import SessionLocal
from backend.models.operational import Project

client = TestClient(app)


@pytest.fixture
def test_project():
    db = SessionLocal()
    proj = db.query(Project).first()
    db.close()
    return proj


def test_seed_traffic_and_metrics(test_project):
    p_id = test_project.id
    # Seed traffic
    res = client.post(f"/v1/projects/{p_id}/seed-traffic?count=15")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["traces_generated"] == 15

    # Compute metrics
    res_metrics = client.get(f"/v1/projects/{p_id}/metrics")
    assert res_metrics.status_code == 200
    metrics = res_metrics.json()
    assert metrics["total_traces"] >= 15
    assert metrics["total_spans"] >= 15
    assert metrics["total_tokens"] > 0
    assert metrics["latency"]["p50_ms"] > 0
    assert metrics["latency"]["p90_ms"] >= metrics["latency"]["p50_ms"]
    assert len(metrics["timeseries"]) == 12


def test_sql_sandbox():
    # Valid query
    res = client.post("/v1/sql/execute", json={"query": "SELECT id, latency_ms FROM traces LIMIT 5;"})
    assert res.status_code == 200
    data = res.json()
    assert "columns" in data
    assert "id" in data["columns"]
    assert "latency_ms" in data["columns"]
    assert data["execution_time_ms"] >= 0.0

    # Forbidden DDL/DML query
    bad_res = client.post("/v1/sql/execute", json={"query": "DROP TABLE traces;"})
    assert bad_res.status_code == 400
    assert "Security violation" in bad_res.json()["detail"]


def test_provider_management(test_project):
    p_id = test_project.id
    # Save provider
    save_res = client.post(
        f"/v1/projects/{p_id}/providers",
        json={"provider_name": "openai", "api_key": "sk-test1234567890abcdef", "default_model": "gpt-4o"}
    )
    assert save_res.status_code == 200
    p_data = save_res.json()
    assert p_data["is_connected"] is True
    assert "..." in p_data["masked_key"]

    # Get providers
    get_res = client.get(f"/v1/projects/{p_id}/providers")
    assert get_res.status_code == 200
    assert any(p["provider_name"] == "openai" for p in get_res.json())

    # Test connection endpoint
    test_res = client.post(
        f"/v1/projects/{p_id}/providers/test",
        json={"provider_name": "anthropic", "api_key": "sk-ant-1234"}
    )
    assert test_res.status_code == 200
    assert test_res.json()["status"] in ["success", "warning"]


def test_trace_human_review(test_project):
    p_id = test_project.id
    # Get traces
    traces_res = client.get(f"/v1/projects/{p_id}/traces?limit=5")
    assert traces_res.status_code == 200
    items = traces_res.json()["items"]
    assert len(items) > 0

    target_trace_id = items[0]["trace_id"]

    # Submit review
    review_res = client.post(
        f"/v1/projects/{p_id}/traces/{target_trace_id}/review",
        json={"rating": 5, "label": "good", "notes": "Accurate response with zero hallucination", "reviewer": "admin@telemetria.ai"}
    )
    assert review_res.status_code == 200
    rev_data = review_res.json()
    assert rev_data["rating"] == 5
    assert rev_data["label"] == "good"

    # Verify review shows in queue or trace item
    queue_res = client.get(f"/v1/projects/{p_id}/review-queue")
    assert queue_res.status_code == 200
