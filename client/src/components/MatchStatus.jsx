import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

/**
 * High-Density Sportsbook Match Status Badge.
 * Compact, rectangular, and optimized for tabular scanability.
 */
export default function MatchStatus({ status, minute }) {
  const normalized = (status || '').toUpperCase();

  if (normalized === 'LIVE' || normalized === 'IN_PLAY') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[11px] font-mono font-extrabold bg-red-500/20 text-red-500 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
        <span>{minute != null ? `${minute}'` : 'LIVE'}</span>
      </span>
    );
  }

  if (normalized === 'HT') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
        HT
      </span>
    );
  }

  if (normalized === 'FT' || normalized === 'FINISHED') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
        FT
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono text-slate-400 border border-[#1F2B3E] bg-[#141C2E]">
      <Clock className="w-2.5 h-2.5 text-slate-500" aria-hidden="true" />
      <span>{status || 'Upcoming'}</span>
    </span>
  );
}
