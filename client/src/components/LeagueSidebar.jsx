import React, { useMemo } from 'react';
import { useBetting } from '../context/BettingContext';
import CountryBadge from './CountryBadge';
import MaterialIcon from './MaterialIcon';

/**
 * High-Density Sportsbook League Navigation (Bet365 / 1xBet style)
 * Crisp, compact, and scannable list with live count badges and sharp active states.
 * 100% emoji-free: uses CDN Flag provider & Google Material Icons.
 */
export default function LeagueSidebar() {
  const { leagues, selectedLeague, setSelectedLeague, matches, setCurrentView } = useBetting();

  // Group leagues by country
  const grouped = useMemo(() => {
    const map = {};
    leagues.forEach((league) => {
      const country = league.country || 'Other';
      if (!map[country]) {
        map[country] = {
          countryCode: league.countryCode || '',
          leagues: [],
        };
      }
      map[country].leagues.push(league);
    });
    return map;
  }, [leagues]);

  // Active (Live + Upcoming) match count per league
  const matchCount = (leagueId) => {
    const active = matches.filter(
      (m) => m.status === 'LIVE' || m.status === 'IN_PLAY' || m.status === 'SCHEDULED' || m.status === 'UPCOMING'
    );
    if (leagueId === 'ALL') return active.length;
    return active.filter((m) => m.leagueId === leagueId || m.league === leagueId).length;
  };

  const liveCount = (leagueId) => {
    const live = matches.filter(
      (m) => (m.status === 'LIVE' || m.status === 'IN_PLAY') && (leagueId === 'ALL' || m.leagueId === leagueId)
    );
    return live.length;
  };

  const selectLeagueAndShowBoard = (id) => {
    setSelectedLeague(id);
    if (setCurrentView) setCurrentView('home');
  };

  return (
    <nav className="p-2 space-y-2 text-xs" aria-label="League Navigation">
      {/* Top Heading */}
      <div className="px-2 py-1 flex items-center justify-between border-b border-[#2A2E35]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
          Covered Leagues
        </span>
        <span className="text-[11px] tabular-nums text-[#94A3B8]">
          {leagues.length - 1} Leagues
        </span>
      </div>

      {/* All Matches Row */}
      <button
        type="button"
        onClick={() => selectLeagueAndShowBoard('ALL')}
        className={[
          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-[2px] text-left transition-colors select-none',
          selectedLeague === 'ALL'
            ? 'bg-[#FFC107] text-[#111418] font-bold border border-[#FFC107]'
            : 'bg-[#232832] hover:bg-[#2B313D] text-[#F8F9FA] border border-[#2A2E35]',
        ].join(' ')}
      >
        <span className="flex items-center gap-2 text-[14px] font-bold">
          <MaterialIcon name="public" size={14} className={selectedLeague === 'ALL' ? 'text-[#111418]' : 'text-[#FFC107]'} />
          <span>All Matches</span>
        </span>
        <span className="flex items-center gap-1 tabular-nums text-[11px]">
          {liveCount('ALL') > 0 && (
            <span className="px-1.5 py-0.2 rounded-[2px] bg-[#00875A] text-white font-bold text-[11px]">
              {liveCount('ALL')} Live
            </span>
          )}
          <span className={selectedLeague === 'ALL' ? 'text-[#111418] font-bold' : 'text-[#94A3B8]'}>
            {matchCount('ALL')}
          </span>
        </span>
      </button>

      {/* Country Groups */}
      <div className="space-y-2">
        {Object.entries(grouped).map(([country, { countryCode, leagues: countryLeagues }]) => {
          if (country === 'Global') return null;

          return (
            <div key={country} className="space-y-0.5">
              {/* Country heading with CDN flag */}
              <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-normal text-[#94A3B8] uppercase tracking-wider">
                <CountryBadge country={country} countryCode={countryCode} size={11} />
                <span>{country}</span>
              </div>

              {/* League items */}
              <div className="space-y-0.5">
                {countryLeagues.map((league) => {
                  const isActive = selectedLeague === league.id;
                  const total = matchCount(league.id);
                  const live = liveCount(league.id);

                  return (
                    <button
                      key={league.id}
                      type="button"
                      onClick={() => selectLeagueAndShowBoard(league.id)}
                      className={[
                        'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[2px] text-left transition-colors select-none',
                        isActive
                          ? 'bg-[#FFC107] text-[#111418] font-bold'
                          : 'text-[#F8F9FA] hover:bg-[#232832]',
                      ].join(' ')}
                    >
                      <span className="truncate text-[14px] font-bold">{league.name}</span>
                      <span className="flex items-center gap-1 tabular-nums text-[11px] shrink-0">
                        {live > 0 && (
                          <span className="px-1 py-0.2 rounded-[2px] bg-[#00875A] text-white font-bold">
                            {live}
                          </span>
                        )}
                        <span className={isActive ? 'text-[#111418]' : 'text-[#94A3B8]'}>
                          {total}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
