"use client";

import { useState } from "react";
import { Terminal, CheckCircle2, Clock, Sparkles, Database, Layers, ArrowRight } from "lucide-react";

export function TraceDebuggerCard() {
  const [activeTab, setActiveTab] = useState<"spans" | "json" | "eval">("spans");

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl bg-[#090d16] border border-white/10 shadow-2xl overflow-hidden text-left">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-3 font-mono text-xs text-slate-400">
            trace_session_agent_9821a • Production
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("spans")}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              activeTab === "spans" ? "bg-brand-blue text-white font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Spans Tree
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              activeTab === "json" ? "bg-brand-blue text-white font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Raw Payloads
          </button>
          <button
            onClick={() => setActiveTab("eval")}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              activeTab === "eval" ? "bg-brand-blue text-white font-semibold" : "text-slate-400 hover:text-white"
            }`}
          >
            Active Evals
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 font-mono text-xs text-slate-300 space-y-4">
        {activeTab === "spans" && (
          <div className="space-y-3">
            {/* Root Trace Span */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
              <div className="flex items-center justify-between text-indigo-300 font-semibold mb-2">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ROOT: customer_support_agent_workflow
                </span>
                <span className="text-[11px] text-slate-400">388 ms • 412 tokens • $0.0018</span>
              </div>
              <div className="text-slate-400 pl-6 text-[11px]">
                Input: &quot;Customer requested status on order #8921 and refund eligibility for open-box sale items.&quot;
              </div>
            </div>

            {/* Child Spans Tree */}
            <div className="pl-6 border-l-2 border-indigo-500/20 ml-4 space-y-2.5">
              {/* Span 1: Tool Call */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-emerald-400 font-medium flex items-center gap-2">
                    <Database className="h-3.5 w-3.5" /> tool: query_order_database
                  </span>
                  <span className="text-slate-500 text-[10px]">42 ms • PostgreSQL</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Output: <code>&#123;&quot;order_id&quot;: 8921, &quot;status&quot;: &quot;delivered&quot;, &quot;items&quot;: [&quot;UltraHeadphones&quot;]&#125;</code>
                </div>
              </div>

              {/* Span 2: Vector Retrieval */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-amber-400 font-medium flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" /> rag_vector_search: return_policies
                  </span>
                  <span className="text-slate-500 text-[10px]">78 ms • Delta Lake</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Matched 2 docs: &quot;Sale items refundable within 14 days if package intact.&quot; (similarity: 0.94)
                </div>
              </div>

              {/* Span 3: LLM Inference */}
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sky-400 font-medium flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" /> llm_completion: gpt-4o
                  </span>
                  <span className="text-slate-500 text-[10px]">268 ms • 290 completion tokens</span>
                </div>
                <div className="text-emerald-300 text-[11px]">
                  Response: &quot;Order #8921 was delivered. Because your item was purchased during the open-box sale, you are eligible for return within 14 days...&quot;
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "json" && (
          <pre className="p-4 rounded-xl bg-black/40 text-[11px] text-emerald-400 overflow-x-auto">
{`{
  "trace_id": "trc_84a9e10d29bc41a",
  "project_id": "proj_telemetria_prod",
  "latency_ms": 388.4,
  "status": "success",
  "tags": { "environment": "production", "agent": "support-bot-v2" },
  "metadata": {
    "total_tokens": 412,
    "prompt_tokens": 122,
    "completion_tokens": 290,
    "cost_usd": 0.00184
  }
}`}
          </pre>
        )}

        {activeTab === "eval" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div className="text-slate-400 text-[11px]">Hallucination Score</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">0.0%</div>
              <div className="text-[10px] text-slate-500 mt-1">Grounded in policies</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div className="text-slate-400 text-[11px]">Accuracy Rubric</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">99.4%</div>
              <div className="text-[10px] text-slate-500 mt-1">All criteria satisfied</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div className="text-slate-400 text-[11px]">User Sentiment</div>
              <div className="text-xl font-bold text-sky-400 mt-1">Positive</div>
              <div className="text-[10px] text-slate-500 mt-1">Resolution confirmed</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
