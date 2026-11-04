import React, { useState, useMemo, useEffect, useCallback, Component } from 'react';
import { BettingProvider, useBetting } from './context/BettingContext';
import AppHeader from './components/AppHeader';
import LiveTicker from './components/LiveTicker';
import LeagueSidebar from './components/LeagueSidebar';
import MobileLeagueBar from './components/MobileLeagueBar';
import MarketTabs from './components/MarketTabs';
import MatchCard from './components/MatchCard';
import BetSlipPanel from './components/BetSlipPanel';
import BottomNav from './components/BottomNav';
import MyBetsPage from './pages/MyBetsPage';
import AccountPage from './pages/AccountPage';
import WalletPage from './pages/WalletPage';
import BlockedLocationPage from './pages/BlockedLocationPage';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';
import CountryBadge from './components/CountryBadge';
import MaterialIcon from './components/MaterialIcon';
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShoppingCart,
  RefreshCw,
  ChevronRight,
  Shield,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Error Boundary
// ---------------------------------------------------------------------------
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0B0E14] text-white text-center">
          <div className="w-12 h-12 rounded-[4px] bg-red-500/10 text-red-500 flex items-center justify-center mb-3 border border-red-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold mb-1 uppercase tracking-wide">Something went wrong</h2>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            An unexpected error occurred while loading this view. You can reload the application.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-[#00E676] text-[#051A0E] font-black uppercase text-xs hover:bg-[#00C853] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
function Dashboard() {
  const {
    currentView,
    setCurrentView,
    matches,
    leagues,
    selectedLeague,
    setSelectedLeague,
    betslip,
    showBetslip,
    setShowBetslip,
    searchQuery,
    notification,
  } = useBetting();

  const [liveOnly, setLiveOnly] = useState(false);

  // Derive liveOnly from bottom-nav "Live" tab
  const effectiveLiveOnly = currentView === 'live' || liveOnly;

  // Filter matches: ONLY Live and Upcoming (Scheduled) matches are displayed for betting
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const isLive = match.status === 'LIVE' || match.status === 'IN_PLAY';
      const isScheduled = match.status === 'SCHEDULED' || match.status === 'UPCOMING' || match.status === 'NS';

      // Exclude already played (Full Time) matches from the active betting board
      if (!isLive && !isScheduled) return false;

      const matchLeague = match.leagueId || match.league;
      const matchesLeague =
        selectedLeague === 'ALL' || matchLeague === selectedLeague;
      const matchesLive =
        !effectiveLiveOnly || isLive;

      // Filter by search query if user typed into modern rounded search
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const home = typeof match.homeTeam === 'object' ? (match.homeTeam?.name || '') : String(match.homeTeam || '');
        const away = typeof match.awayTeam === 'object' ? (match.awayTeam?.name || '') : String(match.awayTeam || '');
        const leagueName = match.leagueName || '';
        const combined = `${home} ${away} ${leagueName}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }

      return matchesLeague && matchesLive;
    });
  }, [matches, selectedLeague, effectiveLiveOnly, searchQuery]);

  // Group leagues for mobile competition browser
  const groupedLeagues = useMemo(() => {
    const map = {};
    (leagues || []).forEach((l) => {
      if (l.id === 'ALL') return;
      const country = l.country || 'Global';
      if (!map[country]) map[country] = { countryCode: l.countryCode || '', items: [] };
      map[country].items.push(l);
    });
    return map;
  }, [leagues]);

  const activeLeagueObj = (leagues || []).find((l) => l.id === selectedLeague);

  return (
    <div className="min-h-screen flex flex-col bg-[#1E222A] text-[#F8F9FA] font-sans relative overflow-x-hidden">
      {/* ── Toast Notification ── */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={[
            'fixed top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-[2px] text-[12px] font-bold',
            'flex items-center gap-2 border transition-all max-w-[90vw] animate-slide-up',
            notification.type === 'success'
              ? 'bg-[#1E222A] text-[#00875A] border-[#00875A]'
              : notification.type === 'error'
                ? 'bg-[#1E222A] text-red-400 border-red-500'
                : 'bg-[#1E222A] text-[#FFC107] border-[#2A2E35]',
          ].join(' ')}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#00875A] shrink-0" />}
          {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-[#FFC107] shrink-0" />}
          <span className="truncate">{notification.message}</span>
        </div>
      )}

      {/* ── Sportsbook Global Header ── */}
      <AppHeader />

      {/* ── Strict 3-Column Desktop Architecture: Left 20% | Center 60% | Right 20% ── */}
      <div className="flex-1 flex w-full relative">
        {/* Left Navigation Column (20% Desktop) */}
        <aside className="hidden lg:block lg:w-[20%] shrink-0 border-r border-[#2A2E35] bg-[#1E222A] overflow-y-auto">
          <LeagueSidebar />
        </aside>

        {/* Center Live Markets & Dedicated Pages Column (60% Desktop) */}
        <main className="flex-1 lg:w-[60%] min-w-0 px-3 py-2 space-y-2 bg-[#161920]">
          {currentView === 'mybets' ? (
            <MyBetsPage onBack={() => setCurrentView('home')} />
          ) : currentView === 'account' ? (
            <AccountPage onBack={() => setCurrentView('home')} />
          ) : currentView === 'wallet' ? (
            <WalletPage onBack={() => setCurrentView('home')} />
          ) : (
            <>
              {/* Mobile swipeable league bar (Mobile only) */}
              <MobileLeagueBar />

              {/* Live In-Play Match Ticker Strip */}
              {currentView !== 'matches' && <LiveTicker />}

              {/* Section Heading & Filter Status */}
              <div className="flex items-center justify-between py-1 border-b border-[#2A2E35]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-[2px] bg-[#1E222A] border border-[#2A2E35] flex items-center justify-center">
                    <MaterialIcon name="emoji_events" size={14} className="text-[#FFC107]" />
                  </div>
                  <div>
                    <h1 className="text-[14px] font-bold uppercase tracking-wide text-[#F8F9FA] leading-tight">
                      {currentView === 'matches'
                        ? 'All Covered Competitions'
                        : selectedLeague === 'ALL'
                          ? 'All Fixtures'
                          : activeLeagueObj?.name || 'Football'}
                    </h1>
                    <span className="text-[11px] text-[#94A3B8] font-normal tabular-nums">
                      {currentView === 'matches'
                        ? `${leagues.length - 1} Verified Leagues`
                        : `${filteredMatches.length} Available Fixtures`}
                    </span>
                  </div>
                </div>

                {selectedLeague !== 'ALL' && currentView !== 'matches' && (
                  <button
                    type="button"
                    onClick={() => setSelectedLeague('ALL')}
                    className="text-[11px] font-bold text-[#FFC107] hover:underline px-2 py-1 rounded-[2px] bg-[#1E222A] border border-[#2A2E35] transition-colors"
                  >
                    Reset to All
                  </button>
                )}
              </div>

              {/* Dedicated mobile Matches / Competition browser view */}
              {currentView === 'matches' ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-[#94A3B8]">
                    Browse verified United Kingdom & international football competitions. Tap any league to filter fixtures.
                  </p>
                  <div className="space-y-2">
                    {Object.entries(groupedLeagues).map(([country, { countryCode, items }]) => (
                      <div
                        key={country}
                        className="bg-[#1E222A] border border-[#2A2E35] rounded-[2px] overflow-hidden"
                      >
                        <div className="px-3 py-1.5 bg-[#161920] border-b border-[#2A2E35] flex items-center gap-2 text-[11px] font-bold text-[#F8F9FA] uppercase tracking-wider">
                          <CountryBadge country={country} countryCode={countryCode} size={13} />
                          <span>{country}</span>
                        </div>
                        <div className="divide-y divide-[#2A2E35]">
                          {items.map((item) => {
                            const count = matches.filter(
                              (m) =>
                                m.leagueId === item.id &&
                                (m.status === 'LIVE' || m.status === 'IN_PLAY' || m.status === 'SCHEDULED' || m.status === 'UPCOMING')
                            ).length;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSelectedLeague(item.id);
                                  setCurrentView('home');
                                }}
                                className="w-full px-3 py-2 text-left flex items-center justify-between text-[14px] text-[#F8F9FA] hover:bg-[#242933] transition-colors"
                              >
                                <span className="font-bold text-[14px]">{item.name}</span>
                                <span className="flex items-center gap-1.5 text-[#94A3B8] text-[11px] tabular-nums">
                                  <span>{count} matches</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* High-Density Market Selector Tabs */}
                  <MarketTabs liveOnly={effectiveLiveOnly} setLiveOnly={setLiveOnly} />

                  {/* Match Grid / Market Matrix (High-Density Rows) */}
                  {matches.length === 0 ? (
                    <LoadingState count={4} />
                  ) : filteredMatches.length === 0 ? (
                    <EmptyState
                      icon={Trophy}
                      title="No Fixtures Available"
                      description={
                        effectiveLiveOnly
                          ? 'There are currently no live in-play matches for this selection.'
                          : 'No matches found matching your filters.'
                      }
                      action="View All Fixtures"
                      onAction={() => {
                        setSelectedLeague('ALL');
                        setLiveOnly(false);
                        setCurrentView('home');
                      }}
                    />
                  ) : (
                    <div className="divide-y divide-[#2A2E35] border border-[#2A2E35] bg-[#1E222A] rounded-[2px]">
                      {filteredMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>

        {/* Right Sticky Bet Slip Column (20% Desktop) */}
        <aside className="hidden lg:block lg:w-[20%] shrink-0 border-l border-[#2A2E35] bg-[#1E222A] p-2">
          <div className="sticky top-12">
            <BetSlipPanel />
          </div>
        </aside>
      </div>

      {/* ── Mobile Floating Betslip Badge Button ── */}
      {betslip.length > 0 && (
        <button
          type="button"
          onClick={() => setShowBetslip(!showBetslip)}
          className="fixed bottom-14 right-3 z-30 lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-[2px] bg-[#FFC107] text-[#111418] border border-[#2A2E35] font-bold active:scale-95 transition-transform"
          aria-label={`Open betslip, ${betslip.length} selections`}
        >
          <ShoppingCart className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          <span className="text-[12px] uppercase tracking-wider font-bold">Betslip</span>
          <span className="text-[11px] font-mono tabular-nums font-bold bg-[#111418] text-[#FFC107] px-1.5 py-0.2 rounded-[2px]">
            {betslip.length}
          </span>
        </button>
      )}

      {/* ── Mobile Betslip Bottom Sheet Modal ── */}
      {showBetslip && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          <div
            className="absolute inset-0 bg-black/75"
            onClick={() => setShowBetslip(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto bg-[#1E222A] border-t border-[#2A2E35] pb-16 animate-slide-up">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#2A2E35]" />
            </div>
            <div className="p-2.5">
              <BetSlipPanel />
            </div>
          </div>
        </div>
      )}

      {/* ── Sportsbook Footer ── */}
      <footer className="mt-auto border-t border-[#2A2E35] bg-[#1E222A] py-3 px-4 text-center space-y-1 pb-20 lg:pb-3 relative z-10">
        <p className="text-[12px] font-bold text-[#F8F9FA] flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#00875A]" />
          <span>18+ Please gamble responsibly • United Kingdom</span>
        </p>
        <p className="text-[11px] text-[#94A3B8] max-w-md mx-auto">
          RolalBet Sportsbook UK — Licensed United Kingdom Football Coverage Engine & Double-Entry Ledger.
        </p>
      </footer>

      {/* ── Mobile Fixed Bottom Bar ── */}
      <BottomNav />
    </div>
  );
}

// ---------------------------------------------------------------------------
// App Entry (Checks UK Geo-Protection on the main Sportsbook site)
// ---------------------------------------------------------------------------
export default function App() {
  const [accessState, setAccessState] = useState({
    checking: true,
    allowed: true,
    ukOnlyEnabled: true,
    countryCode: '',
    countryName: '',
  });

  const checkLocationAccess = useCallback(async () => {
    try {
      const res = await fetch('/api/access-check');
      if (res.ok) {
        const data = await res.json();
        setAccessState({
          checking: false,
          allowed: Boolean(data.allowed),
          ukOnlyEnabled: Boolean(data.ukOnlyEnabled),
          countryCode: data.countryCode || '',
          countryName: data.countryName || '',
        });
        return;
      }
    } catch (err) {
      // Fallback if server is still starting
    }
    setAccessState((prev) => ({ ...prev, checking: false }));
  }, []);

  useEffect(() => {
    checkLocationAccess();
    const interval = setInterval(checkLocationAccess, 3000);
    return () => clearInterval(interval);
  }, [checkLocationAccess]);

  // While initial geo-check is running
  if (accessState.checking) {
    return (
      <div className="min-h-screen bg-[#111418] text-[#94A3B8] flex items-center justify-center text-[12px] font-sans">
        Verifying region access...
      </div>
    );
  }

  // If UK-Only Protection is ON and visitor is not in the UK -> show simple Materialistic Blocked Page
  if (!accessState.allowed) {
    return (
      <ErrorBoundary>
        <BlockedLocationPage
          countryName={accessState.countryName}
          countryCode={accessState.countryCode}
          onRetry={checkLocationAccess}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <BettingProvider>
        <Dashboard />
      </BettingProvider>
    </ErrorBoundary>
  );
}
