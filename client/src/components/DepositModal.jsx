import React, { useState } from 'react';
import { useBetting } from '../context/BettingContext';
import { X, Wallet, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

/**
 * High-Density Sportsbook Deposit Modal (SportyBet / 1xBet style)
 * Clean tabular inputs, quick amount chips, sharp 4px corners, and electric green CTA.
 */
export default function DepositModal() {
  const { showDeposit, setShowDeposit, deposit, balance } = useBetting();
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);

  if (!showDeposit) return null;

  const quickAmounts = [50, 100, 250, 500];

  const handleDeposit = async () => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) return;
    setLoading(true);
    try {
      await deposit(num);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) setShowDeposit(false); }}
    >
      <div
        className="relative w-full max-w-md bg-[#121824] border border-[#1F2B3E] rounded-[4px] overflow-hidden shadow-2xl animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Deposit Funds"
      >
        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#1A2332] bg-[#0E131C]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[3px] bg-[#00E676] text-[#051A0E] flex items-center justify-center">
              <Wallet className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white leading-tight">Deposit Funds</h2>
              <span className="text-[10px] text-slate-400 font-mono">Instant Double-Entry Ledger Credit</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDeposit(false)}
            className="p-1 rounded-[2px] text-slate-400 hover:text-white hover:bg-[#182235] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Current balance card */}
          <div className="flex items-center justify-between p-3 rounded-[3px] bg-[#0E131C] border border-[#1A2332]">
            <span className="text-xs text-slate-400 font-medium">Available Balance</span>
            <span className="font-mono tabular-nums text-base font-extrabold text-[#00E676]">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Deposit Amount ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-slate-400">
                $
              </span>
              <input
                type="number"
                min="1"
                max="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#182235] border border-[#25344D] rounded-[3px] pl-7 pr-3 py-2 text-sm font-mono tabular-nums font-bold text-white focus:outline-none focus:border-[#00E676]"
                placeholder="100"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Amount Chips */}
          <div className="grid grid-cols-4 gap-1.5">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(String(amt))}
                className={[
                  'py-1.5 rounded-[2px] text-xs font-mono font-bold transition-colors border text-center',
                  amount === String(amt)
                    ? 'bg-[#1E2B42] text-[#00E676] border-[#00E676]'
                    : 'bg-[#182235] hover:bg-[#202C45] text-slate-300 border-[#25344D]',
                ].join(' ')}
              >
                +${amt}
              </button>
            ))}
          </div>

          {/* Instant Credit Note */}
          <div className="flex items-center gap-2 p-2.5 rounded-[3px] bg-[#182235] border border-[#25344D] text-xs text-slate-300">
            <Zap className="w-4 h-4 text-[#00E676] shrink-0" />
            <span className="text-[11px]">Instant settlement credited directly into simulated player wallet ledger.</span>
          </div>

          {/* Action button */}
          <button
            type="button"
            disabled={loading || !Number(amount) || Number(amount) <= 0}
            onClick={handleDeposit}
            className="w-full py-2.5 px-4 rounded-[3px] font-black text-xs uppercase tracking-wider text-[#051A0E] bg-[#00E676] hover:bg-[#00C853] disabled:opacity-40 disabled:cursor-not-allowed shadow-odds-active transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#051A0E] border-t-transparent rounded-full animate-spin" />
                <span>Processing Deposit…</span>
              </>
            ) : (
              <>
                <span>CONFIRM DEPOSIT (${Number(amount || 0).toFixed(2)})</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
