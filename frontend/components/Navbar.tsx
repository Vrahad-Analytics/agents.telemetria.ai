"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Layers, PlayCircle, BarChart3, Search, Sparkles } from "lucide-react";
import { BraintrustIcon } from "./BrandLogos";

export default function Navbar() {
  const pathname = usePathname();
  const [productOpen, setProductOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Do not render the top marketing navbar inside the logged-in web app (/app/*)
  if (pathname?.startsWith("/app")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BraintrustIcon className="h-6 w-6 text-brand-blue group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
              Braintrust
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-[15px] font-medium text-slate-700">
            {/* Product Dropdown */}
            <div className="relative" onMouseLeave={() => setProductOpen(false)}>
              <button
                onClick={() => setProductOpen(!productOpen)}
                onMouseEnter={() => setProductOpen(true)}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors py-2 focus:outline-none"
              >
                Product <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              {productOpen && (
                <div
                  onMouseEnter={() => setProductOpen(true)}
                  className="absolute left-0 top-full w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in-50 duration-150"
                >
                  <Link
                    href="/traces"
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-1.5 bg-blue-50 text-brand-blue rounded-md group-hover:bg-brand-blue group-hover:text-white transition-colors">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Observe</div>
                      <div className="text-xs text-slate-500">Trace everything & monitor latency</div>
                    </div>
                  </Link>

                  <Link
                    href="/evaluations"
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Evaluate</div>
                      <div className="text-xs text-slate-500">Test what ships over datasets</div>
                    </div>
                  </Link>

                  <Link
                    href="/playground"
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <PlayCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">AI Gateway</div>
                      <div className="text-xs text-slate-500">Reverse proxy with streaming</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div className="relative" onMouseLeave={() => setResourcesOpen(false)}>
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                onMouseEnter={() => setResourcesOpen(true)}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors py-2 focus:outline-none"
              >
                Resources <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              {resourcesOpen && (
                <div
                  onMouseEnter={() => setResourcesOpen(true)}
                  className="absolute left-0 top-full w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in-50 duration-150"
                >
                  <a
                    href="http://localhost:8000/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="block p-2 rounded-lg hover:bg-slate-50 text-sm font-semibold text-slate-900"
                  >
                    API Documentation ↗
                    <span className="block text-xs font-normal text-slate-500">Interactive Swagger & OpenAPI</span>
                  </a>
                  <Link href="/evaluations" className="block p-2 rounded-lg hover:bg-slate-50 text-sm font-semibold text-slate-900">
                    Eval Library
                    <span className="block text-xs font-normal text-slate-500">Pre-built LLM evaluation rubrics</span>
                  </Link>
                </div>
              )}
            </div>

            <Link href="/traces" className="hover:text-slate-900 transition-colors">
              Traces
            </Link>
            <Link href="/playground" className="hover:text-slate-900 transition-colors">
              Playground
            </Link>
            <Link href="/evaluations" className="hover:text-slate-900 transition-colors">
              Evaluations
            </Link>
          </nav>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/app/vrahad/p/My%20Project"
            className="hidden sm:inline-block text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/app/vrahad/p/My%20Project"
            className="inline-flex items-center justify-center rounded-full bg-brand-blue px-5 py-2 text-sm font-semibold text-white shadow-sm hover:rounded-none hover:bg-slate-950 transition-all duration-200"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
