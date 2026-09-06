"""
Delta Lake Schema Definitions for High-Throughput LLM Telemetry and Evaluation.

These schemas define:
1. `traces_silver`: Session, latency, input/output, tags, and dynamic metadata.
2. `spans_silver`: Granular execution units (llm, tool, function), token usage, and raw payloads.
3. `evaluations_gold`: Aggregated evaluation metrics for prompt versions and experiment runs.
"""

try:
    from pyspark.sql.types import (
        StructType,
        StructField,
        StringType,
        TimestampType,
        DoubleType,
        IntegerType,
        MapType,
    )
except ImportError:
    # Lightweight fallback representation if PySpark is not locally installed
    StructType = dict
    StructField = tuple
    StringType = TimestampType = DoubleType = IntegerType = MapType = str


def get_traces_silver_schema() -> StructType:
    """
    Schema for traces_silver Delta table.
    Captures complete user interaction traces with timing, tags, and JSON metadata.
    """
    return StructType([
        StructField("trace_id", StringType(), False),
        StructField("project_id", StringType(), False),
        StructField("session_id", StringType(), True),
        StructField("input", StringType(), True),
        StructField("output", StringType(), True),
        StructField("expected_output", StringType(), True),
        StructField("start_time", TimestampType(), False),
        StructField("end_time", TimestampType(), False),
        StructField("latency_ms", DoubleType(), False),
        StructField("tags", MapType(StringType(), StringType()), True),
        StructField("metadata", StringType(), True),  # Stringified JSON with schema evolution
    ])


def get_spans_silver_schema() -> StructType:
    """
    Schema for spans_silver Delta table.
    Captures fine-grained execution steps (LLM calls, tool executions, functions).
    """
    return StructType([
        StructField("span_id", StringType(), False),
        StructField("trace_id", StringType(), False),
        StructField("parent_span_id", StringType(), True),
        StructField("span_type", StringType(), False),  # llm, tool, function
        StructField("model_name", StringType(), True),
        StructField("prompt_tokens", IntegerType(), False),
        StructField("completion_tokens", IntegerType(), False),
        StructField("raw_request", StringType(), True),   # Raw JSON request sent to LLM
        StructField("raw_response", StringType(), True),  # Raw JSON response received from LLM
    ])


def get_evaluations_gold_schema() -> StructType:
    """
    Schema for evaluations_gold Delta table.
    Aggregated performance, latency, cost, and accuracy scores per prompt template / version.
    """
    return StructType([
        StructField("evaluation_id", StringType(), False),
        StructField("project_id", StringType(), False),
        StructField("prompt_template_id", StringType(), False),
        StructField("prompt_version", IntegerType(), False),
        StructField("dataset_id", StringType(), True),
        StructField("total_runs", IntegerType(), False),
        StructField("success_rate", DoubleType(), False),
        StructField("avg_latency_ms", DoubleType(), False),
        StructField("p95_latency_ms", DoubleType(), False),
        StructField("avg_prompt_tokens", DoubleType(), False),
        StructField("avg_completion_tokens", DoubleType(), False),
        StructField("avg_score", DoubleType(), False),
        StructField("window_start", TimestampType(), False),
        StructField("window_end", TimestampType(), False),
    ])


# SQL DDL strings for Delta Lake table creation on Databricks / Hive metastore
TRACES_SILVER_DDL = """
CREATE TABLE IF NOT EXISTS telemetria.traces_silver (
    trace_id STRING NOT NULL,
    project_id STRING NOT NULL,
    session_id STRING,
    input STRING,
    output STRING,
    expected_output STRING,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    latency_ms DOUBLE NOT NULL,
    tags MAP<STRING, STRING>,
    metadata STRING
)
USING DELTA
PARTITIONED BY (project_id)
TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true'
);
"""

SPANS_SILVER_DDL = """
CREATE TABLE IF NOT EXISTS telemetria.spans_silver (
    span_id STRING NOT NULL,
    trace_id STRING NOT NULL,
    parent_span_id STRING,
    span_type STRING NOT NULL,
    model_name STRING,
    prompt_tokens INT NOT NULL,
    completion_tokens INT NOT NULL,
    raw_request STRING,
    raw_response STRING
)
USING DELTA
PARTITIONED BY (span_type)
TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true'
);
"""

EVALUATIONS_GOLD_DDL = """
CREATE TABLE IF NOT EXISTS telemetria.evaluations_gold (
    evaluation_id STRING NOT NULL,
    project_id STRING NOT NULL,
    prompt_template_id STRING NOT NULL,
    prompt_version INT NOT NULL,
    dataset_id STRING,
    total_runs INT NOT NULL,
    success_rate DOUBLE NOT NULL,
    avg_latency_ms DOUBLE NOT NULL,
    p95_latency_ms DOUBLE NOT NULL,
    avg_prompt_tokens DOUBLE NOT NULL,
    avg_completion_tokens DOUBLE NOT NULL,
    avg_score DOUBLE NOT NULL,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL
)
USING DELTA
PARTITIONED BY (project_id, prompt_version);
"""
