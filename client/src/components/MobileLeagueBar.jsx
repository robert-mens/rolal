import React from 'react';
import { useBetting } from '../context/BettingContext';
import CountryBadge from './CountryBadge';
import MaterialIcon from './MaterialIcon';

/**
 * High-Density Sportsbook Horizontal League Bar (SportyBet / 1xBet style)
 * Fast horizontal chips with sharp 3px radiuses and active green accents.
 * 100% emoji-free: uses CDN Flag provider & Google Material Icons.
 */
export default function MobileLeagueBar() {
  const { leagues, selectedLeague, setSelectedLeague, matches } = useBetting();

  const getMatchCount = (leagueId) => {
    const active = matches.filter(
      (m) => m.status === 'LIVE' || m.status === 'IN_PLAY' || m.status === 'SCHEDULED' || m.status === 'UPCOMING'
    );
    if (leagueId === 'ALL') return active.length;
    return active.filter((m) => m.leagueId === leagueId || m.league === leagueId).length;
  };

  return (
    <div className="md:hidden py-1 -mx-3 px-3 overflow-x-auto no-scrollbar flex items-center gap-1.5">
      {/* All */}
      <button
        type="button"
        onClick={() => setSelectedLeague('ALL')}
        className={[
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] text-xs font-bold whitespace-nowrap transition-colors border shrink-0 select-none',
          selectedLeague === 'ALL'
            ? 'bg-[#1E2B42] text-[#00E676] border-[#00E676]'
            : 'bg-[#121824] text-slate-300 border-[#1F2B3E] hover:bg-[#182235]',
        ].join(' ')}
      >
        <MaterialIcon name="public" size={14} className="text-[#00E676]" />
        <span>All</span>
        <span className="text-[10px] font-mono text-slate-400">({getMatchCount('ALL')})</span>
      </button>

      {/* Individual Leagues */}
      {leagues
        .filter((l) => l.id !== 'ALL')
        .map((league) => {
          const isSelected = selectedLeague === league.id;
          const count = getMatchCount(league.id);

          return (
            <button
              key={league.id}
              type="button"
              onClick={() => setSelectedLeague(league.id)}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] text-xs font-semibold whitespace-nowrap transition-colors border shrink-0 select-none',
                isSelected
                  ? 'bg-[#1E2B42] text-[#00E676] border-[#00E676] font-bold'
                  : 'bg-[#121824] text-slate-300 border-[#1F2B3E] hover:bg-[#182235]',
              ].join(' ')}
            >
              <CountryBadge country={league.country} countryCode={league.countryCode} size={11} />
              <span>{league.name}</span>
              {count > 0 && (
                <span className="text-[10px] font-mono text-slate-400">({count})</span>
              )}
            </button>
          );
        })}
    </div>
  );
}
