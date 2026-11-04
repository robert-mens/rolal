import React from 'react';
import { useBetting } from '../context/BettingContext';
import CountryBadge from './CountryBadge';

/**
 * High-Density Sportsbook Live In-Play Strip (SportyBet / 1xBet style)
 * Fast-scrolling, sharp, compact match tiles with 1-click live odds.
 * 100% emoji-free: uses CDN Flag provider & Google Material Icons.
 */
export default function LiveTicker() {
  const { matches, addToSlip, isSelected, leagues } = useBetting();

  const liveMatches = matches.filter(
    (m) => m.status === 'LIVE' || m.status === 'IN_PLAY'
  );

  if (liveMatches.length === 0) return null;

  const select = (match, key, label, odd) => {
    if (!odd || match.oddsSuspended) return;
    const hName = typeof match.homeTeam === 'object' ? match.homeTeam?.name : match.homeTeam;
    const aName = typeof match.awayTeam === 'object' ? match.awayTeam?.name : match.awayTeam;
    addToSlip({
      matchId: match.id,
      matchName: `${hName} vs ${aName}`,
      homeTeam: hName,
      awayTeam: aName,
      market: '1X2',
      selectionKey: key,
      label,
      odds: odd,
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00875A]" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#F8F9FA]">
            Live In-Play Matches
          </h2>
          <span className="px-1.5 py-0.2 rounded-[2px] text-[11px] tabular-nums font-bold bg-[#00875A] text-white">
            {liveMatches.length} Live
          </span>
        </div>
      </div>

      {/* Horizontal scrolling strip of sharp sports tiles */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-3 px-3 sm:mx-0 sm:px-0">
        {liveMatches.map((match) => {
          const hName = typeof match.homeTeam === 'object' ? (match.homeTeam?.shortName || match.homeTeam?.name) : match.homeTeam;
          const aName = typeof match.awayTeam === 'object' ? (match.awayTeam?.shortName || match.awayTeam?.name) : match.awayTeam;
          const leagueObj = leagues.find((l) => l.id === match.leagueId);
          const country = leagueObj?.country || match.country || '';
          const countryCode = leagueObj?.countryCode || match.countryCode || '';
          const homeOdd = match.odds?.homeWin ?? match.odds?.home;
          const drawOdd = match.odds?.draw;
          const awayOdd = match.odds?.awayWin ?? match.odds?.away;

          return (
            <div
              key={match.id}
              className="bg-[#1E222A] hover:bg-[#232832] border border-[#2A2E35] rounded-[2px] p-2 shrink-0 w-[230px] sm:w-[250px] flex flex-col justify-between space-y-1.5 transition-colors"
            >
              {/* Header: League & Minute */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#94A3B8] font-normal truncate flex items-center gap-1.5">
                  <CountryBadge country={country} countryCode={countryCode} size={11} />
                  <span className="truncate max-w-[120px] uppercase">{leagueObj?.name || 'Football'}</span>
                </span>
                <span className="font-bold text-[#FFC107] flex items-center gap-1 tabular-nums text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00875A]" />
                  {match.minute}'
                </span>
              </div>

              {/* Teams & Score */}
              <div className="flex items-center justify-between py-0.5">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-[14px] font-bold text-[#F8F9FA] truncate">{hName}</p>
                  <p className="text-[14px] font-bold text-[#F8F9FA] truncate">{aName}</p>
                </div>
                <div className="bg-[#161920] border border-[#2A2E35] px-1.5 py-0.5 rounded-[2px] text-center font-bold text-[14px] text-[#FFC107] tabular-nums">
                  {match.score?.home ?? 0} : {match.score?.away ?? 0}
                </div>
              </div>

              {/* Mini quick-odds buttons */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  disabled={match.oddsSuspended || !homeOdd}
                  onClick={() => select(match, '1', '1', homeOdd)}
                  className={[
                    'h-[34px] px-1 rounded-[2px] text-center border text-[14px] tabular-nums font-medium transition-colors flex flex-col items-center justify-center',
                    isSelected(match.id, '1X2', '1')
                      ? 'bg-[#FFC107] text-[#111418] border-[#FFC107] font-bold'
                      : 'bg-[#232832] hover:bg-[#2B313D] text-[#F8F9FA] border-[#2A2E35]',
                  ].join(' ')}
                >
                  <span className="text-[11px] text-[#94A3B8] block font-normal leading-none">1</span>
                  <span className="leading-tight">{homeOdd ? Number(homeOdd).toFixed(2) : '-'}</span>
                </button>

                <button
                  type="button"
                  disabled={match.oddsSuspended || !drawOdd}
                  onClick={() => select(match, 'X', 'X', drawOdd)}
                  className={[
                    'h-[34px] px-1 rounded-[2px] text-center border text-[14px] tabular-nums font-medium transition-colors flex flex-col items-center justify-center',
                    isSelected(match.id, '1X2', 'X')
                      ? 'bg-[#FFC107] text-[#111418] border-[#FFC107] font-bold'
                      : 'bg-[#232832] hover:bg-[#2B313D] text-[#F8F9FA] border-[#2A2E35]',
                  ].join(' ')}
                >
                  <span className="text-[11px] text-[#94A3B8] block font-normal leading-none">X</span>
                  <span className="leading-tight">{drawOdd ? Number(drawOdd).toFixed(2) : '-'}</span>
                </button>

                <button
                  type="button"
                  disabled={match.oddsSuspended || !awayOdd}
                  onClick={() => select(match, '2', '2', awayOdd)}
                  className={[
                    'h-[34px] px-1 rounded-[2px] text-center border text-[14px] tabular-nums font-medium transition-colors flex flex-col items-center justify-center',
                    isSelected(match.id, '1X2', '2')
                      ? 'bg-[#FFC107] text-[#111418] border-[#FFC107] font-bold'
                      : 'bg-[#232832] hover:bg-[#2B313D] text-[#F8F9FA] border-[#2A2E35]',
                  ].join(' ')}
                >
                  <span className="text-[11px] text-[#94A3B8] block font-normal leading-none">2</span>
                  <span className="leading-tight">{awayOdd ? Number(awayOdd).toFixed(2) : '-'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
