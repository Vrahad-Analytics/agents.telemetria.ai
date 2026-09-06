import Link from "next/link";
import { ArrowRight, Layers, PlayCircle, BarChart3, Database, ShieldCheck, Zap } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
            <Zap className="h-3.5 w-3.5" /> High-Throughput Active Observability
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Active Observability & Evaluation Platform for LLMs
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Instrument applications with our lightweight Python SDK, proxy models through the AI Gateway,
            process telemetry at scale with PySpark & Delta Lake, and continuously evaluate prompt accuracy.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/traces"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Layers className="h-4 w-4" /> Explore Traces
            </Link>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <PlayCircle className="h-4 w-4" /> Open Playground
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Traces Processed", value: "148,290", change: "+14.2% this week", icon: Layers, color: "text-indigo-600", bg: "bg-indigo-50" },
          { title: "P95 Latency", value: "482 ms", change: "-38 ms optimization", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
          { title: "Tokens Tracked", value: "12.8M", change: "7.4M prompt / 5.4M comp", icon: Database, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Gateway Uptime", value: "99.98%", change: "Zero dropped telemetry", icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{stat.title}</span>
                <div className={`rounded-lg p-2 ${stat.bg} ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</div>
                <div className="mt-1 text-xs text-slate-500 font-medium">{stat.change}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Modules Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Link
          href="/traces"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-4 group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Traces & Spans Inspection
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Drill down into every LLM request, tool execution, and function span with microsecond latency breakdowns, token counts, and input/output inspection.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
            View Live Traces <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/playground"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 mb-4 group-hover:scale-105 transition-transform">
              <PlayCircle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              AI Gateway Playground
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Test prompt templates in real-time through the reverse proxy. Inspect streaming tokens, response latencies, and automatically log spans to the telemetry lake.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
            Launch Playground <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/evaluations"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Model & Prompt Evaluations
            </h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Compare prompt versions side-by-side over golden datasets. Calculate accuracy scores, cost deltas, and latency tradeoffs before rolling out to production.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
            Compare Prompts <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
