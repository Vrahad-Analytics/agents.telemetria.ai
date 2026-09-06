import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session

from backend.models.operational import Project
from backend.models.telemetry import TraceRecord, SpanRecord

AGENT_SCENARIOS = [
    {
        "input": "How do I upgrade my Telemetria workspace to the Enterprise tier and add 10 developer seats?",
        "output": "You can upgrade directly in Settings > Billing by selecting Enterprise. Once upgraded, navigate to Organization > Members and invite your 10 teammates by email. SAML SSO and dedicated MongoDB Atlas encryption will be enabled immediately.",
        "tags": {"environment": "production", "agent_type": "customer_support", "channel": "web_chat"},
        "models": ["gpt-4o-mini", "gpt-4o"],
        "spans": [
            {"name": "intent_classification", "type": "llm", "model": "gpt-4o-mini", "p_tokens": 65, "c_tokens": 12, "lat": 120},
            {"name": "knowledge_retrieval", "type": "retrieval", "model": "text-embedding-3-small", "p_tokens": 40, "c_tokens": 0, "lat": 45},
            {"name": "response_synthesis", "type": "llm", "model": "gpt-4o", "p_tokens": 480, "c_tokens": 92, "lat": 610},
        ]
    },
    {
        "input": "Write a resilient Python client that streams chat completions from agents.telemetria.ai with retry backoff.",
        "output": "Here is a complete resilient Python client using httpx with exponential backoff and SSE chunk parser:\n```python\nimport httpx\n# Configured for agents.telemetria.ai\n```",
        "tags": {"environment": "production", "agent_type": "code_assistant", "language": "python"},
        "models": ["claude-3-5-sonnet", "gpt-4o"],
        "spans": [
            {"name": "architecture_planning", "type": "llm", "model": "claude-3-5-sonnet", "p_tokens": 280, "c_tokens": 95, "lat": 450},
            {"name": "syntax_validator", "type": "tool", "model": None, "p_tokens": 0, "c_tokens": 0, "lat": 30},
            {"name": "code_generation", "type": "llm", "model": "claude-3-5-sonnet", "p_tokens": 620, "c_tokens": 310, "lat": 980},
        ]
    },
    {
        "input": "Analyze MongoDB Atlas cluster latency spikes across the last 6 hours and suggest sharding configuration.",
        "output": "Analysis complete: observed 3 spikes at 02:14, 04:30, and 05:45 UTC correlated with batch evaluation runs. Recommended index: {project_id: 1, start_time: -1}. Sharding key on {project_id: hashed} will balance writes across shards.",
        "tags": {"environment": "staging", "agent_type": "db_diagnostics", "database": "mongodb_atlas"},
        "models": ["gpt-4o"],
        "spans": [
            {"name": "metrics_aggregation", "type": "retrieval", "model": None, "p_tokens": 0, "c_tokens": 0, "lat": 85},
            {"name": "anomaly_detector", "type": "tool", "model": None, "p_tokens": 0, "c_tokens": 0, "lat": 60},
            {"name": "recommendation_engine", "type": "llm", "model": "gpt-4o", "p_tokens": 850, "c_tokens": 140, "lat": 720},
        ]
    },
    {
        "input": "Run automated hallucination detection against 50 LLM outputs in the evaluation test set.",
        "output": "Evaluation finished: 48/50 outputs verified factually accurate (96.0% accuracy). 2 outputs flagged with minor extrapolation regarding subscription refund timeframes.",
        "tags": {"environment": "production", "agent_type": "evaluator", "benchmark": "faithfulness"},
        "models": ["gpt-4o-mini"],
        "spans": [
            {"name": "claim_extraction", "type": "llm", "model": "gpt-4o-mini", "p_tokens": 310, "c_tokens": 65, "lat": 240},
            {"name": "nli_premise_verifier", "type": "llm", "model": "gpt-4o-mini", "p_tokens": 420, "c_tokens": 40, "lat": 310},
        ]
    }
]


def seed_project_traffic(project_id: str, count: int, db: Session) -> int:
    """Generate and commit realistic multi-span traces for a project."""
    project = db.query(Project).filter((Project.id == project_id) | (Project.name == project_id)).first()
    if not project:
        project = db.query(Project).first()
        if not project:
            return 0
    p_id = project.id

    now = datetime.now(timezone.utc)
    inserted_traces = 0

    for i in range(count):
        scenario = random.choice(AGENT_SCENARIOS)
        # Stagger across the past 24 hours
        minutes_ago = random.randint(2, 1440)
        trace_start = now - timedelta(minutes=minutes_ago)
        
        # Jitter latency
        total_lat = sum(s["lat"] for s in scenario["spans"]) + random.randint(-40, 80)
        total_lat = max(80.0, float(total_lat))
        trace_end = trace_start + timedelta(milliseconds=total_lat)

        trace_id = f"trace_{uuid.uuid4().hex[:16]}"
        session_id = f"sess_{random.randint(100, 999)}_{uuid.uuid4().hex[:6]}"

        is_error = random.random() < 0.04  # ~4% error rate
        tags = dict(scenario["tags"])
        if is_error:
            tags["error"] = "Upstream rate limit exceeded: 429 Too Many Requests"

        p_tokens_sum = sum(s["p_tokens"] for s in scenario["spans"])
        c_tokens_sum = sum(s["c_tokens"] for s in scenario["spans"])

        trace_rec = TraceRecord(
            id=trace_id,
            project_id=p_id,
            session_id=session_id,
            input=scenario["input"],
            output=scenario["output"] if not is_error else "Error: Model execution interrupted by upstream provider rate limit.",
            expected_output=scenario["output"],
            start_time=trace_start,
            end_time=trace_end,
            latency_ms=total_lat,
            tags=tags,
            metadata_json={
                "total_tokens": p_tokens_sum + c_tokens_sum,
                "prompt_tokens": p_tokens_sum,
                "completion_tokens": c_tokens_sum,
                "status": "error" if is_error else "success",
                "telemetria_sdk_version": "0.4.2",
            }
        )
        db.add(trace_rec)

        # Add child spans
        span_cursor = trace_start
        for s in scenario["spans"]:
            s_lat = float(s["lat"] + random.randint(-15, 25))
            s_end = span_cursor + timedelta(milliseconds=s_lat)
            span_rec = SpanRecord(
                id=f"span_{uuid.uuid4().hex[:16]}",
                trace_id=trace_id,
                span_type=s["type"],
                model_name=s["model"],
                prompt_tokens=s["p_tokens"],
                completion_tokens=s["c_tokens"],
                raw_request=json.dumps({"prompt": scenario["input"], "span": s["name"]}),
                raw_response=json.dumps({"reply": scenario["output"][:100]}),
            )
            db.add(span_rec)
            span_cursor = s_end

        inserted_traces += 1

    db.commit()
    return inserted_traces
