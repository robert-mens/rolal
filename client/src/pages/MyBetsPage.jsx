import React, { useState, useMemo } from 'react';
import { useBetting } from '../context/BettingContext';
import MaterialIcon from '../components/MaterialIcon';

/**
 * Helper: Resolve the human-readable pick label for a selection
 */
function getPickLabel(sel, hName, aName) {
  if (sel.label) return sel.label;
  const key = String(sel.selectionKey || '').trim().toUpperCase();
  const market = String(sel.market || '1X2').trim().toUpperCase();

  if (market === '1X2') {
    if (key === '1') return hName ? `Home (${hName})` : 'Home (1)';
    if (key === 'X' || key === 'DRAW') return 'Draw (X)';
    if (key === '2') return aName ? `Away (${aName})` : 'Away (2)';
  }
  if (market === 'OU' || market === 'OVER_UNDER' || market === 'TOTALS') {
    if (key.includes('OVER') || key === 'O2.5') return 'Over 2.5 Goals';
    if (key.includes('UNDER') || key === 'U2.5') return 'Under 2.5 Goals';
  }
  if (market === 'BTTS') {
    if (key === 'YES' || key === 'GG') return 'Both Teams to Score: Yes';
    if (key === 'NO' || key === 'NG') return 'Both Teams to Score: No';
  }
  return sel.selectionKey || 'Selection';
}

/**
 * Helper: Resolve the current live odd for the exact selection the user staked on
 */
function getCurrentSelectionOdd(sel, liveMatch) {
  const stakedOdd = Number(sel.odds) || 1.0;
  if (!liveMatch || !liveMatch.odds) return stakedOdd;

  const key = String(sel.selectionKey || '').trim().toUpperCase();
  const market = String(sel.market || '1X2').trim().toUpperCase();
  const odds = liveMatch.odds;

  if (key === '1') return Number(odds.homeWin ?? odds.home ?? stakedOdd);
  if (key === 'X' || key === 'DRAW') return Number(odds.draw ?? stakedOdd);
  if (key === '2') return Number(odds.awayWin ?? odds.away ?? stakedOdd);
  if (key.startsWith('OVER') || key === 'O2.5') return Number(odds.over25 ?? odds.over ?? stakedOdd);
  if (key.startsWith('UNDER') || key === 'U2.5') return Number(odds.under25 ?? odds.under ?? stakedOdd);
  if (key === 'YES' || key === 'GG' || key === 'BTTS_YES') return Number(odds.bttsYes ?? odds.yes ?? stakedOdd);
  if (key === 'NO' || key === 'NG' || key === 'BTTS_NO') return Number(odds.bttsNo ?? odds.no ?? stakedOdd);

  if (market === 'OU') {
    return key.includes('OVER')
      ? Number(odds.over25 ?? stakedOdd)
      : Number(odds.under25 ?? stakedOdd);
  }

  return stakedOdd;
}

/**
 * Helper: Determine whether a game selection gets a rounded green check or red times:
 * - For goals (Over 2.5 / BTTS Yes): can be ticked ('won') as soon as the goals are scored during live play.
 * - For all other markets (1X2, Under 2.5, BTTS No): ONLY gets ticked ('won') or times ('lost') at Full Time (FT) or once settled.
 */
