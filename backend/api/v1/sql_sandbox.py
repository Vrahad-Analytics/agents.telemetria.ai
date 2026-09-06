import time
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.core.database import get_db

router = APIRouter(prefix="/sql", tags=["SQL Analytics Sandbox"])

FORBIDDEN_KEYWORDS = [
    "drop", "delete", "insert", "update", "alter", "truncate",
    "create", "grant", "revoke", "replace", "vacuum", "attach"
]


class SqlExecuteRequest(BaseModel):
    query: str
    limit: Optional[int] = 100


class SqlExecuteResponse(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    execution_time_ms: float
    is_truncated: bool
    query: str


@router.post("/execute", response_model=SqlExecuteResponse)
def execute_sql_query(
    req: SqlExecuteRequest,
    db: Session = Depends(get_db)
):
    raw_query = req.query.strip()
    if not raw_query:
        # Default query if blank
        raw_query = "SELECT id, session_id, latency_ms, start_time, tags FROM traces ORDER BY start_time DESC LIMIT 25;"

    # Safety guard: read-only queries only
    clean_lower = re.sub(r"--.*$", "", raw_query, flags=re.MULTILINE).lower()
    for kw in FORBIDDEN_KEYWORDS:
        # Check whole words
        if re.search(r"\b" + kw + r"\b", clean_lower):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security violation: Statement contains forbidden DDL/DML keyword '{kw.upper()}'. Read-only queries only.",
            )

    start_mono = time.monotonic()
    try:
        # Transparently alias 'traces' -> 'trace_records', 'spans' -> 'span_records'
        exec_query = re.sub(r"\btraces\b", "trace_records", raw_query, flags=re.IGNORECASE)
        exec_query = re.sub(r"\bspans\b", "span_records", exec_query, flags=re.IGNORECASE)

        # Enforce limit if not already limited
        if "limit" not in exec_query.lower():
            exec_query = f"{exec_query.rstrip(';')} LIMIT {req.limit};"

        result = db.execute(text(exec_query))
        cols = list(result.keys()) if result.returns_rows else []
        records = []
        if result.returns_rows:
            raw_rows = result.fetchall()
            for r in raw_rows:
                # Convert row mapping to JSON serializable dict
                row_dict = {}
                for idx, col in enumerate(cols):
                    val = r[idx]
                    if hasattr(val, "isoformat"):
                        val = val.isoformat()
                    row_dict[col] = val
                records.append(row_dict)

        latency_ms = round((time.monotonic() - start_mono) * 1000.0, 2)

        return SqlExecuteResponse(
            columns=cols,
            rows=records,
            row_count=len(records),
            execution_time_ms=latency_ms,
            is_truncated=len(records) >= (req.limit or 100),
            query=raw_query,
        )
    except Exception as e:
        latency_ms = round((time.monotonic() - start_mono) * 1000.0, 2)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SQL Query Execution Error: {str(e)}",
        )
