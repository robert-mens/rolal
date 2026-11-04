import React from 'react';

/**
 * High-Density Sportsbook Skeleton Loading Placeholders.
 * Crisp rectangular placeholders with sharp 4px corners matching the live fixture grid.
 */
export default function LoadingState({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="bg-[#121824] border border-[#1F2B3E] rounded-[4px] p-3 space-y-3 animate-pulse motion-reduce:animate-none"
          aria-hidden="true"
        >
          {/* Header row */}
          <div className="flex items-center justify-between pb-2 border-b border-[#1A2332]">
            <div className="h-3 w-28 rounded-[2px] bg-[#182235]" />
            <div className="h-4 w-14 rounded-[2px] bg-[#182235]" />
          </div>

          {/* Teams row */}
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-32 rounded-[2px] bg-[#182235]" />
              <div className="h-3.5 w-6 rounded-[2px] bg-[#182235]" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-36 rounded-[2px] bg-[#182235]" />
              <div className="h-3.5 w-6 rounded-[2px] bg-[#182235]" />
            </div>
          </div>

          {/* Odds buttons skeleton */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#1A2332]">
            <div className="h-[38px] rounded-[3px] bg-[#182235]" />
            <div className="h-[38px] rounded-[3px] bg-[#182235]" />
            <div className="h-[38px] rounded-[3px] bg-[#182235]" />
          </div>
        </div>
      ))}
    </div>
  );
}
