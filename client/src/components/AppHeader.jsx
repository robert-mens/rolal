import React, { useState } from 'react';
import { useBetting } from '../context/BettingContext';
import MaterialIcon from './MaterialIcon';
import { Plus, ArrowUpRight, Receipt, Search, User } from 'lucide-react';

/**
 * Modern High-Priority Sportsbook Header
 * - Clean wordmark (no square GB badge)
 * - No redundant "live feed" pill
 * - Modern rounded search input
 * - Account balance with clear visual priority & distinction
 * - Modern rounded deposit and withdrawal action buttons
 * - Quick account profile access
 */
export default function AppHeader() {
  const {
    user,
    isAuthenticated,
    openAuth,
    currentView,
    setCurrentView,
    balance,
    activeBets,
    openMyBets,
    openDeposit,
    openWithdraw,
    openAccount,
    searchQuery,
    setSearchQuery,
  } = useBetting();

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'UK';

  return (
    <header className="sticky top-0 z-40 bg-[#1E222A] border-b border-[#2A2E35]">
      <div className="w-full px-3 sm:px-4 py-2 flex items-center justify-between gap-3 sm:gap-6">
        {/* ── Brand Logo Wordmark & Quick Nav (Clean & Modern, No GB square) ── */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-1.5 select-none group text-left cursor-pointer"
            aria-label="RolalBet Home"
          >
            <div className="flex flex-col">
              <span className="font-bold text-lg sm:text-xl text-[#F8F9FA] tracking-tight leading-none">
                Rolal<span className="text-[#FFC107]">Bet</span>
              </span>
              <span className="text-[11px] text-[#94A3B8] font-normal uppercase tracking-widest leading-none mt-0.5">
                Sportsbook
              </span>
            </div>
          </button>

          {/* Desktop Primary View Switcher */}
          <nav className="hidden lg:flex items-center gap-1 pl-2 border-l border-[#2A2E35]" aria-label="Primary sections">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className={[
                'px-3 py-1.5 rounded-[2px] text-[12px] font-bold transition-colors',
                currentView === 'home' || currentView === 'live'
                  ? 'bg-[#FFC107] text-[#111418]'
                  : 'text-[#94A3B8] hover:text-[#F8F9FA] hover:bg-[#232832]',
              ].join(' ')}
            >
              Sportsbook
            </button>
            <button
              type="button"
              onClick={openMyBets}
              className={[
                'px-3 py-1.5 rounded-[2px] text-[12px] font-bold transition-colors flex items-center gap-1.5',
                currentView === 'mybets'
                  ? 'bg-[#FFC107] text-[#111418]'
                  : 'text-[#94A3B8] hover:text-[#F8F9FA] hover:bg-[#232832]',
              ].join(' ')}
            >
              <span>My Bets</span>
              {activeBets.length > 0 && (
                <span
                  className={[
                    'px-1.5 py-0.2 rounded-[2px] text-[11px] tabular-nums font-bold',
                    currentView === 'mybets'
                      ? 'bg-[#111418] text-[#FFC107]'
                      : 'bg-[#00875A] text-white',
                  ].join(' ')}
                >
                  {activeBets.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => openAccount('profile')}
              className={[
                'px-3 py-1.5 rounded-[2px] text-[12px] font-bold transition-colors',
                currentView === 'account'
                  ? 'bg-[#FFC107] text-[#111418]'
                  : 'text-[#94A3B8] hover:text-[#F8F9FA] hover:bg-[#232832]',
              ].join(' ')}
            >
              Account
            </button>
          </nav>
        </div>

        {/* ── Center: Modern Rounded Search Bar (Desktop) ── */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'home' && currentView !== 'live') {
                  setCurrentView('home');
                }
              }}
              placeholder="Search teams, competitions, leagues…"
              className="w-full bg-[#232832] hover:bg-[#2B313D] focus:bg-[#232832] border border-[#2A2E35] focus:border-[#FFC107] rounded-full pl-10 pr-4 py-1.5 text-[12px] font-medium text-[#F8F9FA] placeholder:text-[#94A3B8] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8F9FA] text-[11px] font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Right Controls: Account Balance, Actions, Profile ── */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile search toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden p-2 rounded-full text-[#94A3B8] hover:text-[#F8F9FA] hover:bg-[#232832] transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {isAuthenticated ? (
            <>
              {/* ── Account Balances: Clear Visual Priority ── */}
              <div className="flex items-center gap-2 bg-[#161920] border border-[#2A2E35] rounded-full pl-3 sm:pl-3.5 pr-1.5 py-1">
                <div className="flex flex-col text-left mr-1">
                  <span className="text-[11px] text-[#94A3B8] font-normal leading-none">
                    Balance
                  </span>
                  <span className="tabular-nums text-[14px] font-bold text-[#FFC107] leading-tight">
                    £{balance.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Modern Rounded Deposit Button */}
                <button
                  type="button"
                  onClick={openDeposit}
                  className="rounded-full px-3 sm:px-3.5 py-1.5 bg-[#00875A] hover:bg-[#00704A] text-white text-[12px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  title="Deposit funds"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Deposit</span>
                </button>

                {/* Modern Rounded Withdraw Shortcut */}
                <button
                  type="button"
                  onClick={openWithdraw}
                  className="hidden sm:inline-flex rounded-full px-3 py-1.5 bg-[#232832] hover:bg-[#2B313D] text-[#F8F9FA] border border-[#2A2E35] text-[12px] font-bold uppercase tracking-wider items-center gap-1 transition-colors"
                  title="Withdraw funds"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Withdraw</span>
                </button>
              </div>

              {/* My Bets Dedicated Page Button */}
              <button
                type="button"
                onClick={openMyBets}
                className={[
                  'relative h-9 px-3 rounded-full border text-[12px] font-bold flex items-center gap-1.5 transition-colors select-none',
                  currentView === 'mybets'
                    ? 'bg-[#FFC107] text-[#111418] border-[#FFC107]'
                    : 'bg-[#232832] hover:bg-[#2B313D] border-[#2A2E35] text-[#F8F9FA]',
                ].join(' ')}
                aria-label="My Bets"
                title="View All My Bets Page"
              >
                <Receipt className={`w-3.5 h-3.5 ${currentView === 'mybets' ? 'text-[#111418]' : 'text-[#94A3B8]'}`} />
                <span className="hidden sm:inline">My Bets</span>
                {activeBets.length > 0 && (
                  <span
                    className={[
                      'min-w-[16px] h-4 rounded-full tabular-nums text-[11px] font-bold flex items-center justify-center px-1',
                      currentView === 'mybets'
                        ? 'bg-[#111418] text-[#FFC107]'
                        : 'bg-[#00875A] text-white',
                    ].join(' ')}
                  >
                    {activeBets.length}
                  </span>
                )}
              </button>

              {/* Profile / Account Page Button */}
              <button
                type="button"
                onClick={() => openAccount('profile')}
                className={[
                  'w-9 h-9 rounded-full border flex items-center justify-center text-[11px] font-bold transition-colors',
                  currentView === 'account'
                    ? 'bg-[#FFC107] text-[#111418] border-[#FFC107]'
                    : 'bg-[#232832] hover:bg-[#2B313D] border-[#2A2E35] text-[#F8F9FA]',
                ].join(' ')}
                title={`Signed in as ${user?.fullName}`}
                aria-label="Account Settings"
              >
                {userInitials}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="h-9 px-3.5 rounded-full bg-[#232832] hover:bg-[#2B313D] text-[#F8F9FA] border border-[#2A2E35] text-[12px] font-bold uppercase tracking-wider transition-colors"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="h-9 px-3.5 rounded-full bg-[#FFC107] text-[#111418] border border-[#FFC107] text-[12px] font-bold uppercase tracking-wider transition-colors"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search input expander */}
      {mobileSearchOpen && (
        <div className="md:hidden px-3 pb-2.5 pt-1 border-t border-[#2A2E35] animate-fade-in">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'home' && currentView !== 'live') {
                  setCurrentView('home');
                }
              }}
              placeholder="Search matches…"
              autoFocus
              className="w-full bg-[#232832] border border-[#2A2E35] rounded-full pl-9 pr-4 py-1.5 text-[12px] text-[#F8F9FA] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FFC107]"
            />
          </div>
        </div>
      )}
    </header>
  );
}
