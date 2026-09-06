"use client";

import { useEffect, useState } from "react";
import { Layers, Clock, Cpu, ArrowUpDown, Search, RefreshCw, X, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

interface SpanItem {
  span_id: string;
  trace_id: string;
  parent_span_id?: string;
  span_type: string;
  model_name?: string;
  prompt_tokens: number;
  completion_tokens: number;
  raw_request?: string;
  raw_response?: string;
  latency_ms?: number;
}

interface TraceItem {
  trace_id: string;
  project_id?: string;
  session_id?: string;
  input?: string;
  output?: string;
  start_time: string;
  end_time: string;
  latency_ms: number;
  tags: Record<string, string>;
  metadata: Record<string, any>;
  spans: SpanItem[];
}

export default function TracesPage() {
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTrace, setSelectedTrace] = useState<TraceItem | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [projectsList, setProjectsList] = useState<Array<{ id: string; name: string }>>([]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/v1/projects");
      if (res.ok) {
        const data = await res.json();
        setProjectsList(data);
        if (data.length > 0 && !projectId) {
          setProjectId(data[0].id);
        }
      }
    } catch {
      // Backend not running locally yet; will render mock traces fallback
    }
  };

  const fetchTraces = async (pId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/v1/projects/${pId}/traces`);
      if (res.ok) {
        const data = await res.json();
        setTraces(data.items || []);
      } else {
        fallbackMockTraces();
      }
    } catch {
      fallbackMockTraces();
    } finally {
      setLoading(false);
    }
  };

  const fallbackMockTraces = () => {
    const mock: TraceItem[] = [
      {
        trace_id: "trc_84a9e10d29bc41a",
        session_id: "sess_user_9921",
        input: '{"prompt": "Summarize user complaints regarding latency in Q3", "max_tokens": 512}',
        output: "Users reported that query response time increased significantly in Q3...",
        start_time: new Date(Date.now() - 1000 * 120).toISOString(),
        end_time: new Date(Date.now() - 1000 * 119).toISOString(),
        latency_ms: 342.5,
        tags: { function: "ai_gateway_proxy", source: "ai_gateway", model: "gpt-4o" },
        metadata: { gateway_routing: "direct", total_tokens: 418 },
        spans: [
          {
            span_id: "spn_77a109bf2",
            trace_id: "trc_84a9e10d29bc41a",
            span_type: "llm",
            model_name: "gpt-4o",
            prompt_tokens: 120,
            completion_tokens: 298,
            latency_ms: 342.5,
            raw_request: "POST https://api.openai.com/v1/chat/completions",
            raw_response: "HTTP/2.0 200 OK - Finish reason: stop",
          },
        ],
      },
      {
        trace_id: "trc_21bc99401f8932c",
        session_id: "sess_user_4019",
        input: '{"query": "Parse invoices from PDF OCR payload"}',
        output: "Successfully extracted 4 line items with total $1,420.00.",
        start_time: new Date(Date.now() - 1000 * 450).toISOString(),
        end_time: new Date(Date.now() - 1000 * 449).toISOString(),
        latency_ms: 580.1,
        tags: { function: "process_invoice", stage: "extraction", status: "success" },
        metadata: { pipeline: "document_ai" },
        spans: [
          {
            span_id: "spn_tool_extract",
            trace_id: "trc_21bc99401f8932c",
            span_type: "tool",
            model_name: "ocr_parser_v2",
            prompt_tokens: 0,
            completion_tokens: 0,
            latency_ms: 120.0,
          },
          {
            span_id: "spn_llm_format",
            trace_id: "trc_21bc99401f8932c",
            span_type: "llm",
            model_name: "claude-3-5-sonnet",
            prompt_tokens: 450,
            completion_tokens: 110,
            latency_ms: 460.1,
          },
        ],
      },
      {
        trace_id: "trc_558832aae11d200",
        session_id: "sess_eval_run_2",
        input: '{"user_query": "Explain active observability"}',
        output: "Active observability continuously monitors and evaluates model outputs in real time.",
        start_time: new Date(Date.now() - 1000 * 890).toISOString(),
        end_time: new Date(Date.now() - 1000 * 889).toISOString(),
        latency_ms: 215.8,
        tags: { function: "mock_rag_pipeline", stage: "generation" },
        metadata: { pipeline: "rag" },
        spans: [
          {
            span_id: "spn_fn_rag",
            trace_id: "trc_558832aae11d200",
            span_type: "function",
            model_name: "gpt-4o-mini",
            prompt_tokens: 45,
            completion_tokens: 65,
            latency_ms: 215.8,
          },
        ],
      },
    ];
    setTraces(mock);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchTraces(projectId);
    } else {
      fallbackMockTraces();
      setLoading(false);
    }
  }, [projectId]);

  const filteredTraces = traces.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.trace_id.toLowerCase().includes(q) ||
      (t.input && t.input.toLowerCase().includes(q)) ||
      (t.output && t.output.toLowerCase().includes(q)) ||
      JSON.stringify(t.tags).toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-600" /> Traces & Telemetry
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time query table inspecting raw executions, spans, latency, and tokens from operational storage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projectsList.length > 0 && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none"
            >
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => (projectId ? fetchTraces(projectId) : fallbackMockTraces())}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by trace ID, function name, input, or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Traces Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Trace ID</th>
              <th className="px-4 py-3">Function / Source</th>
              <th className="px-4 py-3">Input Preview</th>
              <th className="px-4 py-3">Latency</th>
              <th className="px-4 py-3">Tokens</th>
              <th className="px-4 py-3">Spans</th>
              <th className="px-4 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTraces.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                  {loading ? "Loading telemetry records..." : "No traces found matching your criteria."}
                </td>
              </tr>
            ) : (
              filteredTraces.map((trace) => {
                const totalTokens = trace.spans.reduce(
                  (acc, s) => acc + (s.prompt_tokens || 0) + (s.completion_tokens || 0),
                  0
                );
                const isError = trace.tags?.status === "error";

                return (
                  <tr
                    key={trace.trace_id}
                    onClick={() => setSelectedTrace(trace)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-indigo-600 flex items-center gap-1.5">
                      {isError ? (
                        <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                      {trace.trace_id.slice(0, 14)}...
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {trace.tags?.function || trace.tags?.source || "unspecified"}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-xs text-slate-600">
                      {trace.input || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          trace.latency_ms < 250
                            ? "text-emerald-700"
                            : trace.latency_ms < 600
                            ? "text-amber-700"
                            : "text-rose-700"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {trace.latency_ms.toFixed(1)} ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-mono">
                      {totalTokens > 0 ? totalTokens.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {trace.spans.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400 whitespace-nowrap">
                      {new Date(trace.start_time).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedTrace && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Trace Details</span>
                <h2 className="text-lg font-mono font-bold text-slate-900 mt-0.5">{selectedTrace.trace_id}</h2>
              </div>
              <button
                onClick={() => setSelectedTrace(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6 flex-1">
              {/* Timing & Metrics */}
              <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-4 text-center">
                <div>
                  <div className="text-xs text-slate-500">Latency</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{selectedTrace.latency_ms.toFixed(1)} ms</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Total Spans</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{selectedTrace.spans.length}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Session ID</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5 font-mono text-xs truncate">
                    {selectedTrace.session_id || "N/A"}
                  </div>
                </div>
              </div>

              {/* Input Payload */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Input Payload</h3>
                <pre className="rounded-lg bg-slate-900 p-4 text-xs font-mono text-slate-100 overflow-x-auto whitespace-pre-wrap">
                  {selectedTrace.input || "No input payload captured."}
                </pre>
              </div>

              {/* Output Payload */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Output Response</h3>
                <pre className="rounded-lg bg-slate-900 p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                  {selectedTrace.output || "No output response captured."}
                </pre>
              </div>

              {/* Child Spans Tree */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Child Spans Breakdown</h3>
                <div className="space-y-2">
                  {selectedTrace.spans.map((s) => (
                    <div key={s.span_id} className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium text-slate-800">{s.span_id}</span>
                        <span className="rounded bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700 uppercase tracking-wider text-[10px]">
                          {s.span_type}
                        </span>
                      </div>
                      {s.model_name && <div className="text-slate-600">Model: <span className="font-semibold">{s.model_name}</span></div>}
                      {(s.prompt_tokens > 0 || s.completion_tokens > 0) && (
                        <div className="text-slate-500 font-mono">
                          Tokens: {s.prompt_tokens} prompt / {s.completion_tokens} completion
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata & Tags */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tags & Metadata</h3>
                <pre className="rounded-lg bg-slate-100 p-3 text-xs font-mono text-slate-700 overflow-x-auto">
                  {JSON.stringify({ tags: selectedTrace.tags, metadata: selectedTrace.metadata }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
