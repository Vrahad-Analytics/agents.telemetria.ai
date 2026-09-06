"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown, Check, ArrowRight, Activity, Layers, PlayCircle, BarChart3, Database, Shield, Zap, Sparkles } from "lucide-react";
import { CustomerLogos, WaveformMatrix } from "@/components/BrandLogos";
import { TraceDebuggerCard } from "@/components/TraceDebuggerCard";

export default function BraintrustLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-brand-blue selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          {/* Mint announcement pill */}
          <div className="mb-6 inline-block">
            <Link
              href="/traces"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-forestBg px-3 py-1.5 text-xs font-semibold text-brand-forest hover:bg-emerald-100 transition-all duration-200"
            >
              One platform for agent observability
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </Link>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-950 font-sans leading-[1.08] mb-6">
            Ship quality agents at scale
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-slate-600 font-normal max-w-2xl leading-relaxed mb-8">
            Discover patterns in production, turn them into evals, and improve quality with every release.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Link
              href="/traces"
              className="inline-flex items-center justify-center rounded-full bg-brand-blue px-7 py-3 text-base font-semibold text-white shadow-sm hover:rounded-none hover:bg-slate-950 transition-all duration-200"
            >
              Start building
            </Link>
            <Link
              href="/playground"
              className="inline-flex items-center justify-center rounded-full bg-slate-100 px-7 py-3 text-base font-semibold text-slate-800 hover:bg-slate-200 transition-all duration-200"
            >
              Contact sales
            </Link>
          </div>

          {/* Sub-selector */}
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition-colors">
            <span className="flex items-center gap-1">
              <span>✦</span>
              <span>&gt;_</span>
              <span>❖</span>
            </span>
            <span>Build with agents</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        </div>

        {/* Generative Blue Telemetry Waveform Matrix */}
        <WaveformMatrix />

        {/* Customer Logos Grid */}
        <CustomerLogos />
      </section>

      {/* 2. DEEP ROYAL BLUE SHOWCASE SECTION */}
      <section className="bg-brand-blue text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          {/* Top Pill Slider indicator */}
          <div className="inline-flex flex-col items-center gap-2">
            <div className="flex gap-2 mb-1">
              <div className="w-8 h-1 bg-white rounded-full" />
              <div className="w-8 h-1 bg-white/40 rounded-full" />
              <div className="w-8 h-1 bg-white/40 rounded-full" />
            </div>
            <p className="text-base sm:text-lg font-medium text-white/90">
              Inspect agent traces in real time
            </p>
          </div>

          {/* Trace Debugger Card */}
          <TraceDebuggerCard />
        </div>
      </section>

      {/* 3. BLUSH ROSE PINK SECTION ("Agents fail differently") */}
      <section className="bg-brand-pink text-slate-900 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Vertical Sticky Nav */}
          <div className="hidden lg:block lg:col-span-2 sticky top-28 space-y-4 text-xs font-mono font-semibold tracking-wider text-slate-600">
            <div className="flex items-center gap-2 text-brand-plum font-bold">
              <span>—</span> WORKFLOW
            </div>
            <div className="hover:text-slate-900 cursor-pointer pl-4">PLATFORM</div>
            <div className="hover:text-slate-900 cursor-pointer pl-4">SCALE</div>
            <div className="hover:text-slate-900 cursor-pointer pl-4">SECURITY</div>
            <div className="hover:text-slate-900 cursor-pointer pl-4">CUSTOMERS</div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-10 space-y-12">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-950 max-w-3xl leading-tight">
                Agents fail differently than normal software.{" "}
                <span className="text-brand-plum">
                  You need active observability to monitor and fix them.
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
                  AI drifts and regresses silently. With patterns surfaced automatically,
                  the best teams can evaluate against expectations and iterate continuously.
                </p>

                {/* 3 Value Pillars */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Trace everything</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Inspect prompts, responses, and tool calls in real time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="h-3 w-3 text-slate-900" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Measure quality with evals</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Score outputs with LLMs, code, or humans.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold">❖</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Catch issues early</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Block bad releases before they hit production.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pill Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <Link
                    href="/evaluations"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition-colors"
                  >
                    Explore the three pillars of AI observability ↗
                  </Link>
                  <Link
                    href="/playground"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition-colors"
                  >
                    Take the eval maturity assessment ↗
                  </Link>
                </div>
              </div>

              {/* Mockup Card */}
              <div className="lg:col-span-6 rounded-2xl bg-white/90 border border-black/5 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-mono font-bold text-slate-800">Production Anomaly Detected</span>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    Accuracy Drift -14%
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs text-slate-700">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 font-semibold">Regressed Prompt:</span> customer_onboarding_v4
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-400 font-semibold">Root Cause:</span> Tool timeout on CRM database during high load.
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    Auto-generated 12 benchmark test cases added to golden evaluation set.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM CAPABILITIES SECTION ("Agent observability and evals for the whole team") */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-950 leading-tight">
            Agent observability and evals for the whole team.
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-brand-blue mt-2">
            From engineering to product, in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Observability */}
          <div className="rounded-2xl border border-slate-200 p-8 space-y-4 bg-white hover:border-brand-blue hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-950">Observability</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                See what actually happened in production. Inspect every agent trace and tool call, search across millions of logs, and track latency, cost, and quality in real time.
              </p>
              <ul className="space-y-2 pt-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="text-brand-blue">▪</span> Scalable non-blocking Python SDK
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-blue">▪</span> Microsecond span hierarchy & execution tree
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-blue">▪</span> Automated cost and token attribution
                </li>
              </ul>
            </div>

            <Link
              href="/traces"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue pt-4 hover:translate-x-1 transition-transform"
            >
              Open Traces Inspector <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 2: Evaluations */}
          <div className="rounded-2xl border border-slate-200 p-8 space-y-4 bg-white hover:border-purple-600 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-950">Evaluations</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Test before you ship. Create datasets from production edge cases, run automated model-graded rubrics, and prevent regressions before they reach users.
              </p>
              <ul className="space-y-2 pt-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">▪</span> Side-by-side prompt version diffing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">▪</span> LLM-as-a-judge accuracy scoring
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600">▪</span> Gold regression dataset compaction
                </li>
              </ul>
            </div>

            <Link
              href="/evaluations"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 pt-4 hover:translate-x-1 transition-transform"
            >
              Run Prompt Evaluations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 3: AI Gateway */}
          <div className="rounded-2xl border border-slate-200 p-8 space-y-4 bg-white hover:border-emerald-600 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <PlayCircle className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-950">AI Gateway</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A single unified reverse proxy for OpenAI, Anthropic, and custom models. Includes SSE streaming, caching, fallback routing, and zero-latency span capture.
              </p>
              <ul className="space-y-2 pt-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">▪</span> OpenAI-compatible /chat/completions proxy
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">▪</span> Real-time server-sent event (SSE) streaming
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">▪</span> Built-in playground with prompt testing
                </li>
              </ul>
            </div>

            <Link
              href="/playground"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 pt-4 hover:translate-x-1 transition-transform"
            >
              Launch Playground <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold">
            <span className="text-cyan-600 font-mono font-black text-xl">✦</span>
            <span>agents.telemetria.ai • Autonomous Agent Observability & Evals</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
            <Link href="/traces" className="hover:text-slate-900 transition-colors">Traces</Link>
            <Link href="/playground" className="hover:text-slate-900 transition-colors">Playground</Link>
            <Link href="/evaluations" className="hover:text-slate-900 transition-colors">Evaluations</Link>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
              API Docs ↗
            </a>
          </div>

          <div className="text-xs text-slate-400">
            © 2026 agents.telemetria.ai • Built for High-Stakes Production AI Agents
          </div>
        </div>
      </footer>
    </div>
  );
}
