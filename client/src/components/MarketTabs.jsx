import React from 'react';
import { useBetting } from '../context/BettingContext';

const MARKETS = [
  { id: 'ALL', label: 'All Markets' },
  { id: '1X2', label: '1X2 Winner' },
  { id: 'OU', label: 'Over / Under 2.5' },
  { id: 'BTTS', label: 'Both Teams To Score' },
];

/**
 * High-Density Market Selector Strip (SportyBet / 1xBet style)
 * Crisp rectangular tabs with live match counter and high-contrast active state.
 */
export default function MarketTabs({ liveOnly, setLiveOnly }) {
  const { selectedMarket, setSelectedMarket, matches } = useBetting();

  const liveCount = matches.filter(
    (m) => m.status === 'LIVE' || m.status === 'IN_PLAY'
  ).length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-1">
      {/* Rectangular Market Category Tabs */}
      <div className="flex items-center gap-1 bg-[#1E222A] p-1 rounded-[2px] border border-[#2A2E35] overflow-x-auto no-scrollbar">
        {MARKETS.map((m) => {
          const isActive = selectedMarket === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMarket(m.id)}
              aria-pressed={isActive}
              className={[
                'px-3 py-1 rounded-[2px] text-[12px] font-bold whitespace-nowrap transition-colors select-none',
                isActive
                  ? 'bg-[#FFC107] text-[#111418]'
                  : 'text-[#94A3B8] hover:text-[#F8F9FA] hover:bg-[#232832]',
              ].join(' ')}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Live In-Play Filter Button */}
      <button
        type="button"
        onClick={() => setLiveOnly((prev) => !prev)}
        aria-pressed={liveOnly}
        className={[
          'flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-[11px] font-bold transition-colors border select-none',
          liveOnly
            ? 'bg-[#00875A] text-white border-[#00875A]'
            : 'bg-[#1E222A] hover:bg-[#232832] text-[#94A3B8] hover:text-[#F8F9FA] border-[#2A2E35]',
        ].join(' ')}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={[
              'relative inline-flex h-2 w-2 rounded-full',
              liveOnly ? 'bg-white' : 'bg-[#00875A]',
            ].join(' ')}
          />
        </span>
        <span className="uppercase tracking-wider font-bold text-[11px]">Live Now</span>
        {liveCount > 0 && (
          <span
            className={[
              'px-1.5 py-0.2 rounded-[2px] text-[11px] tabular-nums font-bold',
              liveOnly ? 'bg-[#111418] text-[#FFC107]' : 'bg-[#232832] text-[#F8F9FA]',
            ].join(' ')}
          >
            {liveCount}
          </span>
        )}
      </button>
    </div>
  );
}
