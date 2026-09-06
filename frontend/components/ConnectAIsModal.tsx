"use client";

import React, { useState, useEffect } from "react";
import { TelemetriaIcon, OpenAIIcon, AnthropicIcon } from "./BrandLogos";

interface ConnectAIsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

interface ProviderStatus {
  provider_name: string;
  is_connected: boolean;
  masked_key: string;
  base_url?: string;
  default_model: string;
}

export default function ConnectAIsModal({
  isOpen,
  onClose,
  projectId,
}: ConnectAIsModalProps) {
  const [activeProvider, setActiveProvider] = useState<"openai" | "anthropic" | "custom">("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState("gpt-4o");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProviders();
    }
  }, [isOpen, projectId]);

  const fetchProviders = async () => {
    try {
      const res = await fetch(`http://localhost:8000/v1/projects/${projectId}/providers`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (e) {
      console.error("Failed to load providers", e);
    }
  };

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`http://localhost:8000/v1/projects/${projectId}/providers/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_name: activeProvider,
          api_key: apiKey || undefined,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({
        status: "error",
        message: `Network error: ${e.message || "Failed to reach AI provider gateway."}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert("Please enter a valid API key.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:8000/v1/projects/${projectId}/providers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_name: activeProvider,
          api_key: apiKey,
          base_url: baseUrl || undefined,
          default_model: defaultModel,
        }),
      });
      if (res.ok) {
        await fetchProviders();
        setApiKey("");
        setTestResult({
          status: "success",
          message: `Successfully connected and encrypted ${activeProvider.toUpperCase()} credentials in MongoDB Atlas!`,
        });
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to save provider config.");
      }
    } catch (e: any) {
      alert(e.message || "Error saving credentials");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
              <TelemetriaIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center space-x-2">
                <span>Connect Your AIs</span>
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-400">
                  BYOK Gateway
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Route queries through your own OpenAI or Anthropic accounts with live telemetry logging.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Provider Tabs */}
        <div className="mt-5 grid grid-cols-3 gap-2 p-1 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setActiveProvider("openai");
              setDefaultModel("gpt-4o");
              setTestResult(null);
            }}
            className={`flex items-center justify-center space-x-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeProvider === "openai"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <OpenAIIcon className="h-4 w-4" />
            <span>OpenAI</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveProvider("anthropic");
              setDefaultModel("claude-3-5-sonnet");
              setTestResult(null);
            }}
            className={`flex items-center justify-center space-x-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeProvider === "anthropic"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <AnthropicIcon className="h-4 w-4 text-[#D97706]" />
            <span>Anthropic</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveProvider("custom");
              setDefaultModel("custom-model");
              setTestResult(null);
            }}
            className={`flex items-center justify-center space-x-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeProvider === "custom"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>⚡ Custom / vLLM</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300">
              {activeProvider === "openai"
                ? "OpenAI API Key (sk-...)"
                : activeProvider === "anthropic"
                ? "Anthropic API Key (sk-ant-...)"
                : "API Secret Key"}
            </label>
            <input
              type="password"
              placeholder={
                activeProvider === "openai"
                  ? "sk-proj-..."
                  : activeProvider === "anthropic"
                  ? "sk-ant-api03-..."
                  : "Bearer token"
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Keys are encrypted at rest with AES-256 and securely saved in your MongoDB Atlas cluster.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Default Model
              </label>
              <input
                type="text"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Custom Endpoint Base URL (Optional)
              </label>
              <input
                type="text"
                placeholder="https://api.openai.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`rounded-lg p-3 text-xs border ${
                testResult.status === "success"
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                  : testResult.status === "warning"
                  ? "border-amber-500/30 bg-amber-950/20 text-amber-300"
                  : "border-rose-500/30 bg-rose-950/20 text-rose-400"
              }`}
            >
              {testResult.message}
            </div>
          )}

          {/* Connected Providers Pill list */}
          {providers.length > 0 && (
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Configured AI Providers
              </div>
              <div className="space-y-1.5">
                {providers.map((p) => (
                  <div
                    key={p.provider_name}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-zinc-800/40 border border-zinc-800"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${p.is_connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      <span className="font-medium capitalize text-zinc-200">{p.provider_name}</span>
                      <span className="text-[11px] text-zinc-500">({p.default_model})</span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400">{p.masked_key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {isTesting ? "Testing Ping..." : "⚡ Test Connection"}
            </button>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                {isSaving ? "Encrypting & Saving..." : "Save Provider Key"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
