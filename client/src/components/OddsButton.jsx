import React, { useState, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

/**
 * High-Density Sportsbook Odds Cell (1xBet / SportyBet / Bet365 style)
 * Features 2-line compact layout, tabular-nums, dynamic green/red drift flashes, and sharp 3px radiuses.
 */
export default function OddsButton({
  label,
  odds,
  selected = false,
  suspended = false,
  onChange,
  className = '',
}) {
  const [drift, setDrift] = useState(null); // 'up' | 'down' | null
  const prevOddsRef = useRef(odds);

  useEffect(() => {
    if (prevOddsRef.current !== undefined && odds !== undefined && odds !== prevOddsRef.current) {
      const numOld = Number(prevOddsRef.current);
      const numNew = Number(odds);
      if (!isNaN(numOld) && !isNaN(numNew) && numOld > 0 && numNew > 0) {
        if (numNew > numOld) {
          setDrift('up');
        } else if (numNew < numOld) {
          setDrift('down');
        }
        const timer = setTimeout(() => setDrift(null), 1000);
        prevOddsRef.current = odds;
        return () => clearTimeout(timer);
      }
    }
    prevOddsRef.current = odds;
  }, [odds]);

  const formattedOdds = typeof odds === 'number' ? odds.toFixed(2) : (odds || '-');

  return (
    <button
      type="button"
      role="button"
      aria-pressed={selected}
      aria-disabled={suspended || !odds}
      disabled={suspended || !odds}
      onClick={() => {
        if (!suspended && odds && onChange) onChange();
      }}
      className={[
        'relative h-[36px] w-full px-1.5 py-0.5 flex flex-col items-center justify-center',
        'rounded-[2px] border transition-colors duration-100 select-none overflow-hidden font-sans',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FFC107]',
        suspended || !odds
          ? 'bg-[#161920] border-[#2A2E35] text-[#64748B] opacity-50 cursor-not-allowed'
          : selected
            ? 'bg-[#FFC107] border-[#FFC107] text-[#111418] font-bold'
            : 'bg-[#232832] hover:bg-[#2B313D] border-[#2A2E35] text-[#F8F9FA]',
        drift === 'up' && !selected ? '!border-[#00875A]' : '',
        drift === 'down' && !selected ? '!border-[#EF4444]' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Upward Drift Triangle Indicator (Green) */}
      {drift === 'up' && !selected && (
        <span
          className="absolute top-0 right-0 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-[#00875A]"
          title="Odds drifting up"
        />
      )}

      {/* Downward Drift Triangle Indicator (Red) */}
      {drift === 'down' && !selected && (
        <span
          className="absolute bottom-0 right-0 w-0 h-0 border-l-[6px] border-l-transparent border-b-[6px] border-b-[#EF4444]"
          title="Odds dropping"
        />
      )}

      {/* Outcome Label (1, X, 2, Over 2.5, etc.) */}
      {label && (
        <span
          className={[
            'text-[11px] font-normal leading-none truncate max-w-full',
            selected ? 'text-[#111418]' : 'text-[#94A3B8]',
          ].join(' ')}
        >
          {label}
        </span>
      )}

      {/* Numerical Odds / Lock Icon */}
      {suspended || !odds ? (
        <Lock className="w-3.5 h-3.5 text-[#64748B] mt-0.5" aria-hidden="true" />
      ) : (
        <span
          className={[
            'tabular-nums text-[14px] font-medium leading-tight tracking-tight',
            selected ? 'text-[#111418] font-bold' : 'text-[#F8F9FA]',
          ].join(' ')}
        >
          {formattedOdds}
        </span>
      )}
    </button>
  );
}
