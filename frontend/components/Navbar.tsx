"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Layers, PlayCircle, BarChart3, Search, Sparkles, User, ShieldCheck } from "lucide-react";
import { TelemetriaIcon } from "./BrandLogos";
import AuthModal from "./AuthModal";
import ProjectOnboardingModal from "./ProjectOnboardingModal";

export default function Navbar() {
  const pathname = usePathname();
  const [productOpen, setProductOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Auth & Onboarding state
  const [authOpen, setAuthOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tlm_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  // Do not render the top marketing navbar inside the logged-in web app (/app/*)
  if (pathname?.startsWith("/app")) {
    return null;
  }

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    setOnboardingOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#07080c]/90 backdrop-blur-md border-b border-[#181c28]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <TelemetriaIcon className="h-7 w-7 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-white font-sans">
                    agents.telemetria.ai
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 -mt-0.5">
                  Active Observability & Evaluation OS
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
              {/* Product Dropdown */}
              <div className="relative" onMouseLeave={() => setProductOpen(false)}>
                <button
                  onClick={() => setProductOpen(!productOpen)}
                  onMouseEnter={() => setProductOpen(true)}
                  className="flex items-center gap-1 hover:text-white transition-colors py-2 focus:outline-none"
                >
                  Platform <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>

                {productOpen && (
                  <div
                    onMouseEnter={() => setProductOpen(true)}
                    className="absolute left-0 top-full w-72 bg-[#0d1017] rounded-xl shadow-2xl border border-[#232838] p-2 z-50 animate-in fade-in-50 duration-150 text-slate-100"
                  >
                    <Link
                      href="/traces"
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Active Tracing</div>
                        <div className="text-xs text-slate-400">Stream telemetry & monitor P95 latency</div>
                      </div>
                    </Link>

                    <Link
                      href="/evaluations"
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-md">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Evals & Benchmarks</div>
                        <div className="text-xs text-slate-400">LLM-as-a-judge ground truth scoring</div>
                      </div>
                    </Link>

                    <Link
                      href="/playground"
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md">
                        <PlayCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">AI Gateway Proxy</div>
                        <div className="text-xs text-slate-400">OpenAI & Anthropic failover routing</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/traces" className="hover:text-white transition-colors">
                Live Traces
              </Link>
              <Link href="/evaluations" className="hover:text-white transition-colors">
                Evals Suite
              </Link>
              <Link href="/playground" className="hover:text-white transition-colors">
                Gateway Playground
              </Link>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                API Docs ↗
              </a>
            </nav>
          </div>

          {/* Right CTA Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/app/vrahad/p/My%20Project"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141824] border border-cyan-500/30 text-xs font-mono text-cyan-300 hover:bg-[#1a2030] transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{user.org_name} (Pro Paid)</span>
                </Link>
                <button
                  onClick={() => setOnboardingOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
                >
                  + New Project
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:opacity-90 transition-all"
                >
                  Sign Up (Pro Access)
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Project Onboarding Modal */}
      <ProjectOnboardingModal
        isOpen={onboardingOpen}
        user={user}
        onProjectCreated={() => setOnboardingOpen(false)}
      />
    </>
  );
}