function getLiveSelectionState(sel, liveMatch) {
  if (sel.status === 'WON') return { decided: true, outcome: 'won' };
  if (sel.status === 'LOST') return { decided: true, outcome: 'lost' };
  if (!liveMatch) return { decided: false, outcome: null };

  const status = String(liveMatch.status || '').toUpperCase();
  if (status === 'SCHEDULED' || status === 'UPCOMING') {
    return { decided: false, outcome: null };
  }

  const h = liveMatch.score?.home ?? 0;
  const a = liveMatch.score?.away ?? 0;
  const total = h + a;
  const key = String(sel.selectionKey || '').trim().toUpperCase();

  // At Full Time (FT): every market is decided and gets either a tick ('won') or times ('lost')
  if (status === 'FT' || status === 'FINISHED') {
    let won = false;
    if (key === '1') won = h > a;
    else if (key === 'X' || key === 'DRAW') won = h === a;
    else if (key === '2') won = a > h;
    else if (key.startsWith('OVER') || key === 'O2.5') won = total >= 3;
    else if (key.startsWith('UNDER') || key === 'U2.5') won = total < 3;
    else if (key === 'YES' || key === 'GG' || key === 'BTTS_YES') won = h > 0 && a > 0;
    else if (key === 'NO' || key === 'NG' || key === 'BTTS_NO') won = h === 0 || a === 0;

    return { decided: true, outcome: won ? 'won' : 'lost' };
  }

  // While LIVE (ongoing): ONLY goal selections (Over 2.5 / BTTS Yes) get ticked early once the goals are scored
  if ((key.startsWith('OVER') || key === 'O2.5') && total >= 3) {
    return { decided: true, outcome: 'won' };
  }
  if ((key === 'YES' || key === 'GG' || key === 'BTTS_YES') && h > 0 && a > 0) {
    return { decided: true, outcome: 'won' };
  }

  // Everything else waits until Full Time (FT) before showing tick or times
  return { decided: false, outcome: null };
}

/**
 * SportyBet-Style "My Bets" Page
 * - Open tab: Detailed ongoing bets with live score, staked odds vs current live odds, and Cashout bar.
 *   Goal markets tick immediately when met; other markets tick/times only at Full Time (FT).
 * - Settled tab: Summarized SportyBet cards for each settled bet; clicking any card opens a dedicated
 *   Ticket Result page showing the full breakdown of every game in that bet.
 */
