import React, { useState } from 'react';
import { useBetting } from '../context/BettingContext';
import OddsButton from './OddsButton';
import MatchStatus from './MatchStatus';
import CountryBadge from './CountryBadge';
import MaterialIcon from './MaterialIcon';
import { ChevronDown, ChevronUp, BarChart2, Radio, Lock } from 'lucide-react';

/**
 * High-Density Sportsbook Match Card (SportyBet / 1xBet style)
 * Clean tabular layout, sharp 4px borders, aligned odds columns,
 * inline expandable markets, and live in-play statistics drawer.
 */
export default function MatchCard({ match }) {
  const { addToSlip, isSelected, selectedMarket, leagues } = useBetting();
  const [showAllMarkets, setShowAllMarkets] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const {
    id,
    leagueId,
    homeTeam,
    awayTeam,
    status = 'SCHEDULED',
    minute,
    score = { home: 0, away: 0 },
    odds = {},
    oddsSuspended,
    suspended,
    events,
    stats,
  } = match;

  // Resolve team names & short codes
  const homeTeamName = typeof homeTeam === 'object' && homeTeam !== null
    ? (homeTeam.name || homeTeam.shortName || 'Home')
    : (homeTeam || 'Home');

  const awayTeamName = typeof awayTeam === 'object' && awayTeam !== null
    ? (awayTeam.name || awayTeam.shortName || 'Away')
    : (awayTeam || 'Away');

  const homeShort = typeof homeTeam === 'object' && homeTeam?.shortName
    ? homeTeam.shortName
    : homeTeamName.slice(0, 3).toUpperCase();

  const awayShort = typeof awayTeam === 'object' && awayTeam?.shortName
    ? awayTeam.shortName
    : awayTeamName.slice(0, 3).toUpperCase();

  // League metadata
  const matchedLeague = (leagues || []).find((l) => l.id === leagueId);
  const leagueTitle = matchedLeague?.name || match.leagueName || leagueId || 'Football';
  const country = matchedLeague?.country || match.country || '';
  const countryCode = matchedLeague?.countryCode || match.countryCode || '';

  // Normalize odds
  const homeOdds = odds.homeWin ?? odds.home;
  const drawOdds = odds.draw;
  const awayOdds = odds.awayWin ?? odds.away;
  const overOdds = odds.over25 ?? odds.over;
  const underOdds = odds.under25 ?? odds.under;
  const bttsYesOdds = odds.bttsYes ?? odds.yes;
  const bttsNoOdds = odds.bttsNo ?? odds.no;

  const isSuspended = Boolean(oddsSuspended || suspended);
  const isLive = status === 'LIVE' || status === 'IN_PLAY';
  const isFT = status === 'FT' || status === 'FINISHED';

  // Format last event safely with materialistic icon
  let lastEventNode = null;
  if (typeof match.lastEvent === 'string') {
    lastEventNode = (
      <span className="flex items-center gap-1">
        <MaterialIcon name="sports_soccer" size={13} className="text-[#00E676]" />
        <span>{match.lastEvent}</span>
      </span>
    );
  } else if (Array.isArray(events) && events.length > 0) {
    const last = events[events.length - 1];
    if (last) {
      lastEventNode = (
        <span className="flex items-center gap-1.5">
          {last.type === 'goal' ? (
            <MaterialIcon name="sports_soccer" size={13} className="text-[#00E676]" />
          ) : last.type === 'card' ? (
            <span className="inline-block w-2.5 h-3 bg-yellow-400 rounded-[1px] border border-yellow-500" />
          ) : (
            <MaterialIcon name="schedule" size={12} className="text-slate-400" />
          )}
          <span>{last.minute}' {last.player || last.teamName || last.type || ''}</span>
        </span>
      );
    }
  }

  // Odds click helper
  const select = (market, selectionKey, label, oddVal) => {
    if (isSuspended || !oddVal) return;
    addToSlip({
      matchId: id,
      matchName: `${homeTeamName} vs ${awayTeamName}`,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      market,
      selectionKey,
      label,
      odds: oddVal,
    });
  };

  const hasExtraMarkets = (overOdds != null || underOdds != null || bttsYesOdds != null || bttsNoOdds != null);
  const hasStats = Boolean(stats && (stats.possession || stats.shotsOnTarget || stats.corners));

  // Resolved statistics
  const possessionHome = stats?.possession?.home ?? 50;
  const possessionAway = stats?.possession?.away ?? 50;
  const shotsHome = stats?.shotsOnTarget?.home ?? 0;
  const shotsAway = stats?.shotsOnTarget?.away ?? 0;
  const cornersHome = stats?.corners?.home ?? 0;
  const cornersAway = stats?.corners?.away ?? 0;
  const cardsHome = stats?.yellowCards?.home ?? 0;
  const cardsAway = stats?.yellowCards?.away ?? 0;

  return (
    <div className="bg-[#1E222A] hover:bg-[#232832] transition-colors duration-150 overflow-hidden">
      {/* ── League Header Bar (Max 8px vertical padding) ── */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#161920] border-b border-[#2A2E35] text-[11px]">
        <div className="flex items-center gap-1.5 truncate">
          <CountryBadge country={country} countryCode={countryCode} size={12} />
          <span className="text-[11px] font-normal text-[#94A3B8] truncate tracking-wide uppercase">
            {leagueTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            <span className="text-[11px] font-normal text-[#00875A] flex items-center gap-1 hidden sm:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00875A]" />
              Live
            </span>
          )}
          {isSuspended && (
            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-[#FFC107] bg-[#1E222A] px-1.5 py-0.2 rounded-[2px] border border-[#2A2E35] uppercase">
              <Lock className="w-2.5 h-2.5" />
              Suspended
            </span>
          )}
          <MatchStatus status={status} minute={minute} />
        </div>
      </div>

      {/* ── Main Fixture Row (Max 8px vertical padding) ── */}
      <div className="px-3 py-2 space-y-2">
        {/* Teams, Scores, and Primary Odds Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          {/* Left: Team Names (14px bold) and Scores (tabular-nums) */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Home Team */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[14px] text-[#F8F9FA] truncate" title={homeTeamName}>
                {homeTeamName}
              </span>
              {(isLive || isFT) && (
                <span className="tabular-nums text-[14px] font-bold text-[#FFC107] shrink-0">
                  {score.home ?? 0}
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-[14px] text-[#F8F9FA] truncate" title={awayTeamName}>
                {awayTeamName}
              </span>
              {(isLive || isFT) && (
                <span className="tabular-nums text-[14px] font-bold text-[#FFC107] shrink-0">
                  {score.away ?? 0}
                </span>
              )}
            </div>
          </div>

          {/* Right: Primary Market Odds Cells + Action Buttons */}
          <div className="flex items-center gap-1.5 md:w-[58%] shrink-0">
            <div className="flex-1">
              {selectedMarket === 'ALL' || selectedMarket === '1X2' ? (
                <div className="grid grid-cols-3 gap-1">
                  <OddsButton
                    label={`1`}
                    odds={homeOdds}
                    selected={isSelected(id, '1X2', '1')}
                    suspended={isSuspended || !homeOdds}
                    onChange={() => select('1X2', '1', `1 (${homeShort})`, homeOdds)}
                  />
                  <OddsButton
                    label="X"
                    odds={drawOdds}
                    selected={isSelected(id, '1X2', 'X')}
                    suspended={isSuspended || !drawOdds}
                    onChange={() => select('1X2', 'X', 'X (Draw)', drawOdds)}
                  />
                  <OddsButton
                    label={`2`}
                    odds={awayOdds}
                    selected={isSelected(id, '1X2', '2')}
                    suspended={isSuspended || !awayOdds}
                    onChange={() => select('1X2', '2', `2 (${awayShort})`, awayOdds)}
                  />
                </div>
              ) : selectedMarket === 'OU' ? (
                <div className="grid grid-cols-2 gap-1">
                  <OddsButton
                    label="Over 2.5"
                    odds={overOdds}
                    selected={isSelected(id, 'OU', 'over')}
                    suspended={isSuspended || !overOdds}
                    onChange={() => select('OU', 'over', 'Over 2.5', overOdds)}
                  />
                  <OddsButton
                    label="Under 2.5"
                    odds={underOdds}
                    selected={isSelected(id, 'OU', 'under')}
                    suspended={isSuspended || !underOdds}
                    onChange={() => select('OU', 'under', 'Under 2.5', underOdds)}
                  />
                </div>
              ) : selectedMarket === 'BTTS' ? (
                <div className="grid grid-cols-2 gap-1">
                  <OddsButton
                    label="Yes (GG)"
                    odds={bttsYesOdds}
                    selected={isSelected(id, 'BTTS', 'yes')}
                    suspended={isSuspended || !bttsYesOdds}
                    onChange={() => select('BTTS', 'yes', 'Yes (GG)', bttsYesOdds)}
                  />
                  <OddsButton
                    label="No (NG)"
                    odds={bttsNoOdds}
                    selected={isSelected(id, 'BTTS', 'no')}
                    suspended={isSuspended || !bttsNoOdds}
                    onChange={() => select('BTTS', 'no', 'No (NG)', bttsNoOdds)}
                  />
                </div>
              ) : null}
            </div>

            {/* Action buttons (Stats + More Markets) */}
            <div className="flex items-center gap-1 shrink-0">
              {hasStats && (
                <button
                  type="button"
                  onClick={() => setShowStats(!showStats)}
                  className={[
                    'h-[36px] px-2 flex items-center justify-center gap-1 rounded-[2px] border text-[11px] font-normal transition-colors',
                    showStats
                      ? 'bg-[#FFC107] text-[#111418] border-[#FFC107] font-bold'
                      : 'bg-[#232832] hover:bg-[#2B313D] text-[#94A3B8] border-[#2A2E35]',
                  ].join(' ')}
                  title="Toggle live match statistics"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                </button>
              )}

              {hasExtraMarkets && (
                <button
                  type="button"
                  onClick={() => setShowAllMarkets(!showAllMarkets)}
                  className={[
                    'h-[36px] px-2 flex items-center justify-center gap-0.5 rounded-[2px] border text-[11px] tabular-nums transition-colors',
                    showAllMarkets
                      ? 'bg-[#FFC107] text-[#111418] border-[#FFC107] font-bold'
                      : 'bg-[#232832] hover:bg-[#2B313D] text-[#94A3B8] border-[#2A2E35]',
                  ].join(' ')}
                  title="Toggle all markets"
                >
                  <span>+2</span>
                  {showAllMarkets ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live event notification banner */}
        {lastEventNode && (
          <div className="text-[11px] font-normal text-[#94A3B8] bg-[#161920] border border-[#2A2E35] px-2 py-0.5 rounded-[2px] truncate">
            {lastEventNode}
          </div>
        )}

        {/* ── Live Match Statistics Presentation ── */}
        {showStats && hasStats && (
          <div className="p-2 rounded-[2px] bg-[#161920] border border-[#2A2E35] space-y-1.5 text-[11px] tabular-nums">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] uppercase">
              <span>{homeShort} ({possessionHome}%)</span>
              <span>Ball Possession</span>
              <span>{awayShort} ({possessionAway}%)</span>
            </div>
            {/* Possession Bar */}
            <div className="w-full h-1.5 bg-[#232832] rounded-[1px] overflow-hidden flex">
              <div
                className="bg-[#00875A] h-full transition-all duration-300"
                style={{ width: `${possessionHome}%` }}
              />
              <div
                className="bg-[#FFC107] h-full transition-all duration-300"
                style={{ width: `${possessionAway}%` }}
              />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#2A2E35] text-center text-[11px]">
              <div>
                <span className="text-[11px] text-[#94A3B8] block">Shots on Target</span>
                <span className="text-[#F8F9FA] font-bold">{shotsHome} : {shotsAway}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#94A3B8] block">Corners</span>
                <span className="text-[#F8F9FA] font-bold">{cornersHome} : {cornersAway}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#94A3B8] block">Yellow Cards</span>
                <span className="text-[#F8F9FA] font-bold">{cardsHome} : {cardsAway}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Expandable Side Markets Accordion (When +Markets is clicked) ── */}
        {showAllMarkets && hasExtraMarkets && (
          <div className="pt-2 border-t border-[#2A2E35] grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Over / Under 2.5 */}
            {(overOdds != null || underOdds != null) && selectedMarket !== 'OU' && (
              <div>
                <span className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] mb-1 block">
                  Goals (Over/Under 2.5)
                </span>
                <div className="grid grid-cols-2 gap-1">
                  <OddsButton
                    label="Over 2.5"
                    odds={overOdds}
                    selected={isSelected(id, 'OU', 'over')}
                    suspended={isSuspended || !overOdds}
                    onChange={() => select('OU', 'over', 'Over 2.5', overOdds)}
                  />
                  <OddsButton
                    label="Under 2.5"
                    odds={underOdds}
                    selected={isSelected(id, 'OU', 'under')}
                    suspended={isSuspended || !underOdds}
                    onChange={() => select('OU', 'under', 'Under 2.5', underOdds)}
                  />
                </div>
              </div>
            )}

            {/* Both Teams To Score */}
            {(bttsYesOdds != null || bttsNoOdds != null) && selectedMarket !== 'BTTS' && (
              <div>
                <span className="text-[11px] font-normal uppercase tracking-wider text-[#94A3B8] mb-1 block">
                  Both Teams to Score (GG/NG)
                </span>
                <div className="grid grid-cols-2 gap-1">
                  <OddsButton
                    label="Yes (GG)"
                    odds={bttsYesOdds}
                    selected={isSelected(id, 'BTTS', 'yes')}
                    suspended={isSuspended || !bttsYesOdds}
                    onChange={() => select('BTTS', 'yes', 'Yes (GG)', bttsYesOdds)}
                  />
                  <OddsButton
                    label="No (NG)"
                    odds={bttsNoOdds}
                    selected={isSelected(id, 'BTTS', 'no')}
                    suspended={isSuspended || !bttsNoOdds}
                    onChange={() => select('BTTS', 'no', 'No (NG)', bttsNoOdds)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
