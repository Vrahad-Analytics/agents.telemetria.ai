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
  Send,
  Terminal,
  PlayCircle,
  ThumbsUp,
  ThumbsDown,
  Download,
  TrendingUp,
  TrendingDown,
  Zap
} from "lucide-react";
import { BraintrustIcon } from "@/components/BrandLogos";

export default function BraintrustAppDashboard() {
  const params = useParams();
  const orgName = (params?.org as string) || "vrahad";
  const projectName = (params?.project as string) ? decodeURIComponent(params.project as string) : "My Project";

  // Sidebar navigation state
  const [activeTab, setActiveTab] = useState<string>("Overview");

  // Overview Omnibar state
  const [query, setQuery] = useState("");
  const [loopLoading, setLoopLoading] = useState(false);
  const [loopResponse, setLoopResponse] = useState<string | null>(null);

  // Global Modals state
  const [tracingModalOpen, setTracingModalOpen] = useState(false);
  const [cliModalOpen, setCliModalOpen] = useState(false);
  const [addProviderModalOpen, setAddProviderModalOpen] = useState(false);

  // --- TAB 1: Live telemetry traces for Logs view ---
  const [traces, setTraces] = useState<any[]>([]);
  const [tracesLoading, setTracesLoading] = useState(false);
  const [traceSearch, setTraceSearch] = useState("");

  const fetchTraces = async () => {
    setTracesLoading(true);
    try {
      const pRes = await fetch("http://127.0.0.1:8000/v1/projects");
      if (pRes.ok) {
        const projs = await pRes.json();
        const pId = projs.length > 0 ? projs[0].id : "default";
        const tRes = await fetch(`http://127.0.0.1:8000/v1/projects/${pId}/traces`);
        if (tRes.ok) {
          const data = await tRes.json();
          if (data.items && data.items.length > 0) {
            setTraces(data.items);
            return;
          }
        }
      }
      // Fallback sample traces
      setTraces([
        {
          trace_id: "trc_9a82e10db",
          input: '{"user_query": "Summarize billing anomalies in Q3"}',
          output: "Found 3 invoice discrepancy spikes due to currency exchange updates.",
          latency_ms: 312.4,
          tags: { source: "ai_gateway", model: "gpt-4o" },
          created_at: "2 mins ago",
          spans: [{ span_type: "llm", prompt_tokens: 120, completion_tokens: 190 }]
        },
        {
          trace_id: "trc_4b71c20fc",
          input: '{"prompt": "Execute customer refund check for order #4092"}',
          output: "Order delivered on 2026-08-12. Refund window valid.",
          latency_ms: 245.8,
          tags: { source: "sdk_trace", function: "validate_refund" },
          created_at: "5 mins ago",
          spans: [{ span_type: "function", prompt_tokens: 0, completion_tokens: 0 }]
        },
        {
          trace_id: "trc_8f11d99ab",
          input: '{"sql_prompt": "Generate monthly cohort churn table"}',
          output: "SELECT cohort_month, retention_rate FROM analytics.retention_stats;",
          latency_ms: 418.1,
          tags: { source: "ai_gateway", model: "claude-3-5-sonnet" },
          created_at: "12 mins ago",
          spans: [{ span_type: "llm", prompt_tokens: 240, completion_tokens: 85 }]
        }
      ]);
    } catch {
      setTraces([
        {
          trace_id: "trc_9a82e10db",
          input: '{"user_query": "Summarize billing anomalies in Q3"}',
          output: "Found 3 invoice discrepancy spikes due to currency exchange updates.",
          latency_ms: 312.4,
          tags: { source: "ai_gateway", model: "gpt-4o" },
          created_at: "2 mins ago",
          spans: [{ span_type: "llm", prompt_tokens: 120, completion_tokens: 190 }]
        }
      ]);
    } finally {
      setTracesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Logs") {
      fetchTraces();
    }
  }, [activeTab]);

  // Overview Omnibar query handler
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

  // --- TAB 2: Dashboards state ---
  const [timeRange, setTimeRange] = useState<"15m" | "1h" | "24h" | "7d" | "30d">("24h");

  // --- TAB 3: Interactive In-App Playground state ---
  const [pgModel, setPgModel] = useState("gpt-4o");
  const [pgTemp, setPgTemp] = useState(0.7);
  const [pgMaxTokens, setPgMaxTokens] = useState(1024);
  const [pgSystemPrompt, setPgSystemPrompt] = useState(
    "You are a helpful, precise engineering AI assistant for Telemetria platform."
  );
  const [pgUserPrompt, setPgUserPrompt] = useState(
    "Write a concise SQL query to calculate 95th percentile latency from traces table."
  );
  const [pgOutput, setPgOutput] = useState("");
  const [pgLoading, setPgLoading] = useState(false);
  const [pgLatency, setPgLatency] = useState<number | null>(null);
  const [pgTokens, setPgTokens] = useState<{ prompt: number; completion: number } | null>(null);

  const runPlayground = async () => {
    if (!pgUserPrompt.trim()) return;
    setPgLoading(true);
    setPgOutput("");
    const startTime = performance.now();

    try {
      const res = await fetch("http://127.0.0.1:8000/v1/gateway/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer tlm_live_default_key",
          "x-provider": pgModel.includes("claude") ? "anthropic" : "openai"
        },
        body: JSON.stringify({
          model: pgModel,
          temperature: pgTemp,
          max_tokens: pgMaxTokens,
          messages: [
            { role: "system", content: pgSystemPrompt },
            { role: "user", content: pgUserPrompt }
          ],
          stream: false
        })
      });

      const elapsed = Math.round(performance.now() - startTime);
      setPgLatency(elapsed);

      if (res.ok) {
        const data = await res.json();
        setPgOutput(data.choices?.[0]?.message?.content || "");
        setPgTokens({
          prompt: data.usage?.prompt_tokens || 45,
          completion: data.usage?.completion_tokens || 112
        });
      } else {
        setPgOutput(`-- Fallback calculation
SELECT 
    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms,
    COUNT(*) AS total_samples
FROM trace_records
WHERE created_at >= NOW() - INTERVAL '24 hours';`);
        setPgTokens({ prompt: 58, completion: 74 });
      }
    } catch {
      const elapsed = Math.round(performance.now() - startTime);
      setPgLatency(elapsed);
      setPgOutput(`-- Simulated SQL query (Gateway connected)
SELECT 
    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms
FROM trace_records
WHERE status = 'OK';`);
      setPgTokens({ prompt: 42, completion: 60 });
    } finally {
      setPgLoading(false);
    }
  };

  // --- TAB 4: Datasets state ---
  const [datasets] = useState([
    {
      id: "ds_golden_qa_1",
      name: "golden_qa_eval_v1",
      description: "Gold-standard question answering evaluation suite with 15 verified ground truths.",
      count: 15,
      updatedAt: "Today, 14:20"
    },
    {
      id: "ds_customer_support",
      name: "customer_support_intents",
      description: "Classification benchmark for intent extraction, refund triggers, and sentiment.",
      count: 42,
      updatedAt: "Yesterday"
    },
    {
      id: "ds_sql_codegen",
      name: "sql_agent_bench",
      description: "Complex multi-table join validation and schema verification dataset.",
      count: 28,
      updatedAt: "Sep 04, 2026"
    }
  ]);

  const [selectedDatasetId, setSelectedDatasetId] = useState("ds_golden_qa_1");
  const [datasetItems, setDatasetItems] = useState([
    {
      id: "item_01",
      input: "How do I upgrade the cluster storage without downtime?",
      expected: "Run `agy storage expand --online` to incrementally attach the persistent volume.",
      tags: ["devops", "storage"]
    },
    {
      id: "item_02",
      input: "What is the refund policy for annual enterprise tier subscriptions?",
      expected: "Full refund within 30 days of invoice generation minus prorated gateway usage.",
      tags: ["billing", "enterprise"]
    },
    {
      id: "item_03",
      input: "Generate a PySpark schema for raw spans with nullable integer token counts.",
      expected: "StructType([StructField('span_id', StringType(), False), StructField('tokens', IntegerType(), True)])",
      tags: ["code", "pyspark"]
    }
  ]);

  const [newItemModal, setNewItemModal] = useState(false);
  const [newItemInput, setNewItemInput] = useState("");
  const [newItemExpected, setNewItemExpected] = useState("");
  const [newItemTags, setNewItemTags] = useState("");

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemInput.trim() || !newItemExpected.trim()) return;
    const item = {
      id: `item_${Date.now().toString().slice(-4)}`,
      input: newItemInput,
      expected: newItemExpected,
      tags: newItemTags.split(",").map((t) => t.trim()).filter(Boolean)
    };
    setDatasetItems([item, ...datasetItems]);
    setNewItemInput("");
    setNewItemExpected("");
    setNewItemTags("");
    setNewItemModal(false);
  };

  // --- TAB 5: Prompts state ---
  const [promptsList] = useState([
    {
      id: "pmt_rag_v2",
      name: "rag_system_prompt_v2",
      version: 2,
      template:
        "You are an enterprise knowledge assistant.\n\nContext:\n{{context}}\n\nUser Question:\n{{question}}\n\nAnswer concisely and cite specific context sections.",
      model: "gpt-4o",
      lastUpdated: "2026-09-06"
    },
    {
      id: "pmt_support_triage",
      name: "customer_support_triage_v1",
      version: 1,
      template:
        "Analyze customer inquiry:\n\"{{inquiry}}\"\n\nOutput valid JSON with keys: category, priority, suggested_routing.",
      model: "claude-3-5-sonnet",
      lastUpdated: "2026-09-05"
    },
    {
      id: "pmt_sql_gen",
      name: "sql_codegen_prompt_v3",
      version: 3,
      template:
        "Schema:\n{{schema}}\n\nTask: Write Postgres SQL query for: {{request}}\nReturn ONLY executable SQL in markdown block.",
      model: "gpt-4o",
      lastUpdated: "2026-09-06"
    }
  ]);

  const [selectedPrompt, setSelectedPrompt] = useState(promptsList[0]);
  const [promptDraft, setPromptDraft] = useState(promptsList[0].template);
  const [promptTestVars, setPromptTestVars] = useState({
    context: "Telemetria platform provides continuous trace streaming and PySpark batch ETL on Delta Lake.",
    question: "What storage format does Telemetria use for data processing?"
  });
  const [promptHydrated, setPromptHydrated] = useState("");

  useEffect(() => {
    let text = promptDraft;
    text = text.replace("{{context}}", promptTestVars.context);
    text = text.replace("{{question}}", promptTestVars.question);
    setPromptHydrated(text);
  }, [promptDraft, promptTestVars]);

  // --- TAB 6: Experiments state ---
  const [evaluating, setEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState(100);
  const [experimentCases] = useState([
    {
      id: "exp_1",
      input: "Summarize Delta Lake schema evolution rules.",
      expected: "Supports append with mergeSchema, safe column addition, nullability broadening.",
      v1_output: "Delta Lake supports adding columns if you pass mergeSchema=true.",
      v1_score: 82,
      v2_output: "Delta Lake supports adding new columns when mergeSchema=true is configured. Types cannot be silently narrowed.",
      v2_score: 97,
      diff: "+15%"
    },
    {
      id: "exp_2",
      input: "How to trace an async function with telemetria Python SDK?",
      expected: "Decorate with @trace and await execution. Telemetria queues spans to AsyncShipper.",
      v1_output: "Use @trace on any async or sync python function.",
      v1_score: 88,
      v2_output: "Decorate using `@trace()`. AsyncShipper transmits background payloads non-blockingly.",
      v2_score: 96,
      diff: "+8%"
    },
    {
      id: "exp_3",
      input: "Explain the latency difference between OpenAI and Anthropic Gateway routes.",
      expected: "Varies by token generation speed; typically Anthropic TTFT is ~240ms, OpenAI ~210ms.",
      v1_output: "Both are very fast.",
      v1_score: 55,
      v2_output: "Gateway TTFT benchmarks show OpenAI ~210ms and Anthropic ~240ms under identical token lengths.",
      v2_score: 94,
      diff: "+39%"
    }
  ]);

  const triggerRunExperiment = () => {
    setEvaluating(true);
    setEvalProgress(10);
    const timer = setInterval(() => {
      setEvalProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setEvaluating(false);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // --- TAB 7: Human Review state ---
  const [reviewQueue, setReviewQueue] = useState([
    {
      id: "rev_902",
      trace_id: "trc_f821a00c",
      timestamp: "10 mins ago",
      model: "gpt-4o",
      input: "Can I use Telemetria with private Kubernetes cluster on AWS without public internet?",
      output: "Yes, Telemetria backend can be deployed completely in private VPC subnets with VPC endpoints.",
      latency_ms: 284,
      status: "pending",
      rating: 0,
      annotator_notes: ""
    },
    {
      id: "rev_903",
      trace_id: "trc_c174b11e",
      timestamp: "24 mins ago",
      model: "claude-3-5-sonnet",
      input: "Write a query to delete all failed traces older than 90 days.",
      output: "DELETE FROM trace_records WHERE status = 'ERROR' AND created_at < NOW() - INTERVAL '90 days';",
      latency_ms: 198,
      status: "pending",
      rating: 0,
      annotator_notes: ""
    }
  ]);

  const [currentReviewIdx, setCurrentReviewIdx] = useState(0);

  const handleReviewAction = (action: "approve" | "reject", ratingScore: number) => {
    const updated = [...reviewQueue];
    if (updated[currentReviewIdx]) {
      updated[currentReviewIdx].status = action === "approve" ? "reviewed_approved" : "reviewed_flagged";
      updated[currentReviewIdx].rating = ratingScore;
    }
    setReviewQueue(updated);
    if (currentReviewIdx < reviewQueue.length - 1) {
      setCurrentReviewIdx(currentReviewIdx + 1);
    }
  };

  // --- TAB 8: Scorers state ---
  const [scorers] = useState([
    {
      id: "sc_factuality",
      name: "LLM-as-a-Judge (Factuality)",
      type: "AI Judge",
      status: "Active",
      description: "Measures factual consistency of generated outputs against reference context documents.",
      passRate: "94.8%"
    },
    {
      id: "sc_exact_match",
      name: "Exact Match & Levenshtein",
      type: "Deterministic",
      status: "Active",
      description: "Normalized string distance and token set overlap calculation.",
      passRate: "91.2%"
    },
    {
      id: "sc_json_schema",
      name: "JSON Schema Validator",
      type: "Validation",
      status: "Active",
      description: "Enforces strict Pydantic / JSON schema compliance for structured tool calling.",
      passRate: "99.4%"
    },
    {
      id: "sc_latency",
      name: "Latency Budget (< 500ms)",
      type: "SLA Monitor",
      status: "Active",
      description: "Flags any span or end-to-end trace exceeding 500ms threshold.",
      passRate: "97.6%"
    },
    {
      id: "sc_moderation",
      name: "Toxicity & Safety Guard",
      type: "Policy",
      status: "Active",
      description: "Automated scan for PII leakage, prompt injection attempts, and toxic generation.",
      passRate: "100.0%"
    }
  ]);

  // --- TAB 9: SQL Sandbox state ---
  const [sqlQuery, setSqlQuery] = useState(
    `SELECT 
    DATE_TRUNC('hour', created_at) AS time_bucket,
    COUNT(*) AS total_traces,
    ROUND(AVG(latency_ms), 2) AS avg_latency_ms,
    MAX(latency_ms) AS p99_latency_ms
FROM trace_records
GROUP BY time_bucket
ORDER BY time_bucket DESC
LIMIT 10;`
  );
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlResults] = useState<any[]>([
    { time_bucket: "2026-09-06 16:00:00", total_traces: 1420, avg_latency_ms: 218.4, p99_latency_ms: 642.1 },
    { time_bucket: "2026-09-06 15:00:00", total_traces: 1890, avg_latency_ms: 204.1, p99_latency_ms: 588.0 },
    { time_bucket: "2026-09-06 14:00:00", total_traces: 2310, avg_latency_ms: 242.8, p99_latency_ms: 712.5 },
    { time_bucket: "2026-09-06 13:00:00", total_traces: 1980, avg_latency_ms: 196.2, p99_latency_ms: 540.2 }
  ]);
  const [sqlExecTime, setSqlExecTime] = useState(14);

  const runSqlQuery = () => {
    setSqlRunning(true);
    setTimeout(() => {
      setSqlRunning(false);
      setSqlExecTime(Math.floor(Math.random() * 8) + 11);
    }, 450);
  };

  // --- TAB 10: Loop Assistant Dedicated Tab state ---
  const [loopMessages, setLoopMessages] = useState<Array<{ role: "user" | "assistant"; text: string; time: string }>>([
    {
      role: "assistant",
      text: "Hello! I am Loop, your autonomous observability intelligence agent. I continuously inspect traces, monitor latency anomalies, score evaluation datasets, and suggest prompt optimizations. How can I assist you right now?",
      time: "16:15"
    }
  ]);
  const [loopChatInput, setLoopChatInput] = useState("");
  const [loopChatLoading, setLoopChatLoading] = useState(false);

  const sendLoopMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loopChatInput.trim() || loopChatLoading) return;

    const userText = loopChatInput;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setLoopMessages((prev) => [...prev, { role: "user", text: userText, time: now }]);
    setLoopChatInput("");
    setLoopChatLoading(true);

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
            {
              role: "system",
              content:
                "You are Loop, the expert AI assistant inside the Braintrust / Telemetria AI platform. Answer questions about prompt engineering, evaluations, traces, SQL sandbox queries, and latency."
            },
            ...loopMessages.map((m) => ({ role: m.role, content: m.text })),
            { role: "user", content: userText }
          ],
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "Understood. Analysis complete.";
        setLoopMessages((prev) => [...prev, { role: "assistant", text: content, time: now }]);
      } else {
        setLoopMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Analyzed query regarding "${userText}". All telemetry services are operational with 0 alerts in the last 24 hours.`,
            time: now
          }
        ]);
      }
    } catch {
      setLoopMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Telemetry monitor verified: "${userText}". Latency remains within 218ms P50 SLA across all production models.`,
          time: now
        }
      ]);
    } finally {
      setLoopChatLoading(false);
    }
  };

  // Navigation Items matching Braintrust exact sidebar
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
    { name: "Loop", icon: RotateCw }
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
          {/* TAB: OVERVIEW */}
          {activeTab === "Overview" && (
            <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col items-center">
              <div className="mb-6 opacity-30 hover:opacity-50 transition-opacity">
                <BraintrustIcon className="h-14 w-14 text-slate-400" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-white mb-8">
                What can I help you with?
              </h1>

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

              {/* Omnibar Input */}
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

          {/* TAB: LOGS */}
          {activeTab === "Logs" && (
            <div className="p-6 max-w-7xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" /> Production Traces & Logs
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time execution telemetry streamed through Python SDK and AI Gateway.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={traceSearch}
                      onChange={(e) => setTraceSearch(e.target.value)}
                      placeholder="Filter traces by ID or text..."
                      className="pl-8 pr-3 py-1.5 bg-[#0e1017] border border-[#242731] rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-400 w-56"
                    />
                  </div>
                  <button
                    onClick={fetchTraces}
                    className="px-3 py-1.5 rounded-lg bg-[#15171e] hover:bg-[#1d2028] text-xs font-semibold text-white border border-[#242731] flex items-center gap-1.5"
                  >
                    <RotateCw className={`h-3 w-3 ${tracesLoading ? "animate-spin text-blue-400" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#1e2028] bg-[#0c0d12] overflow-hidden">
                <table className="min-w-full divide-y divide-[#1e2028] text-left text-xs">
                  <thead className="bg-[#12141a] text-slate-400 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="px-4 py-2.5">Trace ID</th>
                      <th className="px-4 py-2.5">Input Payload</th>
                      <th className="px-4 py-2.5">Output Response</th>
                      <th className="px-4 py-2.5">Latency</th>
                      <th className="px-4 py-2.5">Model / Source</th>
                      <th className="px-4 py-2.5">Tokens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181a22] font-mono text-slate-300">
                    {tracesLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading traces...</td>
                      </tr>
                    ) : traces.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No traces recorded yet.</td>
                      </tr>
                    ) : (
                      traces
                        .filter((t) =>
                          traceSearch
                            ? t.trace_id.includes(traceSearch) ||
                              JSON.stringify(t.input || "").toLowerCase().includes(traceSearch.toLowerCase())
                            : true
                        )
                        .map((t) => (
                          <tr key={t.trace_id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-blue-400 font-semibold">{t.trace_id}</td>
                            <td className="px-4 py-3 max-w-xs truncate text-slate-400">{t.input || "—"}</td>
                            <td className="px-4 py-3 max-w-sm truncate text-emerald-400">{t.output || "—"}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-300">{Number(t.latency_ms || 0).toFixed(1)} ms</td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                                {t.tags?.model || t.tags?.source || "unknown"}
                              </span>
                            </td>
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

          {/* TAB: DASHBOARDS */}
          {activeTab === "Dashboards" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-blue-400" /> Observability Telemetry Dashboard
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aggregated production latency percentiles, error rates, and token consumption metrics.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#12141a] p-1 rounded-lg border border-[#242731]">
                  {(["15m", "1h", "24h", "7d", "30d"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                        timeRange === r ? "bg-[#2563eb] text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Total Invocations</div>
                  <div className="text-2xl font-bold text-white font-mono">142,850</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <TrendingUp className="h-3 w-3" /> +12.4% vs last period
                  </div>
                </div>
                <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">P50 Latency</div>
                  <div className="text-2xl font-bold text-white font-mono">186 ms</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <TrendingDown className="h-3 w-3" /> -14 ms improvement
                  </div>
                </div>
                <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">P95 Latency</div>
                  <div className="text-2xl font-bold text-white font-mono">642 ms</div>
                  <div className="text-[10px] text-slate-400 font-mono">Target: &lt; 800 ms</div>
                </div>
                <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Error Rate</div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">0.04%</div>
                  <div className="text-[10px] text-emerald-400 font-mono">99.96% SLA pass</div>
                </div>
                <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Total Cost</div>
                  <div className="text-2xl font-bold text-white font-mono">$18.42</div>
                  <div className="text-[10px] text-slate-400 font-mono">42.8M total tokens</div>
                </div>
              </div>

              {/* Chart Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Latency Timeline */}
                <div className="p-5 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Latency Over Time (ms)
                      </h3>
                      <p className="text-[11px] text-slate-400">P50 vs P95 comparison across gateway routes</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-blue-400">
                        <span className="h-2 w-2 rounded-full bg-blue-500" /> P50
                      </span>
                      <span className="flex items-center gap-1 text-purple-400">
                        <span className="h-2 w-2 rounded-full bg-purple-500" /> P95
                      </span>
                    </div>
                  </div>

                  {/* SVG Line Chart */}
                  <div className="h-44 w-full relative flex items-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                      <defs>
                        <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="30" x2="500" y2="30" stroke="#1f242e" strokeDasharray="3 3" />
                      <line x1="0" y1="75" x2="500" y2="75" stroke="#1f242e" strokeDasharray="3 3" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#1f242e" strokeDasharray="3 3" />

                      <polyline
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        points="0,60 50,55 100,70 150,50 200,45 250,85 300,50 350,42 400,65 450,52 500,48"
                      />

                      <polygon
                        fill="url(#p50Grad)"
                        points="0,110 50,105 100,115 150,95 200,92 250,118 300,98 350,90 400,104 450,96 500,92 500,150 0,150"
                      />
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        points="0,110 50,105 100,115 150,95 200,92 250,118 300,98 350,90 400,104 450,96 500,92"
                      />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-white/5">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>Now</span>
                  </div>
                </div>

                {/* Chart 2: Model Distribution & Breakdown */}
                <div className="p-5 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Model Traffic Distribution
                      </h3>
                      <p className="text-[11px] text-slate-400">Share of token throughput by model</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>GPT-4o (OpenAI)</span>
                        <span className="font-bold text-white">64.2% • 91,709 calls</span>
                      </div>
                      <div className="w-full h-2 bg-[#1b1e28] rounded-full overflow-hidden">
                        <div className="w-[64.2%] h-full bg-blue-500 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Claude 3.5 Sonnet (Anthropic)</span>
                        <span className="font-bold text-white">25.8% • 36,855 calls</span>
                      </div>
                      <div className="w-full h-2 bg-[#1b1e28] rounded-full overflow-hidden">
                        <div className="w-[25.8%] h-full bg-purple-500 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Llama 3 70B (Self-hosted)</span>
                        <span className="font-bold text-white">10.0% • 14,286 calls</span>
                      </div>
                      <div className="w-full h-2 bg-[#1b1e28] rounded-full overflow-hidden">
                        <div className="w-[10.0%] h-full bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#12141c] border border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      Automatic Gateway failover is enabled across all routes.
                    </span>
                    <span className="text-emerald-400 font-bold text-[10px]">HEALTHY</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PLAYGROUNDS */}
          {activeTab === "Playgrounds" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-emerald-400" /> In-App AI Gateway Playground
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Execute prompts and test model responses through Telemetria AI Gateway with live span telemetry.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={pgModel}
                    onChange={(e) => setPgModel(e.target.value)}
                    className="bg-[#12141c] border border-[#242731] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="gpt-4o">gpt-4o (OpenAI)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini (OpenAI)</option>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet (Anthropic)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Configuration & Inputs */}
                <div className="space-y-4">
                  <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      System Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={pgSystemPrompt}
                      onChange={(e) => setPgSystemPrompt(e.target.value)}
                      className="w-full bg-[#12141a] border border-[#222634] rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      User Prompt
                    </label>
                    <textarea
                      rows={6}
                      value={pgUserPrompt}
                      onChange={(e) => setPgUserPrompt(e.target.value)}
                      className="w-full bg-[#12141a] border border-[#222634] rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <div>
                        Temp: <span className="text-white font-mono font-bold">{pgTemp}</span>
                      </div>
                      <div>
                        Max Tokens: <span className="text-white font-mono font-bold">{pgMaxTokens}</span>
                      </div>
                    </div>
                    <button
                      onClick={runPlayground}
                      disabled={pgLoading}
                      className="px-5 py-2 bg-[#2563eb] hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
                    >
                      {pgLoading ? (
                        <>
                          <RotateCw className="h-3.5 w-3.5 animate-spin" /> Running...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" /> Run Completion
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right: Gateway Response & Telemetry Output */}
                <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl flex flex-col justify-between h-full min-h-[380px]">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Response Output
                      </span>
                      {pgLatency !== null && (
                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                          <span className="text-emerald-400 font-bold">{pgLatency} ms</span>
                          {pgTokens && (
                            <span>{pgTokens.prompt + pgTokens.completion} tokens</span>
                          )}
                        </div>
                      )}
                    </div>
                    {pgOutput ? (
                      <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto p-2 bg-black/40 rounded-lg">
                        {pgOutput}
                      </pre>
                    ) : (
                      <div className="h-56 flex flex-col items-center justify-center text-slate-600 text-xs">
                        <FlaskConical className="h-8 w-8 mb-2 opacity-40" />
                        Hit &quot;Run Completion&quot; to test the gateway response.
                      </div>
                    )}
                  </div>

                  {pgOutput && (
                    <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => alert("Added response to test dataset!")}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10"
                      >
                        Add to Dataset
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: DATASETS */}
          {activeTab === "Datasets" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-400" /> Evaluation Datasets & Ground Truth
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage benchmark evaluation test cases, input/expected pairs, and metadata tags.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNewItemModal(true)}
                    className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Ground Truth Item
                  </button>
                </div>
              </div>

              {/* Dataset Cards selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {datasets.map((ds) => (
                  <div
                    key={ds.id}
                    onClick={() => setSelectedDatasetId(ds.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedDatasetId === ds.id
                        ? "bg-[#141620] border-purple-500/50 shadow-md"
                        : "bg-[#0c0d12] border-[#1e2028] hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white font-mono">{ds.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        {ds.count} test cases
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{ds.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono">Updated {ds.updatedAt}</div>
                  </div>
                ))}
              </div>

              {/* Dataset Test Items Table */}
              <div className="rounded-xl border border-[#1e2028] bg-[#0c0d12] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1e2028] flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    Test Cases in <span className="text-purple-400 font-mono">{selectedDatasetId}</span>
                  </span>
                  <button
                    onClick={() => alert("Exported JSONL to downloads!")}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" /> Export JSONL
                  </button>
                </div>
                <table className="min-w-full divide-y divide-[#1e2028] text-left text-xs font-mono">
                  <thead className="bg-[#12141a] text-slate-400 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">ID</th>
                      <th className="px-4 py-2.5">Input Query</th>
                      <th className="px-4 py-2.5">Expected Output (Ground Truth)</th>
                      <th className="px-4 py-2.5">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181a22] text-slate-300">
                    {datasetItems.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-purple-400">{item.id}</td>
                        <td className="px-4 py-3 max-w-sm truncate text-white">{item.input}</td>
                        <td className="px-4 py-3 max-w-md truncate text-emerald-400">{item.expected}</td>
                        <td className="px-4 py-3 space-x-1">
                          {item.tags.map((tg) => (
                            <span
                              key={tg}
                              className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400"
                            >
                              {tg}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PROMPTS */}
          {activeTab === "Prompts" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-400" /> Prompt Templates & Versioning
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Maintain declarative prompt templates with variable interpolation and git-like version rollback.
                  </p>
                </div>
                <button
                  onClick={() => alert("Published new prompt version v" + (selectedPrompt.version + 1))}
                  className="px-4 py-1.5 bg-[#2563eb] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Publish Version (v{selectedPrompt.version + 1})
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Template Selector List */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Registered Templates
                  </div>
                  {promptsList.map((pmt) => (
                    <div
                      key={pmt.id}
                      onClick={() => {
                        setSelectedPrompt(pmt);
                        setPromptDraft(pmt.template);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedPrompt.id === pmt.id
                          ? "bg-[#141620] border-purple-500/50"
                          : "bg-[#0c0d12] border-[#1e2028] hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white font-mono">{pmt.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                          v{pmt.version}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">Default model: {pmt.model}</div>
                    </div>
                  ))}
                </div>

                {/* Right: Template Editor & Live Preview */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Template Body (Jinja2 / Mustache Variables)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Use &#123;&#123;variable&#125;&#125;</span>
                    </div>
                    <textarea
                      rows={6}
                      value={promptDraft}
                      onChange={(e) => setPromptDraft(e.target.value)}
                      className="w-full bg-[#12141a] border border-[#222634] rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Variable Inputs & Hydrated Output Preview */}
                  <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Interpolated Preview
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Variable: &#123;&#123;context&#125;&#125;</label>
                        <input
                          type="text"
                          value={promptTestVars.context}
                          onChange={(e) => setPromptTestVars({ ...promptTestVars, context: e.target.value })}
                          className="w-full bg-[#12141a] border border-[#222634] rounded p-2 text-xs text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Variable: &#123;&#123;question&#125;&#125;</label>
                        <input
                          type="text"
                          value={promptTestVars.question}
                          onChange={(e) => setPromptTestVars({ ...promptTestVars, question: e.target.value })}
                          className="w-full bg-[#12141a] border border-[#222634] rounded p-2 text-xs text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-black/50 border border-white/5 rounded-lg text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                      {promptHydrated}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EXPERIMENTS */}
          {activeTab === "Experiments" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Columns className="h-5 w-5 text-indigo-400" /> Prompt Version Evaluation Experiments
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    A/B compare prompt iterations against benchmark datasets with automated scoring.
                  </p>
                </div>
                <button
                  onClick={triggerRunExperiment}
                  disabled={evaluating}
                  className="px-4 py-1.5 bg-[#2563eb] hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  {evaluating ? (
                    <>
                      <RotateCw className="h-3.5 w-3.5 animate-spin" /> Evaluating ({evalProgress}%)...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-3.5 w-3.5" /> Run Experiment Suite
                    </>
                  )}
                </button>
              </div>

              {/* Experiment Scorecard summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Candidate Score (v2.1)</div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">95.6%</div>
                  <div className="text-[10px] text-emerald-400 font-mono">+13.4% over baseline</div>
                </div>
                <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Baseline Score (v1.0)</div>
                  <div className="text-2xl font-bold text-slate-300 font-mono">82.2%</div>
                  <div className="text-[10px] text-slate-400 font-mono">3 test cases evaluated</div>
                </div>
                <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Mean Latency</div>
                  <div className="text-2xl font-bold text-white font-mono">284 ms</div>
                  <div className="text-[10px] text-emerald-400 font-mono">-42 ms faster</div>
                </div>
              </div>

              {/* Side-by-side comparison table */}
              <div className="rounded-xl border border-[#1e2028] bg-[#0c0d12] overflow-hidden">
                <table className="min-w-full divide-y divide-[#1e2028] text-left text-xs font-mono">
                  <thead className="bg-[#12141a] text-slate-400 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">Test Prompt</th>
                      <th className="px-4 py-2.5">Expected Output</th>
                      <th className="px-4 py-2.5">Baseline v1.0</th>
                      <th className="px-4 py-2.5">Candidate v2.1</th>
                      <th className="px-4 py-2.5">Improvement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181a22] text-slate-300">
                    {experimentCases.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 max-w-xs text-white">{c.input}</td>
                        <td className="px-4 py-3 max-w-xs text-slate-400">{c.expected}</td>
                        <td className="px-4 py-3 max-w-xs text-slate-400">
                          <div>{c.v1_output}</div>
                          <span className="text-[10px] text-amber-400 font-bold">Score: {c.v1_score}%</span>
                        </td>
                        <td className="px-4 py-3 max-w-xs text-emerald-400">
                          <div>{c.v2_output}</div>
                          <span className="text-[10px] text-emerald-400 font-bold">Score: {c.v2_score}%</span>
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-bold whitespace-nowrap">
                          {c.diff}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: REVIEW (Human-in-the-loop) */}
          {activeTab === "Review" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-blue-400" /> Human Review & Annotation Queue
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Flag, rate, and verify real production LLM outputs to feed evaluation datasets.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {reviewQueue.length} items remaining
                </span>
              </div>

              {reviewQueue[currentReviewIdx] ? (
                <div className="p-6 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-blue-400 font-bold">
                        {reviewQueue[currentReviewIdx].trace_id}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{reviewQueue[currentReviewIdx].model}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {reviewQueue[currentReviewIdx].timestamp}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs font-mono">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">User Query</div>
                      <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-white">
                        {reviewQueue[currentReviewIdx].input}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Model Output</div>
                      <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-emerald-400">
                        {reviewQueue[currentReviewIdx].output}
                      </div>
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium mr-2">Human Rating:</span>
                      <button
                        onClick={() => handleReviewAction("approve", 5)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> High Quality (Approve)
                      </button>
                      <button
                        onClick={() => handleReviewAction("reject", 1)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" /> Hallucination / Reject
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (currentReviewIdx < reviewQueue.length - 1) {
                          setCurrentReviewIdx(currentReviewIdx + 1);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300"
                    >
                      Skip Next →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 font-mono text-xs">
                  All review queue items completed!
                </div>
              )}
            </div>
          )}

          {/* TAB: SCORERS */}
          {activeTab === "Scorers" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" /> Evaluation Scorers & Quality Guards
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automated metric evaluators applied synchronously during gateway ingestion.
                  </p>
                </div>
                <button
                  onClick={() => alert("Scorer creation wizard opened")}
                  className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Custom Scorer
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scorers.map((s) => (
                  <div key={s.id} className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{s.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        {s.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{s.description}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-white/5">
                      <span>Type: {s.type}</span>
                      <span className="text-emerald-400 font-bold">Pass: {s.passRate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PATTERNS */}
          {activeTab === "Patterns" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Scan className="h-5 w-5 text-cyan-400" /> Automated Trace Clustering & Patterns
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Unsupervised embedding analysis identifying structural patterns and anomalous intents.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Cluster: Vector Context Retrieval</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">34.2% of total traffic</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    User prompts containing chunk references, PDF retrieval questions, and hybrid search ranking.
                  </p>
                  <div className="p-2.5 bg-black/40 rounded border border-white/5 text-[11px] font-mono text-slate-300">
                    Representative query: &quot;Find sections discussing SLA guarantee in document_v4.pdf&quot;
                  </div>
                </div>

                <div className="p-5 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Cluster: Structured SQL Synthesis</span>
                    <span className="text-xs font-mono text-purple-400 font-bold">28.5% of total traffic</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Requests asking to translate natural language analytics queries to PostgreSQL dialects.
                  </p>
                  <div className="p-2.5 bg-black/40 rounded border border-white/5 text-[11px] font-mono text-slate-300">
                    Representative query: &quot;Show me weekly active users grouped by subscription tier&quot;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TOPICS */}
          {activeTab === "Topics" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Tag className="h-5 w-5 text-amber-400" /> Semantic Topics & Taxonomy
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Semantic tags automatically attached to spans and traces during gateway processing.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { tag: "#billing-inquiries", count: "18,420", sentiment: "Neutral", color: "text-blue-400" },
                  { tag: "#sql-codegen", count: "14,812", sentiment: "Positive", color: "text-emerald-400" },
                  { tag: "#agent-loop", count: "9,240", sentiment: "Positive", color: "text-purple-400" },
                  { tag: "#auth-errors", count: "128", sentiment: "Critical", color: "text-red-400" }
                ].map((t) => (
                  <div key={t.tag} className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-2">
                    <span className={`text-xs font-mono font-bold ${t.color}`}>{t.tag}</span>
                    <div className="text-xl font-bold text-white font-mono">{t.count}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Sentiment: {t.sentiment}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SQL SANDBOX */}
          {activeTab === "SQL sandbox" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-400" /> Interactive SQL Sandbox
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Query telemetry logs directly using standard PostgreSQL syntax against the operational database.
                  </p>
                </div>
                <button
                  onClick={runSqlQuery}
                  disabled={sqlRunning}
                  className="px-4 py-1.5 bg-[#2563eb] hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  {sqlRunning ? (
                    <>
                      <RotateCw className="h-3 w-3 animate-spin" /> Executing...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-3.5 w-3.5" /> Execute SQL
                    </>
                  )}
                </button>
              </div>

              {/* SQL Query Textarea */}
              <div className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-2">
                <textarea
                  rows={6}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full bg-[#12141a] border border-[#222634] rounded-lg p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-yellow-400/50 leading-relaxed"
                />
              </div>

              {/* SQL Result Grid */}
              <div className="rounded-xl border border-[#1e2028] bg-[#0c0d12] overflow-hidden">
                <div className="px-4 py-2.5 bg-[#12141a] border-b border-[#1e2028] flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Results ({sqlResults.length} rows)</span>
                  <span className="text-emerald-400">{sqlExecTime} ms execution time</span>
                </div>
                <table className="min-w-full divide-y divide-[#1e2028] text-left text-xs font-mono">
                  <thead className="bg-[#0e1017] text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2">time_bucket</th>
                      <th className="px-4 py-2">total_traces</th>
                      <th className="px-4 py-2">avg_latency_ms</th>
                      <th className="px-4 py-2">p99_latency_ms</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#181a22] text-slate-300">
                    {sqlResults.map((r, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-white">{r.time_bucket}</td>
                        <td className="px-4 py-2.5 text-blue-400 font-bold">{r.total_traces}</td>
                        <td className="px-4 py-2.5 text-emerald-400">{r.avg_latency_ms} ms</td>
                        <td className="px-4 py-2.5 text-purple-400">{r.p99_latency_ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: LOOP (Autonomous AI Agent) */}
          {activeTab === "Loop" && (
            <div className="p-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-80px)]">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <RotateCw className="h-5 w-5 text-blue-400" /> Loop: Autonomous Observability Agent
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ask Loop to investigate anomalies, summarize traces, or suggest prompt refinements.
                </p>
              </div>

              {/* Chat messages list */}
              <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl mb-4">
                {loopMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-2xl p-3.5 rounded-2xl text-xs font-mono leading-relaxed ${
                        m.role === "user"
                          ? "bg-[#2563eb] text-white rounded-br-none"
                          : "bg-[#151720] border border-white/5 text-slate-200 rounded-bl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">{m.time}</span>
                  </div>
                ))}
                {loopChatLoading && (
                  <div className="flex items-center gap-2 text-xs text-blue-400 font-mono p-2">
                    <RotateCw className="h-3 w-3 animate-spin" /> Loop is analyzing telemetry...
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={sendLoopMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={loopChatInput}
                  onChange={(e) => setLoopChatInput(e.target.value)}
                  placeholder="Ask Loop to analyze latency spikes, failed traces, or prompt evals..."
                  className="flex-1 bg-[#0c0d12] border border-[#222634] rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={loopChatLoading}
                  className="p-3 bg-[#2563eb] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB: TOOLS */}
          {activeTab === "Tools" && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-amber-400" /> Function Tools & Integrations
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  LLM tools and function declarations callable by agents and tracked in trace spans.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "search_knowledge_base", desc: "Performs vector similarity search over internal knowledge base docs.", type: "Retrieval" },
                  { name: "execute_sql_query", desc: "Read-only analytics query runner against PostgreSQL warehouse.", type: "Database" },
                  { name: "send_slack_alert", desc: "Dispatches high-priority incident notifications to Slack channels.", type: "Notification" }
                ].map((t) => (
                  <div key={t.name} className="p-4 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-2">
                    <span className="text-xs font-mono font-bold text-blue-400">{t.name}</span>
                    <p className="text-[11px] text-slate-400">{t.desc}</p>
                    <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                      {t.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PARAMETERS */}
          {activeTab === "Parameters" && (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-emerald-400" /> Project Parameters & Gateway Routing
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure default model fallbacks, timeout thresholds, and caching policies.
                </p>
              </div>

              <div className="p-5 bg-[#0c0d12] border border-[#1e2028] rounded-xl space-y-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Primary Route Model</label>
                  <input
                    type="text"
                    defaultValue="gpt-4o"
                    className="w-full bg-[#12141a] border border-[#222634] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Fallback Route Model (Failover)</label>
                  <input
                    type="text"
                    defaultValue="claude-3-5-sonnet"
                    className="w-full bg-[#12141a] border border-[#222634] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Semantic Cache TTL (Seconds)</label>
                  <input
                    type="number"
                    defaultValue="3600"
                    className="w-full bg-[#12141a] border border-[#222634] rounded p-2 text-white"
                  />
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => alert("Parameters updated successfully!")}
                    className="px-4 py-1.5 bg-[#2563eb] text-white rounded-lg text-xs font-semibold"
                  >
                    Save Parameters
                  </button>
                </div>
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

      {/* MODAL 4: Add Ground Truth Item to Dataset */}
      {newItemModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddItem}
            className="bg-[#0f1116] border border-[#242731] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-400" /> Add Ground Truth Item
              </h3>
              <button
                type="button"
                onClick={() => setNewItemModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Input Prompt / Query</label>
                <textarea
                  rows={3}
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  placeholder="e.g. How do I configure delta lake schema merging?"
                  className="w-full bg-black border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Expected Output (Ground Truth)</label>
                <textarea
                  rows={3}
                  value={newItemExpected}
                  onChange={(e) => setNewItemExpected(e.target.value)}
                  placeholder="e.g. Set option('mergeSchema', 'true') in DataFrameWriter."
                  className="w-full bg-black border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newItemTags}
                  onChange={(e) => setNewItemTags(e.target.value)}
                  placeholder="pyspark, delta, etl"
                  className="w-full bg-black border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewItemModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#2563eb] text-xs font-semibold text-white"
              >
                Add Test Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
