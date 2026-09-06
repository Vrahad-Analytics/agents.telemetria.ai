"use client";

import { useState } from "react";
import { X, Lock, Mail, User, ShieldCheck, Sparkles, RotateCw, CheckCircle2 } from "lucide-react";
import { TelemetriaIcon } from "./BrandLogos";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("admin@telemetria.ai");
  const [password, setPassword] = useState("telemetria2026");
  const [name, setName] = useState("Vrahad Admin");
  const [orgName, setOrgName] = useState("vrahad");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? "http://127.0.0.1:8000/v1/auth/register" : "http://127.0.0.1:8000/v1/auth/login";
    const body = isRegister
      ? { email, password, name, org_name: orgName }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("tlm_token", data.access_token);
        localStorage.setItem("tlm_user", JSON.stringify(data.user));
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#0a0c10] border border-[#202534] rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <TelemetriaIcon className="h-10 w-10 text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            {isRegister ? "Create agents.telemetria.ai Account" : "Sign in to agents.telemetria.ai"}
          </h2>
          <p className="text-xs text-slate-400">
            Active Observability & Evaluation Platform for Autonomous Agents
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
            <ShieldCheck className="h-3 w-3" /> Includes Telemetria Pro Plan ($100 Paid Credits)
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Full Name</label>
                <div className="relative">
                  <User className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-[#12151e] border border-[#222736] rounded-lg pl-9 pr-3 py-2 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Organization Slug</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="vrahad"
                  className="w-full bg-[#12151e] border border-[#222736] rounded-lg px-3 py-2 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@telemetria.ai"
                className="w-full bg-[#12151e] border border-[#222736] rounded-lg pl-9 pr-3 py-2 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#12151e] border border-[#222736] rounded-lg pl-9 pr-3 py-2 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            {loading ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin" /> Authenticating...
              </>
            ) : isRegister ? (
              "Create Account & Start Onboarding →"
            ) : (
              "Sign In to Dashboard →"
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-white/5">
          {isRegister ? (
            <span>
              Already have an account?{" "}
              <button
                onClick={() => setIsRegister(false)}
                className="text-cyan-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need a new team account?{" "}
              <button
                onClick={() => setIsRegister(true)}
                className="text-cyan-400 font-semibold hover:underline"
              >
                Register
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
