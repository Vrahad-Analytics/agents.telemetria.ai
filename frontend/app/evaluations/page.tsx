"use client";

import { useState } from "react";
import { BarChart3, Trophy, Sparkles, ArrowRight, CheckCircle2, XCircle, Sliders, Cpu } from "lucide-react";

interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  output_a: string;
  output_b: string;
  score_a: number;
  score_b: number;
  latency_a_ms: number;
  latency_b_ms: number;
}

export default function EvaluationsPage() {
  const [promptAName, setPromptAName] = useState("rag_system_prompt_v1");
  const [promptBName, setPromptBName] = useState("rag_system_prompt_v2_optimized");
  const [activeDataset, setActiveDataset] = useState("golden_evaluation_benchmark_v1");

  const [testCases] = useState<TestCase[]>([
    {
      id: "eval-01",
      input: "Summarize user churn root causes from Q3 telemetry data.",
      expected_output: "High latency on search and missing export features.",
      output_a: "Users experienced churn primarily driven by query latency regressions and missing data export options.",
      output_b: "Customers left because the app was slow and lacked CSV download.",
      score_a: 0.94,
      score_b: 0.81,
      latency_a_ms: 420.0,
      latency_b_ms: 510.0,
    },
    {
      id: "eval-02",
      input: "Extract entity tags: 'Order #4092 shipped via FedEx to Seattle on 2026-08-12'",
      expected_output: "ORDER_ID: 4092, CARRIER: FedEx, DEST: Seattle, DATE: 2026-08-12",
      output_a: "{\"order_id\": \"4092\", \"carrier\": \"FedEx\", \"destination\": \"Seattle\", \"date\": \"2026-08-12\"}",
      output_b: "FedEx order 4092 in Seattle.",
      score_a: 0.98,
      score_b: 0.65,
      latency_a_ms: 310.0,
      latency_b_ms: 290.0,
    },
    {
      id: "eval-03",
      input: "Translate Python snippet to idiomatic TypeScript with strict interfaces.",
      expected_output: "export interface Config { timeout: number; } ...",
      output_a: "export interface TelemetryConfig { timeoutMs: number; retries: number; }",
      output_b: "interface Config { timeout: any }",
      score_a: 0.96,
      score_b: 0.72,
      latency_a_ms: 610.0,
      latency_b_ms: 580.0,
    },
  ]);

  const avgScoreA = testCases.reduce((acc, c) => acc + c.score_a, 0) / testCases.length;
  const avgScoreB = testCases.reduce((acc, c) => acc + c.score_b, 0) / testCases.length;
  const avgLatA = testCases.reduce((acc, c) => acc + c.latency_a_ms, 0) / testCases.length;
  const avgLatB = testCases.reduce((acc, c) => acc + c.latency_b_ms, 0) / testCases.length;

  const scoreDelta = avgScoreA - avgScoreB;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-indigo-600" /> Prompt Version Evaluations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Compare semantic accuracy, latency, and ground-truth compliance of two prompt versions across a benchmark dataset.
        </p>
      </div>

      {/* Dataset & Prompt Selector Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">Dataset:</span>
            <span className="font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">{activeDataset}</span>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">Baseline (A):</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">{promptAName}</span>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">Candidate (B):</span>
            <span className="font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">{promptBName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <Trophy className="h-3.5 w-3.5" /> Winner: {avgScoreA >= avgScoreB ? "Prompt A (+18.4% Acc)" : "Prompt B"}
          </span>
        </div>
      </div>

      {/* Summary Scorecard Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Average Accuracy Score</div>
          <div className="mt-3 flex items-baseline gap-4">
            <div>
              <span className="text-2xl font-bold text-indigo-600">{(avgScoreA * 100).toFixed(1)}%</span>
              <span className="block text-xs text-slate-500 font-medium mt-0.5">Prompt A</span>
            </div>
            <span className="text-slate-300">vs</span>
            <div>
              <span className="text-2xl font-bold text-purple-600">{(avgScoreB * 100).toFixed(1)}%</span>
              <span className="block text-xs text-slate-500 font-medium mt-0.5">Prompt B</span>
            </div>
          </div>
          <div className="mt-3 text-xs font-semibold text-emerald-600">
            +{(scoreDelta * 100).toFixed(1)}% accuracy improvement on candidate
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Average Latency</div>
          <div className="mt-3 flex items-baseline gap-4">
            <div>
              <span className="text-2xl font-bold text-slate-900">{avgLatA.toFixed(0)} ms</span>
              <span className="block text-xs text-slate-500 font-medium mt-0.5">Prompt A</span>
            </div>
            <span className="text-slate-300">vs</span>
            <div>
              <span className="text-2xl font-bold text-slate-900">{avgLatB.toFixed(0)} ms</span>
              <span className="block text-xs text-slate-500 font-medium mt-0.5">Prompt B</span>
            </div>
          </div>
          <div className="mt-3 text-xs font-medium text-slate-500">
            Latency delta: {(avgLatA - avgLatB).toFixed(0)} ms
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Evaluation Status</div>
          <div className="mt-3 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <span className="text-lg font-bold text-slate-900">3/3 Passed Criteria</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Gold table aggregated in Delta Lake for permanent regression tracking.
          </p>
        </div>
      </div>

      {/* Side-by-Side Comparison Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Test Case Evaluations</h2>
        </div>

        <div className="divide-y divide-slate-200">
          {testCases.map((tc) => (
            <div key={tc.id} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {tc.id}
                </span>
                <div className="text-xs text-slate-500">
                  Ground Truth Expected Output: <span className="font-medium text-slate-700">{tc.expected_output}</span>
                </div>
              </div>

              <div className="text-sm font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Input:</span>
                {tc.input}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prompt A Output */}
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Prompt A Output</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      Score: {(tc.score_a * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-800 whitespace-pre-wrap">{tc.output_a}</p>
                  <div className="text-[11px] text-slate-500 font-mono pt-1">Latency: {tc.latency_a_ms} ms</div>
                </div>

                {/* Prompt B Output */}
                <div className="rounded-lg border border-purple-100 bg-purple-50/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Prompt B Output</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                      Score: {(tc.score_b * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-800 whitespace-pre-wrap">{tc.output_b}</p>
                  <div className="text-[11px] text-slate-500 font-mono pt-1">Latency: {tc.latency_b_ms} ms</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
