"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TelemetriaIcon } from "@/components/BrandLogos";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8000/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Authentication failed. Please verify credentials.");
      }

      const data = await res.json();
      localStorage.setItem("telemetria_token", data.access_token);
      localStorage.setItem("telemetria_user", JSON.stringify(data.user));

      router.push("/app/telemetria/p/eval-playground");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("admin@telemetria.ai");
    setPassword("telemetria2026");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25">
              <TelemetriaIcon className="h-6 w-6 text-white" />
            </div>
            <span className="font-mono text-xl font-bold tracking-tight text-white">
              agents.telemetria.ai
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Sign in to your platform
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Active Observability, Real-Time AI Evaluations & SQL Analytics
          </p>

          <div className="mt-3 inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetria Pro Plan (Paid Active) • MongoDB Atlas Connected</span>
          </div>
        </div>

        {/* Auth Box */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Password
                </label>
                <span className="text-[11px] text-zinc-500 cursor-pointer hover:text-zinc-300">
                  Forgot password?
                </span>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              {loading ? "Authenticating with Atlas..." : "Sign In"}
            </button>
          </form>

          {/* One-click demo credentials */}
          <div className="mt-5 border-t border-zinc-900 pt-4">
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full flex items-center justify-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-all"
            >
              <span>⚡ One-Click Pro Credentials</span>
              <span className="font-mono text-[10px] text-zinc-500">
                (admin@telemetria.ai)
              </span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              Sign up for Pro Plan
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-[11px] text-zinc-600">
          Encrypted with TLS 1.3 &bull; Powered by MongoDB Atlas &bull; agents.telemetria.ai
        </p>
      </div>
    </div>
  );
}
