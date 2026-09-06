import React from "react";

export function TelemetriaIcon({ className = "h-7 w-7 text-cyan-400" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tlm-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06b6d4" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* Outer telemetry hexagon radar ring */}
      <polygon
        points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5"
        stroke="url(#tlm-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      {/* Inner neural constellation lines */}
      <line x1="16" y1="8" x2="10" y2="18" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
      <line x1="16" y1="8" x2="22" y2="18" stroke="#818cf8" strokeWidth="1.5" opacity="0.6" />
      <line x1="10" y1="18" x2="22" y2="18" stroke="#c084fc" strokeWidth="1.5" opacity="0.6" />
      <line x1="16" y1="14" x2="16" y2="24" stroke="#06b6d4" strokeWidth="1.5" opacity="0.7" />
      {/* Neural nodes */}
      <circle cx="16" cy="8" r="2.5" fill="#38bdf8" />
      <circle cx="10" cy="18" r="2.5" fill="#818cf8" />
      <circle cx="22" cy="18" r="2.5" fill="#c084fc" />
      <circle cx="16" cy="14" r="3.2" fill="#06b6d4" />
      <circle cx="16" cy="24" r="2" fill="#38bdf8" />
    </svg>
  );
}

export function BraintrustIcon({ className = "h-7 w-7 text-brand-blue" }: { className?: string }) {
  return <TelemetriaIcon className={className} />;
}

export function OpenAIIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.475 4.475 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4703 4.4703 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6669zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.6622zm-12.6413 4.135l2.645-1.5238 2.645 1.5238v3.0476l-2.645 1.5238-2.645-1.5238z" />
    </svg>
  );
}

export function AnthropicIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M14.24 3.25h3.04L24 20.75h-3.04l-1.63-4.14H11.5l-1.62 4.14H6.84L14.24 3.25zm1.9 10.97l-2.6-6.6-2.6 6.6h5.2zM4.16 20.75L0 9.87h3.08l2.63 7.02 2.62-7.02h3.08l-4.17 10.88h-3.08z" />
    </svg>
  );
}

export function CustomerLogos() {
  const logos = [
    { name: "Airtable", sub: null },
    { name: "Notion", sub: "Watch video ↗" },
    { name: "Lovable", sub: null },
    { name: "Instacart", sub: null },
    { name: "Stripe", sub: null },
    { name: "Vercel", sub: "Watch video ↗" },
    { name: "Dropbox", sub: "Watch video ↗" },
    { name: "Ramp", sub: null },
    { name: "Coursera", sub: "Read story ↗" },
    { name: "Replit", sub: "Watch video ↗" },
    { name: "Superhuman", sub: null },
    { name: "Granola", sub: null },
    { name: "Dia", sub: null },
    { name: "MongoDB", sub: null },
    { name: "Cloudflare", sub: "Watch video ↗" },
    { name: "Semgrep", sub: null },
  ];

  return (
    <div className="pt-8 pb-14 border-t border-slate-100">
      <p className="text-[11px] font-mono tracking-widest uppercase text-slate-500 mb-8 text-center sm:text-left font-medium">
        TRUSTED BY THE BEST AI TEAMS
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-6 gap-y-8 items-center">
        {logos.map((logo) => (
          <div key={logo.name} className="flex flex-col items-center sm:items-start group cursor-pointer">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-brand-blue transition-colors flex items-center gap-1.5 font-sans">
              {logo.name === "Vercel" && <span className="inline-block border-l-6 border-r-6 border-b-[10px] border-l-transparent border-r-transparent border-b-black w-0 h-0 mr-1" />}
              {logo.name === "Notion" && <span className="font-serif font-black text-xl mr-1">N</span>}
              {logo.name === "Stripe" && <span className="font-extrabold tracking-tighter">stripe</span>}
              {logo.name !== "Stripe" && logo.name}
            </span>
            {logo.sub && (
              <span className="text-[10px] text-slate-400 group-hover:text-brand-blue transition-colors mt-0.5 font-medium">
                {logo.sub}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WaveformMatrix() {
  // Generates the exact digital tick / star / dot waveform matrix from Braintrust hero
  const columns = 90;
  const dotsIndex = [12, 28, 42, 59, 73, 85];
  const starIndex = [22, 64, 88];

  return (
    <div className="w-full overflow-hidden py-10 select-none pointer-events-none opacity-90">
      <div className="flex items-end justify-between gap-[3px] h-28 max-w-7xl mx-auto px-4">
        {Array.from({ length: columns }).map((_, i) => {
          const height = 15 + Math.sin(i * 0.18) * 35 + (i % 5) * 10;
          const isDot = dotsIndex.includes(i);
          const isStar = starIndex.includes(i);

          return (
            <div key={i} className="flex flex-col items-center justify-end h-full w-[2px]">
              {isStar && (
                <span className="text-brand-blue text-[10px] mb-1 font-bold animate-pulse">✦</span>
              )}
              {isDot && (
                <div className="w-2 h-2 rounded-full bg-brand-blue mb-1 shadow-sm" />
              )}
              <div
                className="w-full bg-brand-blue rounded-full opacity-80 hover:opacity-100 transition-all duration-300"
                style={{ height: `${Math.max(10, Math.min(height, 80))}px` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
