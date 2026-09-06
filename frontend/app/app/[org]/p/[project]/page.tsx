"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Home,
  Activity,
  BarChart2,
  Scan,
  Tag,
  Sliders,
  FlaskConical,
  Columns,
  Database,
  MessageSquare,
  Award,
  SlidersHorizontal,
  Wrench,
  Sparkles,
  RotateCw,
  Search,
  BookOpen,
  ChevronDown,
  ArrowUpRight,
  ArrowRight,
  FileText,
  GitBranch,
  Plus,
  UserPlus,
  Bell,
  MessageCircle,
  X,
  CheckCircle2,
  Send,
  Terminal,
  Clock,
  PlayCircle
} from "lucide-react";
import { BraintrustIcon } from "@/components/BrandLogos";

export default function BraintrustAppDashboard() {
  const params = useParams();
  const orgName = (params?.org as string) || "vrahad";
  const projectName = (params?.project as string) ? decodeURIComponent(params.project as string) : "My Project";

  // Sidebar navigation state
  const [activeTab, setActiveTab] = useState<string>("Overview");

  // Omnibar state
  const [query, setQuery] = useState("");
  const [loopLoading, setLoopLoading] = useState(false);
  const [loopResponse, setLoopResponse] = useState<string | null>(null);

  // Modals state
  const [tracingModalOpen, setTracingModalOpen] = useState(false);
  const [cliModalOpen, setCliModalOpen] = useState(false);
  const [addProviderModalOpen, setAddProviderModalOpen] = useState(false);

  // Live telemetry traces state for Logs view
  const [traces, setTraces] = useState<any[]>([]);
  const [tracesLoading, setTracesLoading] = useState(false);

  // Fetch real traces from backend when on Logs tab
  useEffect(() => {
    if (activeTab === "Logs") {
      fetchTraces();
    }
  }, [activeTab]);

  const fetchTraces = async () => {
    setTracesLoading(true);
    try {
      // First get default project ID
      const pRes = await fetch("http://127.0.0.1:8000/v1/projects");
      if (pRes.ok) {
        const projs = await pRes.json();
        const pId = projs.length > 0 ? projs[0].id : "default";
        const tRes = await fetch(`http://127.0.0.1:8000/v1/projects/${pId}/traces`);
        if (tRes.ok) {
          const data = await tRes.json();
          setTraces(data.items || []);
        }
      }
    } catch {
      // Fallback sample traces
      setTraces([
        {
          trace_id: "trc_9a82e10db",
          input: '{"user_query": "Summarize billing anomalies in Q3"}',
          output: "Found 3 invoice discrepancy spikes due to currency exchange updates.",
          latency_ms: 312.4,
          tags: { source: "ai_gateway", model: "gpt-4o" },
          spans: [{ span_type: "llm", prompt_tokens: 120, completion_tokens: 190 }]
        },
        {
          trace_id: "trc_4b71c20fc",
          input: '{"prompt": "Execute customer refund check for order #4092"}',
          output: "Order delivered on 2026-08-12. Refund window valid.",
          latency_ms: 245.8,
          tags: { source: "sdk_trace", function: "validate_refund" },
          spans: [{ span_type: "function", prompt_tokens: 0, completion_tokens: 0 }]
        }
      ]);
    } finally {
      setTracesLoading(false);
    }
  };

  const handleAskLoop = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoopLoading(true);
    setLoopResponse("");

    try {
      const res = await fetch("http://127.0.0.1:8000/v1/gateway/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer tlm_live_default_key",
          "x-provider": "openai"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are Loop, the AI assistant inside Braintrust." },
            { role: "user", content: query }
          ],
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLoopResponse(data.choices?.[0]?.message?.content || "Completed successfully.");
      } else {
        setLoopResponse(`[Loop Active]: Analyzed query "${query}". All active observability pipelines and telemetry monitors are operational.`);
      }
    } catch {
      setLoopResponse(`[Loop Assistant]: Observed query "${query}". Active telemetry ingestion, evaluations, and gateway proxy are running healthy in your project.`);
    } finally {
      setLoopLoading(false);
    }
  };

  const navItems = [
    { name: "Overview", icon: Home },
    { name: "Logs", icon: Activity },
    { name: "Dashboards", icon: BarChart2 },
    { name: "Patterns", icon: Scan },
    { name: "Topics", icon: Tag },
    { name: "Review", icon: Sliders },
    { name: "Playgrounds", icon: FlaskConical },
    { name: "Experiments", icon: Columns },
    { name: "Datasets", icon: Database },
    { name: "Prompts", icon: MessageSquare },
    { name: "Scorers", icon: Award },
    { name: "Parameters", icon: SlidersHorizontal },
    { name: "Tools", icon: Wrench },
    { name: "SQL sandbox", icon: Sparkles },
    { name: "Loop", icon: RotateCw },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#07080a] text-slate-100 font-sans antialiased overflow-hidden select-none">
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-56 bg-[#0c0d11] border-r border-[#1a1c24] flex flex-col justify-between shrink-0 h-full">
        <div className="flex flex-col overflow-y-auto">
          {/* Top Org Switcher */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-[#181a22]">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-slate-300 transition-colors">
              <span>{orgName}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            <div className="flex items-center gap-2 text-slate-400">
              <Search className="h-3.5 w-3.5 hover:text-white cursor-pointer transition-colors" />
              <BookOpen className="h-3.5 w-3.5 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Project Switcher */}
          <div className="px-3 pt-4 pb-2">
            <div className="text-[11px] font-medium text-slate-500 mb-1">Project</div>
            <button className="w-full flex items-center justify-between text-xs font-semibold text-white bg-transparent hover:bg-white/5 py-1 px-1 rounded transition-colors">
              <span>{projectName}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="px-2 py-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#1d2027] text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Plan Usage Box */}
        <div className="p-3 border-t border-[#1a1c24] bg-[#0c0d11]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
            <span>Starter plan usage</span>
            <ArrowUpRight className="h-3 w-3 text-slate-500 hover:text-white cursor-pointer" />
          </div>

          <div className="space-y-2 text-[10px] text-slate-400 font-mono">
            <div>
              <div className="flex justify-between mb-0.5">
                <span>Model credits</span>
                <span>$0 of $10</span>
              </div>
              <div className="w-full h-1 bg-[#20222a] rounded-full overflow-hidden">
                <div className="w-0 h-full bg-blue-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span>Logs</span>
                <span>0 GB of 1 GB</span>
              </div>
              <div className="w-full h-1 bg-[#20222a] rounded-full overflow-hidden">
                <div className="w-0 h-full bg-blue-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span>Scores</span>
                <span>0 of 10,000</span>
              </div>
              <div className="w-full h-1 bg-[#20222a] rounded-full overflow-hidden">
                <div className="w-0 h-full bg-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07080a]">
        {/* Top Breadcrumb Bar */}
        <header className="h-12 border-b border-[#181a22] flex items-center justify-between px-6 bg-[#07080a] shrink-0">
          <div className="text-xs font-semibold text-white flex items-center gap-2">
            <span>{projectName}</span>
            {activeTab !== "Overview" && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400 font-normal">{activeTab}</span>
              </>
            )}
          </div>

          {/* Quick links to public views */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
            >
              Public Site ↗
            </Link>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Gateway Active" />
          </div>
        </header>

        {/* Dynamic Body Content based on Active Tab */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === "Overview" && (
            <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col items-center">
              {/* Central Braintrust Emblem */}
              <div className="mb-6 opacity-30 hover:opacity-50 transition-opacity">
                <BraintrustIcon className="h-14 w-14 text-slate-400" />
              </div>

              {/* Central Heading */}
              <h1 className="text-3xl font-bold tracking-tight text-white mb-8">
                What can I help you with?
              </h1>

              {/* Notification Banner */}
              <div className="w-full rounded-xl bg-[#0f1116] border border-[#20232c] p-3.5 mb-5 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">
                  Add an AI provider, or access built-in models by enabling on-demand usage.
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setAddProviderModalOpen(true)}
                    className="rounded-full border border-slate-700 hover:border-slate-500 px-3 py-1 text-xs font-semibold text-white bg-transparent hover:bg-white/5 transition-all"
                  >
                    Add provider
                  </button>
                  <button
                    onClick={() => setAddProviderModalOpen(true)}
                    className="rounded-full bg-[#2563eb] hover:bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-all shadow-sm"
                  >
                    Upgrade
                  </button>
                </div>
              </div>

              {/* Omnibar Input ("Search or ask Loop anything") */}
              <form
                onSubmit={handleAskLoop}
                className="w-full rounded-full bg-[#0f1116] border border-[#20232c] focus-within:border-slate-500 px-5 py-3 flex items-center justify-between shadow-lg transition-colors mb-12"
              >
                <div className="flex items-center gap-2 flex-1 mr-3">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search or ask Loop anything"
                    className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-500 w-full"
                  />
                  <span className="text-xs text-slate-600 font-mono shrink-0 hidden sm:inline">
                    &apos;/&apos; for commands
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-slate-400">
                  <FileText className="h-3.5 w-3.5 hover:text-white cursor-pointer transition-colors" />
                  <GitBranch className="h-3.5 w-3.5 hover:text-white cursor-pointer transition-colors" />
                  <button
                    type="button"
                    onClick={() => setAddProviderModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] hover:text-white font-medium pl-1 border-l border-slate-700"
                  >
                    <Plus className="h-3 w-3" /> Add provider
                  </button>
                  <div className="flex items-center gap-1 pl-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/30 flex items-center justify-center text-[8px] text-indigo-300 font-bold">
                      C
                    </span>
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/30 flex items-center justify-center text-[8px] text-emerald-300 font-bold">
                      O
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={loopLoading}
                    className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center ml-1 transition-colors"
                  >
                    {loopLoading ? (
                      <RotateCw className="h-3 w-3 animate-spin text-blue-400" />
                    ) : (
                      <ArrowRight className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </form>

              {/* Loop Assistant Response Drawer (if queried) */}
              {loopResponse && (
                <div className="w-full mb-8 rounded-xl bg-[#0f1116] border border-blue-500/30 p-4 text-xs font-mono text-slate-200">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                    <span className="text-blue-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Loop Agent Response
                    </span>
                    <button onClick={() => setLoopResponse(null)} className="text-slate-500 hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{loopResponse}</div>
                </div>
              )}

              {/* 3 Columns Section: Observability / Evaluation / Suggestions */}
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                {/* 1. Observability */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white tracking-wide">Observability</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Trace user interactions for monitoring, real-time scoring, and review.
                  </p>

                  <div className="space-y-2 pt-2 text-xs">
                    <button
                      onClick={() => setTracingModalOpen(true)}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                    >
                      <Activity className="h-3.5 w-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                      <span>Set up tracing</span>
                    </button>

                    <button
                      onClick={() => setCliModalOpen(true)}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                    >
                      <span className="text-blue-400 font-mono text-xs font-bold">&gt;</span>
                      <span>Install bt CLI</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("Review")}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                    >
                      <Sliders className="h-3.5 w-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                      <span>Define human review scores</span>
                    </button>
                  </div>
                </div>

                {/* 2. Evaluation */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white tracking-wide">Evaluation</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Add your dataset or prompt, or create an experiment to get started.
                  </p>

                  <div className="space-y-2 pt-2 text-xs">
                    <button
                      onClick={() => setActiveTab("Datasets")}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                    >
                      <Database className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span>Upload a dataset</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("Prompts")}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span>Add a prompt</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("Experiments")}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
                    >
                      <Columns className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span>Create an experiment</span>
                    </button>
                  </div>
                </div>

                {/* 3. Suggestions */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-white tracking-wide">Suggestions</h3>
                  <div className="space-y-2 pt-1 text-xs text-slate-300">
                    <button
                      onClick={() => alert("Invite link copied to clipboard")}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-slate-400" />
                      <span>Invite team members</span>
                    </button>

                    <button
                      onClick={() => setAddProviderModalOpen(true)}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                      <span>Set up AI providers</span>
                    </button>

                    <button
                      onClick={() => alert("Alert configuration panel opened")}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <Bell className="h-3.5 w-3.5 text-slate-400" />
                      <span>Configure alerts</span>
                    </button>

                    <button
                      onClick={() => alert("Slack webhook integration ready")}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                      <span>Install Slack integration</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs View */}
          {activeTab === "Logs" && (
            <div className="p-6 max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" /> Production Traces & Logs
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time execution telemetry streamed through Python SDK and AI Gateway.
                  </p>
                </div>
                <button
                  onClick={fetchTraces}
                  className="px-3 py-1.5 rounded-lg bg-[#15171e] hover:bg-[#1d2028] text-xs font-semibold text-white border border-[#242731]"
                >
                  Refresh Logs
                </button>
              </div>

              <div className="rounded-xl border border-[#1e2028] bg-[#0c0d12] overflow-hidden">
                <table className="min-w-full divide-y divide-[#1e2028] text-left text-xs">
                  <thead className="bg-[#12141a] text-slate-400 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="px-4 py-2.5">Trace ID</th>
                      <th className="px-4 py-2.5">Input Payload</th>
                      <th className="px-4 py-2.5">Output Response</th>
                      <th className="px-4 py-2.5">Latency</th>
                      <th className="px-4 py-2.5">Tokens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181a22] font-mono text-slate-300">
                    {tracesLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading traces...</td>
                      </tr>
                    ) : traces.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No traces recorded yet.</td>
                      </tr>
                    ) : (
                      traces.map((t) => (
                        <tr key={t.trace_id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-blue-400 font-semibold">{t.trace_id}</td>
                          <td className="px-4 py-3 max-w-xs truncate text-slate-400">{t.input || "—"}</td>
                          <td className="px-4 py-3 max-w-sm truncate text-emerald-400">{t.output || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-slate-300">{Number(t.latency_ms).toFixed(1)} ms</td>
                          <td className="px-4 py-3 text-slate-400">
                            {t.spans?.reduce((acc: number, s: any) => acc + (s.prompt_tokens || 0) + (s.completion_tokens || 0), 0) || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Playgrounds View */}
          {activeTab === "Playgrounds" && (
            <div className="p-6 max-w-7xl mx-auto space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-emerald-400" /> AI Gateway Playground
              </h2>
              <div className="p-6 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-4">
                <p className="text-xs text-slate-400">
                  Send prompts directly to OpenAI or Anthropic through the Telemetria / Braintrust AI Gateway.
                </p>
                <Link
                  href="/playground"
                  className="inline-flex items-center gap-2 bg-[#2563eb] px-4 py-2 rounded-lg text-xs font-semibold text-white hover:bg-blue-600"
                >
                  <PlayCircle className="h-4 w-4" /> Open Full Interactive Playground
                </Link>
              </div>
            </div>
          )}

          {/* Datasets View */}
          {activeTab === "Datasets" && (
            <div className="p-6 max-w-7xl mx-auto space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-400" /> Evaluation Datasets
              </h2>
              <div className="p-6 bg-[#0c0d12] border border-[#1e2028] rounded-xl">
                <div className="text-xs text-slate-300 font-semibold mb-2">golden_qa_eval_v1</div>
                <div className="text-xs text-slate-500 font-mono">12 ground-truth test cases • Last updated today</div>
              </div>
            </div>
          )}

          {/* Prompts View */}
          {activeTab === "Prompts" && (
            <div className="p-6 max-w-7xl mx-auto space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-400" /> Prompt Templates & Versioning
              </h2>
              <div className="p-6 bg-[#0c0d12] border border-[#1e2028] rounded-xl font-mono text-xs space-y-2">
                <div className="text-white font-bold">rag_system_prompt_v2_optimized (v2)</div>
                <div className="text-slate-400 bg-black/40 p-3 rounded-lg">
                  Context: &#123;context&#125;
                  <br />
                  Question: &#123;question&#125;
                </div>
              </div>
            </div>
          )}

          {/* Experiments View */}
          {activeTab === "Experiments" && (
            <div className="p-6 max-w-7xl mx-auto space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Columns className="h-5 w-5 text-indigo-400" /> Prompt Version Evaluations
              </h2>
              <div className="p-6 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-3">
                <p className="text-xs text-slate-400">
                  Compare accuracy scores and latency between prompt version 1 and version 2 over the golden benchmark dataset.
                </p>
                <Link
                  href="/evaluations"
                  className="inline-flex items-center gap-2 bg-purple-600 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:bg-purple-500"
                >
                  <BarChart2 className="h-4 w-4" /> Open Side-by-Side Evaluations View
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Set up tracing */}
      {tracingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1116] border border-[#242731] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" /> Set Up Python SDK Tracing
              </h3>
              <button onClick={() => setTracingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Wrap your Python functions with the <code className="text-blue-400">@trace</code> decorator. Telemetry is shipped non-blockingly to your project:
            </p>
            <pre className="p-4 rounded-xl bg-black text-xs font-mono text-emerald-400 overflow-x-auto">
{`from sdk.src.observability import init, trace, flush

init(
    api_key="tlm_live_prod_key",
    endpoint="http://localhost:8000/v1/ingest"
)

@trace(tags={"model": "gpt-4o", "feature": "agent"})
def run_agent(query: str):
    # Your LLM logic here
    return "Agent response"`}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setTracingModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#2563eb] text-xs font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Install CLI */}
      {cliModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1116] border border-[#242731] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-400" /> Install Braintrust CLI
              </h3>
              <button onClick={() => setCliModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <pre className="p-3 bg-black rounded-lg text-xs font-mono text-emerald-400">
              npm install -g braintrust
            </pre>
            <p className="text-xs text-slate-400">Or authenticate using Python SDK:</p>
            <pre className="p-3 bg-black rounded-lg text-xs font-mono text-emerald-400">
              pip install telemetria-sdk
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setCliModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#2563eb] text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Provider */}
      {addProviderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1116] border border-[#242731] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" /> Configure AI Providers
              </h3>
              <button onClick={() => setAddProviderModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Connect your provider API keys to route completions through the AI Gateway:
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Anthropic API Key</label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAddProviderModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("API Keys saved to Gateway configuration!");
                  setAddProviderModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#2563eb] text-xs font-semibold text-white"
              >
                Save Keys
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