export default function MyBetsPage({ onBack }) {
  const {
    activeBets,
    settledBets,
    matches,
    evaluateBetCashout,
    cashoutBet,
    setCurrentView,
  } = useBetting();

  const [activeTab, setActiveTab] = useState('open'); // 'open' | 'settled' | 'all'
  const [selectedSettledBet, setSelectedSettledBet] = useState(null);
  const [confirmingCashoutId, setConfirmingCashoutId] = useState(null);
  const [cashingOutId, setCashingOutId] = useState(null);

  const allBets = useMemo(() => {
    return [
      ...(activeBets || []).map((b) => ({ ...b, category: 'open' })),
      ...(settledBets || []).map((b) => ({ ...b, category: 'settled' })),
    ];
  }, [activeBets, settledBets]);

  const filteredBets = useMemo(() => {
    if (activeTab === 'open') return allBets.filter((b) => b.category === 'open');
    if (activeTab === 'settled') return allBets.filter((b) => b.category === 'settled');
    return allBets;
  }, [allBets, activeTab]);

  const handleConfirmCashout = async (betId) => {
    setCashingOutId(betId);
    try {
      const res = await cashoutBet(betId);
      if (res.success) {
        setConfirmingCashoutId(null);
      }
    } finally {
      setCashingOutId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // DEDICATED SETTLED BET RESULT / TICKET DETAILS PAGE VIEW
  // ---------------------------------------------------------------------------
  if (selectedSettledBet) {
    const bet = selectedSettledBet;
    const isWon = bet.status === 'WON' || bet.status === 'won';
    const isCashedOut = bet.status === 'CASHED_OUT';
    const isLost = bet.status === 'LOST' || bet.status === 'lost';
    const selections = bet.selections || [];
    const betTypeLabel =
      selections.length > 1 ? `Multiple (${selections.length})` : 'Single';
    const ticketId = String(bet.id || bet.ticketId || 'TKT-000000')
      .slice(-8)
      .toUpperCase();

    const dateStr = bet.placedAt
      ? new Date(bet.placedAt).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    const totalStakedOdds = Number(
      bet.totalOdds ||
        selections.reduce((acc, s) => acc * (Number(s.odds) || 1), 1)
    );

    const totalReturn = isCashedOut
      ? Number(bet.cashedOutAmount || bet.payout || 0)
      : isWon
        ? Number(bet.potentialReturn || bet.potentialPayout || bet.payout || 0)
        : 0;

    return (
      <div className="max-w-xl mx-auto py-2 space-y-3 font-sans">
        {/* Top Return Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSettledBet(null)}
              className="w-8 h-8 rounded-[4px] bg-[#1E222A] border border-[#2A2E35] flex items-center justify-center text-[#94A3B8] hover:text-[#F8F9FA] transition-colors cursor-pointer"
              title="Back to Settled Bets"
            >
              <MaterialIcon name="arrow_back" size={16} />
            </button>
            <div>
              <h1 className="text-[15px] font-bold text-[#F8F9FA]">Ticket Details</h1>
              <span className="text-[11px] text-[#94A3B8] tabular-nums">
                Ticket #{ticketId} • {dateStr}
              </span>
            </div>
          </div>

          <div>
            {isWon && (
              <span className="px-2.5 py-1 rounded-[2px] bg-[#00875A] text-white text-[12px] font-bold uppercase">
                Won
              </span>
            )}
            {isCashedOut && (
              <span className="px-2.5 py-1 rounded-[2px] bg-[#00875A]/20 text-[#00E676] text-[12px] font-bold uppercase">
                Cashed Out
              </span>
            )}
            {isLost && (
              <span className="px-2.5 py-1 rounded-[2px] bg-red-500/20 text-red-400 text-[12px] font-bold uppercase">
                Lost
              </span>
            )}
          </div>
        </div>

        {/* SportyBet Ticket Result Summary Banner */}
        <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[4px] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2A2E35] pb-3">
            <div>
              <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider block">
                Bet Type
              </span>
              <span className="text-[14px] font-bold text-[#F8F9FA]">{betTypeLabel}</span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider block">
                {isCashedOut ? 'Cashed Out Return' : 'Total Return'}
              </span>
              <span
                className={[
                  'text-xl font-black tabular-nums',
                  isWon || isCashedOut ? 'text-[#00E676]' : 'text-[#94A3B8]',
                ].join(' ')}
              >
                £{totalReturn.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[12px]">
            <div>
              <span className="text-[11px] text-[#94A3B8] block">Total Stake</span>
              <strong className="text-[#F8F9FA] tabular-nums">
                £{Number(bet.stake || 0).toFixed(2)}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-[#94A3B8] block">Total Odds</span>
              <strong className="text-[#F8F9FA] tabular-nums">
                @{totalStakedOdds.toFixed(2)}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#94A3B8] block">Status</span>
              <strong
                className={
                  isWon || isCashedOut
                    ? 'text-[#00E676]'
                    : 'text-red-400'
                }
              >
                {isWon ? 'Won' : isCashedOut ? 'Cashed Out' : 'Lost'}
              </strong>
            </div>
          </div>
        </div>

        {/* Full Match Results List */}
        <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[4px] overflow-hidden">
          <div className="px-3.5 py-2 bg-[#161920] border-b border-[#2A2E35] flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Match Results ({selections.length})
            </span>
            <span className="text-[11px] text-[#94A3B8]">Final Settlement</span>
          </div>

          <div className="divide-y divide-[#2A2E35] px-3.5">
            {selections.map((sel, idx) => {
              const hName =
                typeof sel.homeTeam === 'object' && sel.homeTeam !== null
                  ? sel.homeTeam.name || sel.homeTeam.shortName || ''
                  : sel.homeTeam || '';
              const aName =
                typeof sel.awayTeam === 'object' && sel.awayTeam !== null
                  ? sel.awayTeam.name || sel.awayTeam.shortName || ''
                  : sel.awayTeam || '';
              const matchTitle =
                sel.matchName ||
                (hName && aName ? `${hName} v ${aName}` : 'Fixture');

              const liveMatch = matches.find(
                (m) => String(m.id) === String(sel.matchId)
              );
              const liveState = getLiveSelectionState(sel, liveMatch);
              const legWon =
                sel.status === 'WON' ||
                (liveState.decided && liveState.outcome === 'won') ||
                (isWon && sel.status !== 'LOST');
              const pickLabel = getPickLabel(sel, hName, aName);

              const finalHome =
                sel.settledScore?.home ?? liveMatch?.score?.home ?? null;
              const finalAway =
                sel.settledScore?.away ?? liveMatch?.score?.away ?? null;

              return (
                <div key={idx} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Rounded Green Check or Red Times */}
                    {legWon ? (
                      <span
                        className="mt-0.5 w-5 h-5 rounded-full bg-[#00875A] text-white flex items-center justify-center shrink-0"
                        title="Won"
                      >
                        <MaterialIcon name="check" size={13} />
                      </span>
                    ) : (
                      <span
                        className="mt-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0"
                        title="Lost"
                      >
                        <MaterialIcon name="close" size={13} />
                      </span>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="text-[13px] font-bold text-[#F8F9FA] truncate">
                        {matchTitle}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#94A3B8]">
                        <span>Pick:</span>
                        <strong className="text-[#F8F9FA]">{pickLabel}</strong>
                        <span className="px-1.5 py-0.2 rounded-[2px] bg-[#161920] border border-[#2A2E35] text-[10px] font-bold uppercase">
                          {sel.market || '1X2'}
                        </span>
                      </div>

                      {finalHome !== null && finalAway !== null && (
                        <div className="text-[11px] text-[#94A3B8] tabular-nums">
                          Final Score (FT):{' '}
                          <strong className="text-[#F8F9FA]">
                            {finalHome} - {finalAway}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] block">
                      Staked Odds
                    </span>
                    <span className="text-[13px] font-bold text-[#FFC107] tabular-nums">
                      @{Number(sel.odds || 1).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN MY BETS VIEW (OPEN | SETTLED | ALL)
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-xl mx-auto py-2 space-y-3 font-sans">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack || (() => setCurrentView('home'))}
            className="w-8 h-8 rounded-[4px] bg-[#1E222A] border border-[#2A2E35] flex items-center justify-center text-[#94A3B8] hover:text-[#F8F9FA] transition-colors"
            title="Back"
          >
            <MaterialIcon name="arrow_back" size={16} />
          </button>
          <h1 className="text-[15px] font-bold text-[#F8F9FA]">My Bets</h1>
        </div>

        <span className="text-[11px] text-[#94A3B8] tabular-nums">
          {activeBets.length} Open
        </span>
      </div>

      {/* ── SportyBet Top Tabs: Open | Settled | All ── */}
      <div className="grid grid-cols-3 bg-[#1E222A] border border-[#2A2E35] rounded-[4px] overflow-hidden">
        {[
          { id: 'open', label: `Open (${activeBets.length})` },
          { id: 'settled', label: `Settled (${settledBets.length})` },
          { id: 'all', label: 'All' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setConfirmingCashoutId(null);
                setSelectedSettledBet(null);
              }}
              className={[
                'py-2.5 text-[12px] font-bold transition-colors border-b-2',
                isSelected
                  ? 'border-[#00875A] text-[#00E676] bg-[#161920]/60'
                  : 'border-transparent text-[#94A3B8] hover:text-[#F8F9FA]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Ticket List ── */}
      {filteredBets.length === 0 ? (
        <div className="bg-[#1E222A] border border-[#2A2E35] rounded-[4px] py-12 px-4 text-center space-y-3">
          <MaterialIcon name="receipt_long" size={28} className="text-[#94A3B8] mx-auto" />
          <p className="text-[12px] text-[#94A3B8]">
            {activeTab === 'open'
              ? 'No open bets available right now.'
              : 'No bets found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredBets.map((bet) => {
            const isWon = bet.status === 'WON' || bet.status === 'won';
            const isCashedOut = bet.status === 'CASHED_OUT';
            const isLost = bet.status === 'LOST' || bet.status === 'lost';
            const isPending = !isWon && !isLost && !isCashedOut;

            const ticketId = bet.id || bet.ticketId;
            const selections = bet.selections || [];
            const betTypeLabel =
              selections.length > 1 ? `Multiple (${selections.length})` : 'Single';

            const dateStr = bet.placedAt
              ? new Date(bet.placedAt).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            const potentialWin = Number(
              bet.potentialReturn || bet.potentialPayout || bet.payout || 0
            );

            // -----------------------------------------------------------------
            // SUMMARIZED SPORTYBET CARD FOR SETTLED BETS (CLICK TO OPEN DETAILS)
            // -----------------------------------------------------------------
            if (!isPending) {
              const firstSel = selections[0] || {};
              const firstH =
                typeof firstSel.homeTeam === 'object'
                  ? firstSel.homeTeam?.name || ''
                  : firstSel.homeTeam || '';
              const firstA =
                typeof firstSel.awayTeam === 'object'
                  ? firstSel.awayTeam?.name || ''
                  : firstSel.awayTeam || '';
              const firstMatchTitle =
                firstSel.matchName ||
                (firstH && firstA ? `${firstH} v ${firstA}` : 'Settled Fixture');

              const settledReturn = isCashedOut
                ? Number(bet.cashedOutAmount || bet.payout || 0)
                : isWon
                  ? potentialWin
                  : 0;

              return (
                <button
                  key={ticketId}
                  type="button"
                  onClick={() => setSelectedSettledBet(bet)}
                  className="w-full text-left bg-[#1E222A] hover:bg-[#232832] border border-[#2A2E35] rounded-[4px] overflow-hidden transition-colors cursor-pointer block"
                >
                  {/* Top Bar: Bet Type + Date on Left | Won/Lost + Arrow on Right */}
                  <div className="px-3.5 py-2 bg-[#161920] border-b border-[#2A2E35] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-[#F8F9FA]">
                        {betTypeLabel}
                      </span>
                      {dateStr && (
                        <span className="text-[11px] text-[#94A3B8] tabular-nums">
                          {dateStr}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isWon && (
                        <span className="px-2 py-0.5 rounded-[2px] bg-[#00875A] text-white text-[11px] font-bold">
                          Won
                        </span>
                      )}
                      {isCashedOut && (
                        <span className="px-2 py-0.5 rounded-[2px] bg-[#00875A]/20 text-[#00E676] text-[11px] font-bold">
                          Cashed Out
                        </span>
                      )}
                      {isLost && (
                        <span className="px-2 py-0.5 rounded-[2px] bg-[#232832] text-[#94A3B8] text-[11px] font-bold">
                          Lost
                        </span>
                      )}
                      <MaterialIcon
                        name="chevron_right"
                        size={16}
                        className="text-[#94A3B8]"
                      />
                    </div>
                  </div>

                  {/* Compact Match Summary Preview + Stake & Return */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-[12px] font-bold text-[#F8F9FA] truncate">
                        {firstMatchTitle}
                        {selections.length > 1 && (
                          <span className="text-[#94A3B8] font-normal">
                            {' '}
                            +{selections.length - 1} more
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#94A3B8]">
                        Tap to view full match results
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] uppercase block">
                          Total Stake
                        </span>
                        <strong className="text-[12px] font-bold text-[#F8F9FA] tabular-nums">
                          £{Number(bet.stake || 0).toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#94A3B8] uppercase block">
                          Total Return
                        </span>
                        <strong
                          className={[
                            'text-[13px] font-bold tabular-nums',
                            isWon || isCashedOut ? 'text-[#00E676]' : 'text-[#94A3B8]',
                          ].join(' ')}
                        >
                          £{settledReturn.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </button>
              );
            }

            // -----------------------------------------------------------------
            // EXPANDED ONGOING (OPEN) BET CARD WITH LIVE ODDS & CASHOUT
            // -----------------------------------------------------------------
            const liveCashout = evaluateBetCashout(bet);
            const totalStakedOdds = Number(
              bet.totalOdds ||
                selections.reduce((acc, s) => acc * (Number(s.odds) || 1), 1)
            );
            const totalCurrentOdds = selections.reduce((acc, sel) => {
              const liveMatch = matches.find(
                (m) => String(m.id) === String(sel.matchId)
              );
              const curOdd = getCurrentSelectionOdd(sel, liveMatch);
              return acc * (Number(curOdd) || 1);
            }, 1);

            return (
              <div
                key={ticketId}
                className="bg-[#1E222A] border border-[#2A2E35] rounded-[4px] overflow-hidden"
              >
                {/* Ticket Header Bar */}
                <div className="px-3.5 py-2 bg-[#161920] border-b border-[#2A2E35] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-[#F8F9FA]">
                      {betTypeLabel}
                    </span>
                    {dateStr && (
                      <span className="text-[11px] text-[#94A3B8] tabular-nums">
                        {dateStr}
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00E676]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
                    <span>Ongoing</span>
                  </span>
                </div>

                {/* Selections List */}
                <div className="divide-y divide-[#2A2E35] px-3.5">
                  {selections.map((sel, idx) => {
                    const hName =
                      typeof sel.homeTeam === 'object' && sel.homeTeam !== null
                        ? sel.homeTeam.name || sel.homeTeam.shortName || ''
                        : sel.homeTeam || '';
                    const aName =
                      typeof sel.awayTeam === 'object' && sel.awayTeam !== null
                        ? sel.awayTeam.name || sel.awayTeam.shortName || ''
                        : sel.awayTeam || '';
                    const matchTitle =
                      sel.matchName ||
                      (hName && aName ? `${hName} v ${aName}` : 'Fixture');

                    const liveMatch = matches.find(
                      (m) => String(m.id) === String(sel.matchId)
                    );
                    const isLive = liveMatch && liveMatch.status === 'LIVE';
                    const isFT =
                      liveMatch &&
                      (liveMatch.status === 'FT' || liveMatch.status === 'FINISHED');
                    const isSuspended = Boolean(liveMatch?.oddsSuspended);

                    const stakedOdd = Number(sel.odds) || 1.0;
                    const currentOdd = getCurrentSelectionOdd(sel, liveMatch);
                    const pickLabel = getPickLabel(sel, hName, aName);
                    const liveState = getLiveSelectionState(sel, liveMatch);

                    return (
                      <div key={idx} className="py-2.5 space-y-1.5">
                        {/* Row 1: What they staked + Rounded Green Check (for goals met or FT win) / Red Times (at FT loss) */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {liveState.decided && liveState.outcome === 'won' && (
                              <span
                                className="w-5 h-5 rounded-full bg-[#00875A] text-white flex items-center justify-center shrink-0"
                                title="Selection Won"
                              >
                                <MaterialIcon name="check" size={13} />
                              </span>
                            )}
                            {liveState.decided && liveState.outcome === 'lost' && (
                              <span
                                className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0"
                                title="Selection Lost"
                              >
                                <MaterialIcon name="close" size={13} />
                              </span>
                            )}
                            <span className="text-[11px] text-[#94A3B8]">Staked Pick:</span>
                            <span className="text-[13px] font-bold text-[#F8F9FA] truncate">
                              {pickLabel}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-[2px] bg-[#161920] border border-[#2A2E35] text-[10px] font-bold text-[#94A3B8] uppercase shrink-0">
                              {sel.market || '1X2'}
                            </span>
                          </div>
                        </div>

                        {/* Row 2: What is currently going on in the match + Staked Odds vs Current Odds */}
                        <div className="bg-[#161920] border border-[#2A2E35] rounded-[4px] px-2.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          {/* Left: Match & Ongoing Live State */}
                          <div className="min-w-0 space-y-0.5">
                            <div className="text-[12px] font-bold text-[#F8F9FA] truncate">
                              {matchTitle}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              {isLive ? (
                                <>
                                  <span className="px-1.5 py-0.2 rounded-[2px] bg-[#00875A]/20 text-[#00E676] font-bold tabular-nums">
                                    LIVE {liveMatch.period || '2H'} {liveMatch.minute}'
                                  </span>
                                  <span className="font-bold text-[#F8F9FA] tabular-nums">
                                    {liveMatch.score?.home ?? 0} - {liveMatch.score?.away ?? 0}
                                  </span>
                                </>
                              ) : isFT ? (
                                <span className="text-[#94A3B8] font-bold tabular-nums">
                                  FT {liveMatch.score?.home ?? 0} - {liveMatch.score?.away ?? 0}
                                </span>
                              ) : (
                                <span className="text-[#94A3B8]">
                                  Upcoming
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Staked Odds vs Current Live Odds */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <div className="px-2 py-1 rounded-[2px] bg-[#1E222A] border border-[#2A2E35] text-right">
                              <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] block leading-none">
                                Staked Odds
                              </span>
                              <span className="text-[12px] font-bold text-[#F8F9FA] tabular-nums">
                                @{stakedOdd.toFixed(2)}
                              </span>
                            </div>

                            <MaterialIcon
                              name="trending_flat"
                              size={14}
                              className="text-[#94A3B8]"
                            />

                            <div className="px-2 py-1 rounded-[2px] bg-[#1E222A] border border-[#2A2E35] text-right">
                              <span className="text-[9px] uppercase tracking-wider text-[#94A3B8] block leading-none">
                                Current Odds
                              </span>
                              {isFT ? (
                                <span className="text-[12px] font-bold text-[#94A3B8] tabular-nums">
                                  Closed (FT)
                                </span>
                              ) : isSuspended ? (
                                <span className="text-[11px] font-bold text-[#FFC107]">
                                  Suspended
                                </span>
                              ) : (
                                <span
                                  className={[
                                    'text-[12px] font-bold tabular-nums',
                                    currentOdd < stakedOdd
                                      ? 'text-[#00E676]'
                                      : currentOdd > stakedOdd
                                        ? 'text-[#FFC107]'
                                        : 'text-[#F8F9FA]',
                                  ].join(' ')}
                                >
                                  @{currentOdd.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ticket Financial Summary Strip above Cashout */}
                <div className="px-3.5 py-2 bg-[#161920]/70 border-t border-[#2A2E35] flex items-center justify-between text-[12px]">
                  <div className="text-[#94A3B8]">
                    Total Stake:{' '}
                    <strong className="text-[#F8F9FA] tabular-nums">
                      £{Number(bet.stake).toFixed(2)}
                    </strong>
                  </div>

                  <div className="text-[#94A3B8]">
                    Potential Win:{' '}
                    <strong className="text-[#00E676] tabular-nums">
                      £{potentialWin.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* SportyBet Full-Width Cashout Bar */}
                <div className="px-3.5 pb-3 pt-1 bg-[#161920]/70">
                  {liveCashout.available ? (
                    confirmingCashoutId === ticketId ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={cashingOutId === ticketId}
                          onClick={() => setConfirmingCashoutId(null)}
                          className="py-2 rounded-[4px] bg-[#232832] hover:bg-[#2B313D] border border-[#2A2E35] text-[#F8F9FA] font-bold text-[12px] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={cashingOutId === ticketId}
                          onClick={() => handleConfirmCashout(ticketId)}
                          className="py-2 rounded-[4px] bg-[#00875A] hover:bg-[#009e69] text-white font-bold text-[12px] tabular-nums transition-colors"
                        >
                          {cashingOutId === ticketId
                            ? 'Processing...'
                            : `Confirm £${liveCashout.amount.toFixed(2)}`}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingCashoutId(ticketId)}
                        className="w-full py-2 px-4 rounded-[4px] bg-[#00875A] hover:bg-[#009e69] text-white font-bold text-[13px] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>Cashout</span>
                        <span className="tabular-nums">£{liveCashout.amount.toFixed(2)}</span>
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 px-4 rounded-[4px] bg-[#161920] border border-[#2A2E35] text-[#94A3B8] font-bold text-[12px] flex items-center justify-center gap-1.5 cursor-not-allowed opacity-70"
                    >
                      <MaterialIcon name="lock" size={14} />
                      <span>Cashout Unavailable</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
