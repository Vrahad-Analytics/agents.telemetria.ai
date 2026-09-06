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
