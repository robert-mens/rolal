import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

/**
 * Simple, modern, flat Materialistic UK Location Restriction screen.
 * No extra visual clutter or heavy decorations.
 */
export default function BlockedLocationPage({ countryName, countryCode, onRetry }) {
  return (
    <div className="min-h-screen w-full bg-[#111418] text-[#F8F9FA] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[2px] bg-[#161920] border border-[#2A2E35] flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold uppercase tracking-wider text-[#F8F9FA]">
              Access Restricted
            </h1>
            <p className="text-[11px] text-[#94A3B8]">
              United Kingdom (UK) Region Only
            </p>
          </div>
        </div>

        <p className="text-[13px] text-[#CBD5E1] leading-relaxed">
          RolalBet is only available to users located within the{' '}
          <strong className="text-[#F8F9FA]">United Kingdom</strong>. Access from your current
          location is restricted.
        </p>

        <div className="p-3 rounded-[2px] bg-[#161920] border border-[#2A2E35] flex items-center justify-between text-[12px]">
          <span className="text-[#94A3B8]">Detected Location</span>
          <span className="font-bold text-[#F8F9FA] tabular-nums">
            {countryName || 'Outside United Kingdom'}
            {countryCode && countryCode !== 'UNKNOWN' ? ` (${countryCode})` : ''}
          </span>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="w-full py-2.5 px-4 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] border border-[#2A2E35] text-[#F8F9FA] text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Check Location Again</span>
        </button>
      </div>
    </div>
  );
}
