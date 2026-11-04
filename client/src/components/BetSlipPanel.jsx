import React, { useState, useMemo } from 'react';
import { useBetting } from '../context/BettingContext';
import MaterialIcon from './MaterialIcon';
import {
  X,
  Trash2,
  AlertCircle,
  ArrowRight,
  Bookmark,
  Copy,
  Check,
  Download,
} from 'lucide-react';

/**
 * High-Density Sportsbook BetSlip Panel (RolalBet UK)
 * Supports:
 * - Unrestricted selection & stake entry for both guests and logged-in users
 * - Two-step Place Bet -> Cancel / Confirm flow (redirects guests to Login on Confirm)
 * - Book Bet (generates shareable booking code stored in Aiven PostgreSQL)
 * - Load Booking Code (loads selections from a booking code into the Bet Slip)
 */
export default function BetSlipPanel() {
  const {
    isAuthenticated,
    openAuth,
    betslip,
    removeFromSlip,
    clearSlip,
    placeBet,
    bookBet,
    loadBookedBet,
    balance,
    setShowDeposit,
    setShowBetslip,
  } = useBetting();

  const [betType, setBetType] = useState('multi'); // 'single' | 'multi'
  const [stake, setStake] = useState('10');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking code state
  const [bookedCode, setBookedCode] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loadCodeInput, setLoadCodeInput] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [loadCodeError, setLoadCodeError] = useState(null);

  const quickStakes = [5, 10, 25, 50, 100];

  // Cumulative odds for accumulator
  const cumulativeOdds = useMemo(() => {
    if (betslip.length === 0) return 0;
    if (betType === 'single') return betslip[0]?.odds || 1;
    return (
      Math.round(
        betslip.reduce((acc, s) => acc * (Number(s.odds) || 1), 1) * 100
      ) / 100
    );
  }, [betslip, betType]);

  // Acca bonus boost
  const bonusMultiplier = useMemo(() => {
    if (betType !== 'multi' || betslip.length < 3) return 1.0;
    if (betslip.length >= 5) return 1.15;
    if (betslip.length >= 4) return 1.1;
    return 1.05;
  }, [betslip.length, betType]);

  const numStake = Number(stake) || 0;

  const potentialPayout = useMemo(() => {
    if (numStake <= 0) return 0;
    if (betType === 'single') {
      const perStake = numStake / Math.max(1, betslip.length);
      return (
        Math.round(
          betslip.reduce((sum, item) => sum + perStake * Number(item.odds), 0) *
            100
        ) / 100
      );
    }
    return Math.round(numStake * cumulativeOdds * bonusMultiplier * 100) / 100;
  }, [numStake, betType, betslip, cumulativeOdds, bonusMultiplier]);

  // Step 1: User presses Place Bet -> opens Cancel / Confirm prompt
  const handleInitiatePlaceBet = () => {
    if (betslip.length === 0 || numStake <= 0) return;
    setIsConfirming(true);
  };

  // Step 2: User presses Confirm -> if not logged in, takes them to Login; if logged in, places bet
  const handleConfirmPlaceBet = async () => {
    if (!isAuthenticated) {
      setIsConfirming(false);
      setShowBetslip(false);
      openAuth('login');
      return;
    }

    if (numStake > balance) {
      setIsConfirming(false);
      setShowDeposit(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await placeBet(numStake, betType);
      if (res.success) {
        setIsConfirming(false);
        setBookedCode(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Book Bet handler -> generates a Booking Code
  const handleBookBet = async () => {
    if (betslip.length === 0) return;
    setIsBooking(true);
    try {
      const res = await bookBet(numStake || 10, betType);
      if (res.success && res.code) {
        setBookedCode(res.code);
        setCopiedCode(false);
      }
    } finally {
      setIsBooking(false);
    }
  };

  // Copy generated Booking Code
  const handleCopyCode = () => {
    if (!bookedCode) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(bookedCode);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Load a Booking Code into the Bet Slip
  const handleLoadCodeSubmit = async (e) => {
    e.preventDefault();
    if (!loadCodeInput.trim()) return;
    setLoadCodeError(null);
    setIsLoadingCode(true);
    try {
      const res = await loadBookedBet(loadCodeInput);
      if (res.success) {
        if (res.betType) setBetType(res.betType);
        if (res.stake) setStake(String(res.stake));
        setBookedCode(res.code);
        setLoadCodeInput('');
        setIsConfirming(false);
      } else if (res.codeDisabled || res.error) {
        setLoadCodeError(res.error || 'Selections have been disabled');
      }
    } finally {
      setIsLoadingCode(false);
    }
  };

  const addStake = (amt) => {
    setStake((prev) => {
      const current = Number(prev) || 0;
      return String(current + amt);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#1E222A] border border-[#2A2E35] rounded-[2px] p-2 space-y-2">
      {/* ── Betslip Header ── */}
      <div className="flex items-center justify-between px-1 pb-1.5 border-b border-[#2A2E35]">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-[2px] bg-[#FFC107] text-[#111418] flex items-center justify-center font-bold text-[11px] tabular-nums">
            {betslip.length}
          </span>
          <h2 className="font-bold text-[14px] uppercase tracking-wider text-[#F8F9FA]">
            Bet Slip
          </h2>
          {bonusMultiplier > 1 && (
            <span className="flex items-center gap-0.5 text-[11px] tabular-nums font-bold text-[#FFC107] bg-[#161920] px-1.5 py-0.2 rounded-[2px] border border-[#2A2E35] uppercase">
              <MaterialIcon name="local_fire_department" size={12} filled className="text-[#FFC107]" />
              +{Math.round((bonusMultiplier - 1) * 100)}%
            </span>
          )}
        </div>

        {betslip.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearSlip();
              setIsConfirming(false);
              setBookedCode(null);
            }}
            className="text-[11px] text-[#94A3B8] hover:text-red-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] hover:bg-[#232832]"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* ── Load Booking Code Bar ── */}
      <div className="space-y-1">
        <form
          onSubmit={handleLoadCodeSubmit}
          className="flex items-center gap-1 bg-[#161920] border border-[#2A2E35] rounded-[2px] p-1"
        >
          <input
            type="text"
            value={loadCodeInput}
            onChange={(e) => {
              setLoadCodeInput(e.target.value.toUpperCase());
              if (loadCodeError) setLoadCodeError(null);
            }}
            placeholder="Booking Code (e.g. RB-7K9X2M)"
            className="flex-1 min-w-0 bg-[#232832] border border-[#2A2E35] rounded-[2px] px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#F8F9FA] placeholder-[#64748B] focus:outline-none focus:border-[#FFC107] tabular-nums"
          />
          <button
            type="submit"
            disabled={!loadCodeInput.trim() || isLoadingCode}
            className="px-2.5 py-1 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] border border-[#2A2E35] text-[11px] font-bold uppercase tracking-wider text-[#FFC107] disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
          >
            <Download className="w-3 h-3" />
            <span>{isLoadingCode ? '…' : 'Load'}</span>
          </button>
        </form>

        {loadCodeError && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#161920] border border-red-500 rounded-[2px] text-red-400 text-[11px] font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1">{loadCodeError}</span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 max-h-[calc(100vh-250px)]">
        {betslip.length === 0 ? (
          <div className="py-8 text-center space-y-1.5">
            <div className="w-9 h-9 rounded-[2px] bg-[#232832] border border-[#2A2E35] mx-auto flex items-center justify-center text-[#94A3B8]">
              <MaterialIcon name="shopping_cart" size={16} />
            </div>
            <p className="text-[14px] font-bold text-[#F8F9FA]">Bet slip is empty</p>
            <p className="text-[11px] text-[#94A3B8] max-w-[200px] mx-auto">
              Select odds from the fixtures matrix or enter a booking code above to load a slip.
            </p>
          </div>
        ) : (
          <>
            {/* Segmented Bet Type Switcher */}
            <div className="grid grid-cols-2 p-0.5 bg-[#161920] rounded-[2px] border border-[#2A2E35] text-[12px]">
              <button
                type="button"
                onClick={() => setBetType('multi')}
                className={[
                  'py-1 rounded-[2px] transition-colors text-center font-bold',
                  betType === 'multi'
                    ? 'bg-[#FFC107] text-[#111418]'
                    : 'text-[#94A3B8] hover:text-[#F8F9FA]',
                ].join(' ')}
              >
                Multiple / Acca
              </button>
              <button
                type="button"
                onClick={() => setBetType('single')}
                className={[
                  'py-1 rounded-[2px] transition-colors text-center font-bold',
                  betType === 'single'
                    ? 'bg-[#FFC107] text-[#111418]'
                    : 'text-[#94A3B8] hover:text-[#F8F9FA]',
                ].join(' ')}
              >
                Single{betslip.length > 1 ? ` (${betslip.length})` : ''}
              </button>
            </div>

            {/* Individual Selections */}
            <div className="space-y-1">
              {betslip.map((item) => {
                const hName =
                  typeof item.homeTeam === 'object'
                    ? item.homeTeam?.name || item.homeTeam?.shortName
                    : item.homeTeam;
                const aName =
                  typeof item.awayTeam === 'object'
                    ? item.awayTeam?.name || item.awayTeam?.shortName
                    : item.awayTeam;
                const matchTitle = item.matchName || `${hName} vs ${aName}`;

                return (
                  <div
                    key={`${item.matchId}-${item.market}-${item.selectionKey}`}
                    className="bg-[#161920] border border-[#2A2E35] rounded-[2px] px-2 py-1.5 relative group transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#94A3B8] truncate font-normal">
                          {matchTitle}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[14px] font-bold text-[#F8F9FA] truncate">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-[#94A3B8] uppercase">
                            {item.market}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="tabular-nums font-medium text-[14px] text-[#FFC107] bg-[#232832] px-1.5 py-0.5 rounded-[2px] border border-[#2A2E35]">
                          {Number(item.odds).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            removeFromSlip(item.matchId, item.market, item.selectionKey);
                            setIsConfirming(false);
                          }}
                          className="p-1 rounded-[2px] text-[#94A3B8] hover:text-red-400 hover:bg-[#232832] transition-colors"
                          aria-label={`Remove ${item.label}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stake Input Box */}
            <div className="bg-[#161920] border border-[#2A2E35] rounded-[2px] p-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-bold text-[#94A3B8] uppercase tracking-wider">
                  Stake Amount
                </label>
                {isAuthenticated && (
                  <span className="text-[#94A3B8]">
                    Balance:{' '}
                    <strong className="tabular-nums text-[#F8F9FA]">
                      £{balance.toFixed(2)}
                    </strong>
                  </span>
                )}
              </div>

              {/* Stake input with numeric styling */}
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-[14px] text-[#94A3B8]">
                  £
                </span>
                <input
                  type="number"
                  min="1"
                  value={stake}
                  onChange={(e) => {
                    setStake(e.target.value);
                    setIsConfirming(false);
                  }}
                  className="w-full bg-[#232832] border border-[#2A2E35] rounded-[2px] pl-6 pr-3 py-1.5 text-[14px] tabular-nums font-bold text-[#F8F9FA] focus:outline-none focus:border-[#FFC107]"
                  placeholder="Stake"
                />
              </div>

              {/* Quick stake increment chips */}
              <div className="grid grid-cols-6 gap-1 pt-0.5">
                {quickStakes.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      addStake(amt);
                      setIsConfirming(false);
                    }}
                    className="py-1 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] border border-[#2A2E35] text-[11px] tabular-nums font-bold text-[#F8F9FA] transition-colors text-center"
                    title={`Add +£${amt}`}
                  >
                    +£{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setStake(String(Math.floor(balance)));
                    setIsConfirming(false);
                  }}
                  className="py-1 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] text-[#FFC107] border border-[#2A2E35] text-[11px] font-bold transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Payout Summary Box */}
            <div className="bg-[#161920] border border-[#2A2E35] rounded-[2px] p-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#94A3B8]">
                  {betType === 'multi' ? 'Accumulator Odds:' : 'Selections:'}
                </span>
                <span className="tabular-nums font-medium text-[14px] text-[#F8F9FA]">
                  {betType === 'multi'
                    ? `@${cumulativeOdds.toFixed(2)}`
                    : betslip.length}
                </span>
              </div>

              {bonusMultiplier > 1 && (
                <div className="flex items-center justify-between text-[11px] text-[#FFC107]">
                  <span>Acca Boost:</span>
                  <span className="tabular-nums font-bold">
                    +{Math.round((bonusMultiplier - 1) * 100)}%
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2A2E35]">
                <span className="font-bold text-[#94A3B8] text-[11px]">
                  Potential Return:
                </span>
                <span className="tabular-nums font-bold text-[14px] text-[#00875A]">
                  £
                  {potentialPayout.toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Insufficient Funds Banner (only when logged in) */}
            {isAuthenticated && numStake > balance && (
              <div className="flex items-center gap-1.5 p-2 bg-[#161920] border border-red-500 rounded-[2px] text-red-400 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">Insufficient balance.</span>
                <button
                  type="button"
                  onClick={() => setShowDeposit(true)}
                  className="font-bold underline hover:text-white"
                >
                  Deposit
                </button>
              </div>
            )}

            {/* ── Place Bet OR Cancel / Confirm Step ── */}
            {!isConfirming ? (
              <button
                type="button"
                disabled={isSubmitting || betslip.length === 0 || numStake <= 0}
                onClick={handleInitiatePlaceBet}
                className="w-full py-2 px-3 rounded-[2px] font-bold text-[14px] uppercase tracking-wider text-white bg-[#00875A] hover:bg-[#00704A] border border-[#00875A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="tabular-nums">
                  PLACE BET (£{numStake.toFixed(2)})
                </span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <div className="bg-[#161920] border border-[#FFC107] rounded-[2px] p-2 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-[#FFC107]">
                    Confirm Bet Placement
                  </span>
                  <span className="tabular-nums font-bold text-[#F8F9FA]">
                    Stake: £{numStake.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsConfirming(false)}
                    className="py-1.5 px-2 rounded-[2px] bg-[#232832] hover:bg-[#2B313D] border border-[#2A2E35] text-[#F8F9FA] font-bold text-[12px] uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmPlaceBet}
                    className="py-1.5 px-2 rounded-[2px] bg-[#00875A] hover:bg-[#00704A] border border-[#00875A] text-white font-bold text-[12px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Confirming…</span>
                      </>
                    ) : (
                      <span>Confirm</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Book Bet Button (Generates Booking Code) ── */}
            <button
              type="button"
              disabled={isBooking || betslip.length === 0}
              onClick={handleBookBet}
              className="w-full py-1.5 px-3 rounded-[2px] font-bold text-[12px] uppercase tracking-wider text-[#F8F9FA] bg-[#232832] hover:bg-[#2B313D] border border-[#2A2E35] transition-colors flex items-center justify-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#FFC107]" />
              <span>{isBooking ? 'Booking Slip…' : 'Book Bet (Generate Code)'}</span>
            </button>

            {/* ── Generated Booking Code Display Card ── */}
            {bookedCode && (
              <div className="bg-[#161920] border border-[#2A2E35] rounded-[2px] p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    Booking Code
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#FFC107] hover:underline"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3 h-3 text-[#00875A]" />
                        <span className="text-[#00875A]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#232832] border border-[#2A2E35] rounded-[2px] py-1.5 px-2 text-center font-bold text-[15px] tracking-widest text-[#FFC107] tabular-nums select-all">
                  {bookedCode}
                </div>
                <p className="text-[10px] text-[#94A3B8] text-center">
                  Enter this code anytime in the Bet Slip to reload these selections.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
