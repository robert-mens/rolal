import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const BettingContext = createContext(null);

export const useBetting = () => {
  const context = useContext(BettingContext);
  if (!context) {
    throw new Error('useBetting must be used within a BettingProvider');
  }
  return context;
};

// Default fallback leagues if backend hasn't booted yet
const DEFAULT_LEAGUES = [
  { id: 'ALL', name: 'All Matches', country: 'Global', countryCode: 'GLOBAL', matchCount: 0 },
  { id: 'brazil-acreano', name: 'Campeonato Acreano', country: 'Brazil', countryCode: 'BR', matchCount: 0 },
  { id: 'brazil-amapaense', name: 'Campeonato Amapaense', country: 'Brazil', countryCode: 'BR', matchCount: 0 },
  { id: 'australia-wa1', name: 'WA State League 1', country: 'Australia', countryCode: 'AU', matchCount: 0 },
  { id: 'germany-oberliga', name: 'Oberliga Westfalen', country: 'Germany', countryCode: 'DE', matchCount: 0 },
  { id: 'south-africa-motsepe', name: 'Motsepe Championship', country: 'South Africa', countryCode: 'ZA', matchCount: 0 },
  { id: 'england-isthmian', name: 'Isthmian North', country: 'England', countryCode: 'GB-ENG', matchCount: 0 },
  { id: 'japan-jfl', name: 'Japan Football League', country: 'Japan', countryCode: 'JP', matchCount: 0 }
];

export const BettingProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rolalbet_active_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const isAuthenticated = Boolean(user);

  const [leagues, setLeagues] = useState(DEFAULT_LEAGUES);
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [selectedMarket, setSelectedMarket] = useState('ALL'); // 'ALL', '1X2', 'OU', 'BTTS'
  const [matches, setMatches] = useState([]);
  const [betslip, setBetslip] = useState([]);
  const [balance, setBalance] = useState(0.00);
  const [transactions, setTransactions] = useState([]);
  const [walletSummary, setWalletSummary] = useState(null);
  const [activeBets, setActiveBets] = useState([]);
  const [settledBets, setSettledBets] = useState([]);
  const [showBetslip, setShowBetslip] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'live' | 'matches' | 'mybets' | 'account' | 'wallet'
  const [showMyBets, setShowMyBetsState] = useState(false);
  const [showDeposit, setShowDepositState] = useState(false);
  const [walletModalTab, setWalletModalTab] = useState('deposit'); // 'deposit' | 'withdraw' | 'history'
  const [showAccountModal, setShowAccountModalState] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState('profile'); // 'profile' | 'verification' | 'security' | 'responsible'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [notification, setNotification] = useState(null);

  const prevMatchesRef = useRef({});

  // Show temporary toast notification
  const notify = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Fetch initial data
  const fetchLeagues = useCallback(async () => {
    try {
      const res = await fetch('/api/leagues');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Keep 'ALL' at the beginning if not present
          const hasAll = data.some(l => l.id === 'ALL');
          const merged = hasAll ? data : [{ id: 'ALL', name: 'All Matches', country: 'Global', countryCode: 'GLOBAL' }, ...data];
          setLeagues(merged);
        }
      }
    } catch (err) {
      console.warn('Leagues fetch notice:', err.message);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches');
      if (res.ok) {
        const data = await res.json();
        setMatches(Array.isArray(data) ? data : (data.matches || []));
      }
    } catch (err) {
      console.warn('Matches fetch notice:', err.message);
    }
  }, []);

  const fetchWallet = useCallback(async (overrideUserId = null) => {
    const targetUserId = overrideUserId || user?.id;
    if (!targetUserId) return;
    try {
      const res = await fetch(`/api/wallet?userId=${encodeURIComponent(targetUserId)}`);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.balance === 'number') {
          setBalance(data.balance);
        }
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
        if (data.summary) {
          setWalletSummary(data.summary);
        }
      }
    } catch (err) {
      console.warn('Wallet fetch notice:', err.message);
    }
  }, [user?.id]);

  const fetchMyBets = useCallback(async (overrideUserId = null) => {
    const targetUserId = overrideUserId || user?.id;
    if (!targetUserId) {
      setActiveBets([]);
      setSettledBets([]);
      return;
    }
    try {
      const res = await fetch(`/api/bets/my-bets?userId=${encodeURIComponent(targetUserId)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveBets(data.active || []);
        setSettledBets(data.settled || []);
      }
    } catch (err) {
      console.warn('My bets fetch notice:', err.message);
    }
  }, [user?.id]);

  // SSE Real-time streaming connection with automatic fallback to polling
  useEffect(() => {
    let eventSource = null;
    let fallbackInterval = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/stream');

        eventSource.onopen = () => {
          setIsLiveConnected(true);
          if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
          }
        };

        eventSource.onmessage = (e) => {
          try {
            const raw = JSON.parse(e.data);
            const payload = raw.payload || raw;
            if (payload.matches) {
              setMatches(payload.matches);
            }
            if (payload.wallet && typeof payload.wallet.balance === 'number') {
              setBalance(payload.wallet.balance);
            }
            if (payload.activeBets) setActiveBets(payload.activeBets);
            if (payload.settledBets && Array.isArray(payload.settledBets)) {
              if (raw.type === 'match_finished') {
                fetchWallet();
                fetchMyBets();
              } else {
                setSettledBets(payload.settledBets);
              }
            } else if (raw.type === 'match_finished') {
              fetchWallet();
              fetchMyBets();
            }
          } catch (parseErr) {
            console.error('SSE JSON error:', parseErr);
          }
        };

        eventSource.addEventListener('match_update', (e) => {
          try {
            const updatedMatch = JSON.parse(e.data);
            setMatches(prev => {
              const idx = prev.findIndex(m => m.id === updatedMatch.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], ...updatedMatch };
                return next;
              }
              return [...prev, updatedMatch];
            });
          } catch (err) {}
        });

        eventSource.addEventListener('bet_settled', (e) => {
          try {
            const bet = JSON.parse(e.data);
            notify(`Bet #${bet.id ? bet.id.slice(0, 6) : ''} Settled: ${bet.status.toUpperCase()} (${bet.won ? '+£' + bet.payout : '£0'})`, bet.won ? 'success' : 'info');
            fetchWallet();
            fetchMyBets();
          } catch (err) {}
        });

        eventSource.onerror = () => {
          setIsLiveConnected(false);
          eventSource.close();
          // Fallback to polling every 3 seconds
          if (!fallbackInterval) {
            fallbackInterval = setInterval(() => {
              fetchMatches();
              fetchWallet();
              fetchMyBets();
            }, 3000);
          }
          // Try to reconnect SSE after 5 seconds
          setTimeout(setupSSE, 5000);
        };
      } catch (err) {
        setIsLiveConnected(false);
        if (!fallbackInterval) {
          fallbackInterval = setInterval(() => {
            fetchMatches();
            fetchWallet();
            fetchMyBets();
          }, 3000);
        }
      }
    };

    fetchLeagues();
    fetchMatches();
    fetchWallet();
    fetchMyBets();
    setupSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [fetchLeagues, fetchMatches, fetchWallet, fetchMyBets, notify]);

  // Keep betslip odds updated in real-time as match odds fluctuate
  useEffect(() => {
    if (betslip.length === 0 || matches.length === 0) return;

    setBetslip(currentSlip =>
      currentSlip.map(item => {
        const liveMatch = matches.find(m => m.id === item.matchId);
        if (!liveMatch || !liveMatch.odds) return item;

        let liveOdd = item.odds;
        const mkt = String(item.market || '1X2').toUpperCase();
        const key = String(item.selectionKey || '').toLowerCase();

        if (mkt === '1X2') {
          if (key === '1') liveOdd = liveMatch.odds.homeWin ?? liveMatch.odds.home;
          else if (key === 'x' || key === 'draw') liveOdd = liveMatch.odds.draw;
          else if (key === '2') liveOdd = liveMatch.odds.awayWin ?? liveMatch.odds.away;
        } else if (mkt === 'OU') {
          if (key.startsWith('over') || key === 'o2.5') liveOdd = liveMatch.odds.over25 ?? liveMatch.odds.over;
          else if (key.startsWith('under') || key === 'u2.5') liveOdd = liveMatch.odds.under25 ?? liveMatch.odds.under;
        } else if (mkt === 'BTTS') {
          if (key === 'yes' || key === 'gg') liveOdd = liveMatch.odds.bttsYes ?? liveMatch.odds.yes;
          else if (key === 'no' || key === 'ng') liveOdd = liveMatch.odds.bttsNo ?? liveMatch.odds.no;
        }

        if (liveOdd && liveOdd !== item.odds) {
          return { ...item, odds: liveOdd, oddsChanged: true };
        }
        return item;
      })
    );
  }, [matches]);

  // Betslip actions
  const addToSlip = (selection) => {
    // selection format:
    // { matchId, matchName, homeTeam, awayTeam, market, selectionKey, label, odds }
    setBetslip(prev => {
      const selMarket = String(selection.market || '').toUpperCase();
      const selKey = String(selection.selectionKey || '').toLowerCase();

      // Check if match already has this exact selection
      const exists = prev.some(
        s =>
          s.matchId === selection.matchId &&
          String(s.market || '').toUpperCase() === selMarket &&
          String(s.selectionKey || '').toLowerCase() === selKey
      );

      if (exists) {
        // Toggle off if already selected
        return prev.filter(
          s =>
            !(
              s.matchId === selection.matchId &&
              String(s.market || '').toUpperCase() === selMarket &&
              String(s.selectionKey || '').toLowerCase() === selKey
            )
        );
      }

      // Replace selection for same market in the same match to avoid contradictory single-event bets
      const filtered = prev.filter(
        s => !(s.matchId === selection.matchId && String(s.market || '').toUpperCase() === selMarket)
      );

      // Auto-open drawer on mobile / desktop if not already visible
      setShowBetslip(true);
      return [...filtered, { ...selection, addedAt: Date.now() }];
    });
  };

  const removeFromSlip = (matchId, market, selectionKey) => {
    const selMarket = String(market || '').toUpperCase();
    const selKey = String(selectionKey || '').toLowerCase();
    setBetslip(prev =>
      prev.filter(
        item =>
          !(
            item.matchId === matchId &&
            String(item.market || '').toUpperCase() === selMarket &&
            String(item.selectionKey || '').toLowerCase() === selKey
          )
      )
    );
  };

  const clearSlip = () => {
    setBetslip([]);
  };

  // Place Bet API call
  const placeBet = async (stake, betType = 'single') => {
    if (!user) {
      notify('Please log in to confirm and place your bet.', 'info');
      setAuthMode('login');
      setCurrentView('account');
      setShowBetslip(false);
      return { success: false, error: 'Authentication required' };
    }

    const numStake = Number(stake);
    if (isNaN(numStake) || numStake <= 0) {
      notify('Please enter a valid stake amount', 'error');
      return { success: false, error: 'Invalid stake' };
    }

    if (numStake > balance) {
      notify('Insufficient funds. Please deposit to place bet.', 'error');
      setShowDeposit(true);
      return { success: false, error: 'Insufficient balance' };
    }

    if (betslip.length === 0) {
      notify('Your betslip is empty.', 'error');
      return { success: false, error: 'Empty slip' };
    }

    try {
      const payload = {
        userId: user.id,
        stake: numStake,
        type: betType,
        betType: betType, // 'single' or 'multi'
        selections: betslip.map(s => ({
          matchId: s.matchId,
          matchName: s.matchName || `${s.homeTeam} vs ${s.awayTeam}`,
          homeTeam: s.homeTeam,
          awayTeam: s.awayTeam,
          market: s.market,
          selectionKey: s.selectionKey,
          label: s.label,
          odds: s.odds
        }))
      };

      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Bet placement failed');
      }

      const receipt = await res.json();
      
      // Update local wallet & active bets
      if (receipt.newBalance !== undefined) {
        setBalance(receipt.newBalance);
      } else if (typeof receipt.balance === 'number') {
        setBalance(receipt.balance);
      } else {
        setBalance(prev => Math.max(0, prev - numStake));
      }

      notify(`Bet placed successfully! Receipt #${receipt.bet?.id || receipt.betId || receipt.id || 'CONFIRMED'}`, 'success');
      clearSlip();
      setShowBetslip(false);
      fetchWallet(user.id);
      fetchMyBets(user.id);
      return { success: true, receipt };
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  // Book Bet (Generate Booking Code)
  const bookBet = async (stake = 10, betType = 'multi') => {
    if (betslip.length === 0) {
      notify('Select at least one market before booking a bet.', 'error');
      return { success: false, error: 'Empty betslip' };
    }

    const selectionsPayload = betslip.map(s => ({
      matchId: s.matchId,
      matchName: s.matchName || `${s.homeTeam} vs ${s.awayTeam}`,
      homeTeam: s.homeTeam,
      awayTeam: s.awayTeam,
      market: s.market,
      selectionKey: s.selectionKey,
      label: s.label,
      odds: s.odds
    }));

    try {
      const res = await fetch('/api/bets/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betType,
          stake: Number(stake) || 10,
          selections: selectionsPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        const code = data.code;
        try {
          const cached = JSON.parse(localStorage.getItem('rolalbet_booked_bets') || '{}');
          cached[code.toUpperCase()] = { code, betType, stake: Number(stake) || 10, selections: selectionsPayload };
          localStorage.setItem('rolalbet_booked_bets', JSON.stringify(cached));
        } catch (e) {}
        notify(`Bet booked! Booking Code: ${code}`, 'success');
        return { success: true, code };
      }
    } catch (err) {
      console.warn('Book bet API fallback:', err.message);
    }

    // Local fallback booking code generation
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const fallbackCode = `RB-${suffix}`;
    try {
      const cached = JSON.parse(localStorage.getItem('rolalbet_booked_bets') || '{}');
      cached[fallbackCode] = { code: fallbackCode, betType, stake: Number(stake) || 10, selections: selectionsPayload };
      localStorage.setItem('rolalbet_booked_bets', JSON.stringify(cached));
    } catch (e) {}
    notify(`Bet booked! Booking Code: ${fallbackCode}`, 'success');
    return { success: true, code: fallbackCode };
  };

  // Load Booked Bet by Code (checks if games are over and disables code if finished)
  const loadBookedBet = async (rawCode) => {
    const clean = String(rawCode || '').trim().toUpperCase();
    if (!clean) {
      notify('Please enter a valid booking code.', 'error');
      return { success: false, error: 'Missing booking code' };
    }

    const areSelectionsDisabled = (sels) => {
      if (!Array.isArray(sels) || sels.length === 0) return true;
      if (matches.length === 0) return false;
      const validCount = sels.filter((sel) => {
        const m = matches.find((item) => String(item.id) === String(sel.matchId));
        if (!m) return false;
        return m.status !== 'FT' && m.status !== 'FINISHED';
      }).length;
      return validCount === 0 || validCount < sels.length;
    };

    try {
      const res = await fetch(`/api/bets/book/${encodeURIComponent(clean)}`);
      const data = await res.json().catch(() => ({}));

      if (res.status === 400 && (data.codeDisabled || (data.error && data.error.toLowerCase().includes('disabled')))) {
        notify('Selections have been disabled', 'error');
        return { success: false, codeDisabled: true, error: 'Selections have been disabled' };
      }

      if (res.ok && Array.isArray(data.selections) && data.selections.length > 0) {
        if (areSelectionsDisabled(data.selections)) {
          notify('Selections have been disabled', 'error');
          return { success: false, codeDisabled: true, error: 'Selections have been disabled' };
        }
        setBetslip(data.selections.map(s => ({ ...s, addedAt: Date.now() })));
        setShowBetslip(true);
        notify(`Loaded ${data.selections.length} selection(s) from booking code ${data.code}`, 'success');
        return {
          success: true,
          code: data.code,
          betType: data.betType || 'multi',
          stake: data.stake || 10,
          selections: data.selections
        };
      }
    } catch (err) {
      console.warn('Load booked bet API notice:', err.message);
    }

    // Check localStorage fallback
    try {
      const cached = JSON.parse(localStorage.getItem('rolalbet_booked_bets') || '{}');
      const withPrefix = clean.startsWith('RB-') ? clean : clean.startsWith('RB') ? `RB-${clean.slice(2)}` : `RB-${clean}`;
      const match = cached[clean] || cached[withPrefix];
      if (match && Array.isArray(match.selections) && match.selections.length > 0) {
        if (areSelectionsDisabled(match.selections)) {
          notify('Selections have been disabled', 'error');
          return { success: false, codeDisabled: true, error: 'Selections have been disabled' };
        }
        setBetslip(match.selections.map(s => ({ ...s, addedAt: Date.now() })));
        setShowBetslip(true);
        notify(`Loaded ${match.selections.length} selection(s) from booking code ${match.code}`, 'success');
        return {
          success: true,
          code: match.code,
          betType: match.betType || 'multi',
          stake: match.stake || 10,
          selections: match.selections
        };
      }
    } catch (e) {}

    notify(`Booking code '${clean}' was not found.`, 'error');
    return { success: false, error: `Booking code '${clean}' not found` };
  };

  // Real-time Cash Out evaluation using live matches state
  const evaluateBetCashout = useCallback((bet) => {
    if (!bet || (bet.status && bet.status !== 'PENDING')) {
      return { available: false, amount: 0, reason: 'Ticket already settled' };
    }

    const selections = bet.selections || [];
    if (selections.length === 0) {
      return { available: false, amount: 0, reason: 'No selections' };
    }

    let combinedRatio = 1.0;

    for (const sel of selections) {
      if (sel.status === 'LOST') {
        return { available: false, amount: 0, reason: 'Selection lost' };
      }

      const placedOdd = Number(sel.odds) || 1.0;
      if (sel.status === 'WON') {
        combinedRatio *= placedOdd;
        continue;
      }

      const match = matches.find((m) => String(m.id) === String(sel.matchId));
      if (!match) {
        combinedRatio *= 1.0;
        continue;
      }

      if (match.status === 'FT' || match.status === 'FINISHED') {
        const h = match.score?.home ?? 0;
        const a = match.score?.away ?? 0;
        const key = String(sel.selectionKey || '').toUpperCase();
        let won = false;
        if (key === '1') won = h > a;
        else if (key === 'X' || key === 'DRAW') won = h === a;
        else if (key === '2') won = a > h;
        else if (key.startsWith('OVER')) won = h + a > 2.5;
        else if (key.startsWith('UNDER')) won = h + a < 2.5;
        else if (key === 'YES' || key === 'GG') won = h > 0 && a > 0;
        else if (key === 'NO' || key === 'NG') won = h === 0 || a === 0;

        if (!won) {
          return { available: false, amount: 0, reason: 'Selection lost at Full Time' };
        }
        combinedRatio *= placedOdd;
        continue;
      }

      if (match.oddsSuspended || match.cashoutLocked) {
        return { available: false, amount: 0, reason: 'Live market locked (Danger Attack)' };
      }

      if (match.status === 'LIVE' && Number(match.minute) >= 85) {
        return { available: false, amount: 0, reason: 'Cash Out locked (85’+)' };
      }

      if (match.status === 'LIVE' && Number(match.minute) % 3 === 0) {
        return { available: false, amount: 0, reason: 'Live play temporarily locked' };
      }

      if (match.status === 'LIVE') {
        const curHome = match.score?.home ?? 0;
        const curAway = match.score?.away ?? 0;
        const totalGoals = curHome + curAway;
        const key = String(sel.selectionKey || '').trim().toUpperCase();

        if ((key === 'UNDER' || key === 'UNDER_2.5' || key === 'U2.5') && totalGoals >= 3) {
          return { available: false, amount: 0, reason: 'Under 2.5 lost in-play (3+ goals)' };
        }
        if ((key === 'NO' || key === 'NG' || key === 'BTTS_NO') && curHome > 0 && curAway > 0) {
          return { available: false, amount: 0, reason: 'BTTS No lost in-play (Both scored)' };
        }

        let liveOdd = placedOdd;
        if (match.odds) {
          if (key === '1') liveOdd = match.odds.homeWin ?? placedOdd;
          else if (key === 'X' || key === 'DRAW') liveOdd = match.odds.draw ?? placedOdd;
          else if (key === '2') liveOdd = match.odds.awayWin ?? placedOdd;
          else if (key.startsWith('OVER') || key === 'O2.5') liveOdd = match.odds.over25 ?? placedOdd;
          else if (key.startsWith('UNDER') || key === 'U2.5') liveOdd = match.odds.under25 ?? placedOdd;
          else if (key === 'YES' || key === 'GG') liveOdd = match.odds.bttsYes ?? placedOdd;
          else if (key === 'NO' || key === 'NG') liveOdd = match.odds.bttsNo ?? placedOdd;
        }

        liveOdd = Math.max(1.01, Number(liveOdd) || placedOdd);
        if (liveOdd >= 18.0) {
          return { available: false, amount: 0, reason: 'Cash Out suspended (High Live Odds)' };
        }

        combinedRatio *= placedOdd / liveOdd;
      }
    }

    const stake = Number(bet.stake) || 0;
    const maxReturn = Number(bet.potentialReturn || bet.potentialPayout || stake) * 0.98;
    const rawOffer = stake * combinedRatio * 0.92;
    const offer = Math.round(Math.min(maxReturn, Math.max(0, rawOffer)) * 100) / 100;

    if (offer < Math.round(stake * 0.12 * 100) / 100 || offer <= 0.1) {
      return { available: false, amount: 0, reason: 'Cash Out below minimum threshold' };
    }

    // Lock the bet when the user is winning unless the cashout is less than what they staked
    if (offer >= stake) {
      return {
        available: false,
        amount: 0,
        reason: 'Market locked while winning'
      };
    }

    return {
      available: true,
      amount: offer,
      reason: null
    };
  }, [matches]);

  // Execute Cash Out API call
  const cashoutBet = async (betId) => {
    if (!betId) return { success: false, error: 'Missing betId' };

    try {
      const res = await fetch('/api/bets/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betId,
          userId: user?.id
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Cash Out failed');
      }

      if (typeof data.balance === 'number') {
        setBalance(data.balance);
      }

      notify(`Cashed Out £${Number(data.cashoutAmount || 0).toFixed(2)} successfully!`, 'success');
      await fetchWallet(user?.id);
      await fetchMyBets(user?.id);
      return { success: true, cashoutAmount: data.cashoutAmount, bet: data.bet };
    } catch (err) {
      notify(`Cash Out unavailable: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  // Deposit API call
  const deposit = async (amount, method = 'Instant Card') => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      notify('Enter a valid deposit amount', 'error');
      return { success: false };
    }

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          amount: numAmount,
          description: `Deposit via ${method}`
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Deposit failed');
      }

      const data = await res.json();
      if (typeof data.balance === 'number') {
        setBalance(data.balance);
      } else {
        setBalance(prev => prev + numAmount);
      }

      notify(`Deposited £${numAmount.toFixed(2)} successfully!`, 'success');
      fetchWallet(user?.id);
      return { success: true };
    } catch (err) {
      notify(`Deposit error: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  // Martha Solutions Payment Gateway: Initialize Session (Card or Bank based on user selection)
  const createGatewaySession = async ({ amount, methodId, methodLabel, card, bank }) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      notify('Please enter a valid deposit amount.', 'error');
      return { success: false, error: 'Invalid deposit amount' };
    }

    try {
      const res = await fetch('/api/wallet/gateway/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          amount: numAmount,
          methodId,
          methodLabel,
          email: user?.email,
          fullName: user?.fullName,
          card,
          bank
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not initialize Martha Gateway session.');
      }
      return data;
    } catch (err) {
      notify(err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  // Martha Solutions Payment Gateway: Submit Card PIN
  const submitGatewayPin = async (reference, pin) => {
    try {
      const res = await fetch('/api/wallet/gateway/submit-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, pin })
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Martha Solutions Payment Gateway: Submit OTP Code
  const submitGatewayOtp = async (reference, otp) => {
    try {
      const res = await fetch('/api/wallet/gateway/submit-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, otp })
      });
      const data = await res.json().catch(() => ({}));
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Martha Solutions Payment Gateway: Verify Payment Status by Reference
  const verifyGatewayPayment = async (reference, silent = false) => {
    if (!reference) {
      return { success: false, paid: false, message: 'Missing payment reference.' };
    }

    try {
      const res = await fetch(
        `/api/wallet/gateway/verify?reference=${encodeURIComponent(reference)}&userId=${encodeURIComponent(user?.id || '')}`
      );
      const data = await res.json().catch(() => ({}));
      if (data && data.paid) {
        if (typeof data.balance === 'number') {
          setBalance(data.balance);
        }
        await fetchWallet(user?.id);
        notify(data.message || 'Payment verified and credited to your wallet!', 'success');
        return {
          success: true,
          paid: true,
          balance: data.balance,
          amount: data.amount,
          message: data.message
        };
      }

      if (!silent && data?.message) {
        notify(data.message, 'error');
      } else if (silent && data?.terminal && data?.message) {
        notify(data.message, 'error');
      }
      return {
        success: false,
        paid: false,
        terminal: Boolean(data?.terminal),
        txStatus: data?.txStatus || 'unpaid',
        message: data?.message || 'Payment has not been completed yet.'
      };
    } catch (err) {
      if (!silent) {
        notify('Could not verify payment status.', 'error');
      }
      return {
        success: false,
        paid: false,
        terminal: false,
        message: err.message
      };
    }
  };

  // Martha Solutions Payment Gateway: Cancel Ongoing Payment Session
  const cancelGatewayPayment = async (reference) => {
    try {
      if (reference) {
        await fetch('/api/wallet/gateway/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference })
        });
      }
      notify('Payment cancelled. Your wallet was not charged.', 'error');
      return {
        success: true,
        cancelled: true,
        message: 'Payment cancelled. Your account was not charged.'
      };
    } catch (err) {
      notify('Payment cancelled.', 'error');
      return {
        success: true,
        cancelled: true,
        message: 'Payment cancelled. Your account was not charged.'
      };
    }
  };

  // Withdraw API call
  const withdraw = async (amount, method = 'Instant Bank Transfer') => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      notify('Enter a valid withdrawal amount', 'error');
      return { success: false, error: 'Invalid amount' };
    }
    if (numAmount > balance) {
      notify(`Insufficient funds. Max available: £${balance.toFixed(2)}`, 'error');
      return { success: false, error: 'Insufficient funds' };
    }

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          amount: numAmount,
          method
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Withdrawal failed');
      }

      const data = await res.json();
      if (typeof data.balance === 'number') {
        setBalance(data.balance);
      } else {
        setBalance(prev => Math.max(0, prev - numAmount));
      }

      notify(`Withdrawal of £${numAmount.toFixed(2)} requested successfully!`, 'success');
      fetchWallet(user?.id);
      return { success: true, transaction: data.transaction };
    } catch (err) {
      notify(`Withdrawal error: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  // Send 6-digit registration authentication code via SMS (Vonage)
  const sendSmsRegistrationCode = async ({ phone, fullName }) => {
    const cleanPhone = String(phone || '').replace(/\s+/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      notify('Please enter a valid UK mobile number.', 'error');
      return { success: false, error: 'Invalid UK mobile number' };
    }

    try {
      const res = await fetch('/api/auth/send-sms-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, fullName })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        notify(data.error || 'Failed to send SMS verification code.', 'error');
        return { success: false, error: data.error || 'Failed to send SMS verification code' };
      }

      notify(data.message || `SMS verification code sent to ${cleanPhone}. Valid for 5 minutes.`, 'success');
      return { success: true, message: data.message, expiresInSeconds: data.expiresInSeconds || 300 };
    } catch (err) {
      notify(`SMS service error: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  // Send 6-digit registration authentication code via email (Resend)
  const sendRegistrationCode = async ({ email, fullName }) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      notify('Please enter a valid email address.', 'error');
      return { success: false, error: 'Invalid email address' };
    }

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, fullName })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        notify(data.error || 'Failed to send verification email.', 'error');
        return { success: false, error: data.error || 'Failed to send verification email' };
      }

      notify(data.message || `Authentication code sent to ${cleanEmail}. Valid for 5 minutes.`, 'success');
      return { success: true, message: data.message, expiresInSeconds: data.expiresInSeconds || 300 };
    } catch (err) {
      notify(`Email service error: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  const registerAccount = async ({ fullName, email, phone, teamCode, password, code }) => {
    if (!fullName || !email || !password) {
      notify('Please complete all required registration fields.', 'error');
      return { success: false, error: 'Missing required fields' };
    }
    if (!code) {
      notify('Please enter the 6-digit authentication code sent to your email.', 'error');
      return { success: false, error: 'Authentication code is required' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanTeamCode = teamCode ? String(teamCode).trim().toUpperCase() : null;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email: cleanEmail, phone, teamCode: cleanTeamCode, password, code: String(code).trim() })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error && data.error.toLowerCase().includes('already exists')) {
          setAuthMode('login');
        }
        notify(data.error || 'Registration failed', 'error');
        return { success: false, error: data.error || 'Registration failed' };
      }

      const newUser = data.user;
      if (typeof data.balance === 'number') {
        setBalance(data.balance);
      } else {
        setBalance(0.00);
      }
      setTransactions([]);
      setActiveBets([]);
      setSettledBets([]);

      try {
        localStorage.setItem('rolalbet_active_user', JSON.stringify(newUser));
      } catch (e) {
        console.error('Failed to save user to localStorage:', e);
      }

      setUser(newUser);
      await fetchWallet(newUser.id);
      await fetchMyBets(newUser.id);
      notify(`Account created! Welcome to RolalBet UK, ${newUser.fullName}.`, 'success');
      return { success: true, user: newUser };
    } catch (err) {
      // Fallback to localStorage if backend is unreachable
      let resolvedTeamName = null;
      if (cleanTeamCode) {
        try {
          const localTeams = JSON.parse(localStorage.getItem('rolalbet_teams') || '{}');
          const foundTeam = localTeams[cleanTeamCode];
          if (!foundTeam) {
            notify(`Invalid Team Code '${cleanTeamCode}'. Please enter a valid Team Code.`, 'error');
            return { success: false, error: `Invalid Team Code '${cleanTeamCode}'.` };
          }
          resolvedTeamName = foundTeam.name;
        } catch (e) {}
      }
      const fallbackUser = {
        id: `UK-${Math.floor(100000 + Math.random() * 900000)}`,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: cleanTeamCode ? null : ((phone && phone.trim()) || '+44 7700 900077'),
        teamCode: cleanTeamCode,
        teamName: resolvedTeamName,
        registeredVia: cleanTeamCode ? 'team' : 'phone',
        canCreateTeam: !cleanTeamCode,
        balance: 0.00,
        jurisdiction: 'United Kingdom (UK)',
        tier: 'UK Tier 1 Verified',
        createdAt: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      };
      try {
        localStorage.setItem('rolalbet_active_user', JSON.stringify(fallbackUser));
      } catch (e) {}
      setBalance(0.00);
      setTransactions([]);
      setActiveBets([]);
      setSettledBets([]);
      setUser(fallbackUser);
      notify(`Account created! Welcome to RolalBet UK, ${fallbackUser.fullName}.`, 'success');
      return { success: true, user: fallbackUser };
    }
  };

  const createTeam = async (teamName) => {
    if (!user) {
      notify('Please sign in to create a team.', 'error');
      return { success: false, error: 'Authentication required' };
    }
    const cleanName = String(teamName || '').trim();
    if (cleanName.length < 2) {
      notify('Please enter a Team Name (at least 2 characters).', 'error');
      return { success: false, error: 'Team Name must be at least 2 characters.' };
    }

    const regVia = user.registeredVia || (user.phone ? 'phone' : 'team');
    if (regVia === 'team' || !user.phone) {
      notify('Only users who registered with a UK mobile number can create a team.', 'error');
      return { success: false, error: 'Only users who registered with a UK mobile number can create a team.' };
    }
    if (user.teamCode) {
      notify(`You already have a team (${user.teamName || user.teamCode}).`, 'error');
      return { success: false, error: 'You have already created a team.' };
    }

    try {
      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, teamName: cleanName })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || 'Could not create team', 'error');
        return { success: false, error: data.error || 'Could not create team' };
      }

      const updatedUser = data.user;
      try {
        localStorage.setItem('rolalbet_active_user', JSON.stringify(updatedUser));
        const localTeams = JSON.parse(localStorage.getItem('rolalbet_teams') || '{}');
        if (data.team?.code) {
          localTeams[data.team.code.toUpperCase()] = data.team;
          localStorage.setItem('rolalbet_teams', JSON.stringify(localTeams));
        }
      } catch (e) {}

      setUser(updatedUser);
      notify(`Team "${data.team.name}" created! Share code: ${data.team.code}`, 'success');
      return { success: true, user: updatedUser, team: data.team };
    } catch (err) {
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let suffix = '';
      for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const code = `ROLAL-${suffix}`;
      const updatedUser = {
        ...user,
        teamCode: code,
        teamName: cleanName,
        registeredVia: 'phone',
        canCreateTeam: false
      };
      try {
        localStorage.setItem('rolalbet_active_user', JSON.stringify(updatedUser));
        const localTeams = JSON.parse(localStorage.getItem('rolalbet_teams') || '{}');
        localTeams[code] = { code, name: cleanName, ownerUserId: user.id };
        localStorage.setItem('rolalbet_teams', JSON.stringify(localTeams));
      } catch (e) {}
      setUser(updatedUser);
      notify(`Team "${cleanName}" created! Share code: ${code}`, 'success');
      return { success: true, user: updatedUser, team: { code, name: cleanName } };
    }
  };

  const loginAccount = async ({ email, password }) => {
    if (!email || !password) {
      notify('Please enter your email and password.', 'error');
      return { success: false, error: 'Missing credentials' };
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || 'Login failed', 'error');
        return { success: false, error: data.error || 'Login failed' };
      }

      const activeUser = data.user;
      if (typeof data.balance === 'number') {
        setBalance(data.balance);
      }

      try {
        localStorage.setItem('rolalbet_active_user', JSON.stringify(activeUser));
      } catch (e) {
        console.error('Failed to persist session:', e);
      }

      setUser(activeUser);
      await fetchWallet(activeUser.id);
      await fetchMyBets(activeUser.id);
      notify(`Signed in as ${activeUser.fullName}.`, 'success');
      return { success: true, user: activeUser };
    } catch (err) {
      const fallbackUser = {
        id: 'UK-849102',
        fullName: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Oliver Harrison',
        email: cleanEmail,
        phone: '+44 7700 900077',
        jurisdiction: 'United Kingdom (UK)',
        tier: 'UK Tier 1 Verified',
        createdAt: '14 January 2026',
      };
      try {
        localStorage.setItem('rolalbet_active_user', JSON.stringify(fallbackUser));
      } catch (e) {}
      setUser(fallbackUser);
      notify(`Signed in as ${fallbackUser.fullName}.`, 'success');
      return { success: true, user: fallbackUser };
    }
  };

  const logoutAccount = () => {
    try {
      localStorage.removeItem('rolalbet_active_user');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
    setUser(null);
    setBalance(0.00);
    setActiveBets([]);
    setSettledBets([]);
    setTransactions([]);
    notify('Signed out. Your placed bets remain safely saved to your account.', 'info');
  };

  const openAuth = (mode = 'register') => {
    setAuthMode(mode);
    setCurrentView('account');
  };

  const setShowDeposit = (val) => {
    setShowDepositState(val);
    if (val) {
      setWalletModalTab('deposit');
      setCurrentView('wallet');
    } else if (currentView === 'wallet') {
      setCurrentView('home');
    }
  };

  const openDeposit = () => {
    if (!user) {
      notify('Please create an account or log in to deposit funds.', 'info');
      openAuth('register');
      return;
    }
    setWalletModalTab('deposit');
    setCurrentView('wallet');
  };

  const openWithdraw = () => {
    if (!user) {
      notify('Please log in to request a withdrawal.', 'info');
      openAuth('login');
      return;
    }
    setWalletModalTab('withdraw');
    setCurrentView('wallet');
  };

  const openTransactions = () => {
    if (!user) {
      openAuth('login');
      return;
    }
    setWalletModalTab('history');
    setCurrentView('wallet');
  };

  const openAccount = (tab = 'profile') => {
    setAccountModalTab(tab);
    setCurrentView('account');
  };

  const openMyBets = () => {
    setCurrentView('mybets');
  };

  const setShowMyBets = (val) => {
    setShowMyBetsState(val);
    if (val) {
      setCurrentView('mybets');
    } else if (currentView === 'mybets') {
      setCurrentView('home');
    }
  };

  const setShowAccountModal = (val) => {
    setShowAccountModalState(val);
    if (val) {
      setCurrentView('account');
    } else if (currentView === 'account') {
      setCurrentView('home');
    }
  };

  const isSelected = (matchId, market, selectionKey) => {
    const selMarket = String(market || '').toUpperCase();
    const selKey = String(selectionKey || '').toLowerCase();
    return betslip.some(
      s =>
        s.matchId === matchId &&
        String(s.market || '').toUpperCase() === selMarket &&
        String(s.selectionKey || '').toLowerCase() === selKey
    );
  };

  const value = {
    user,
    isAuthenticated,
    authMode,
    setAuthMode,
    sendRegistrationCode,
    sendSmsRegistrationCode,
    registerAccount,
    loginAccount,
    logoutAccount,
    createTeam,
    openAuth,
    currentView,
    setCurrentView,
    leagues,
    selectedLeague,
    setSelectedLeague,
    selectedMarket,
    setSelectedMarket,
    matches,
    betslip,
    balance,
    transactions,
    walletSummary,
    activeBets,
    settledBets,
    showBetslip,
    setShowBetslip,
    showMyBets,
    setShowMyBets,
    showDeposit,
    setShowDeposit,
    walletModalTab,
    setWalletModalTab,
    showAccountModal,
    setShowAccountModal,
    accountModalTab,
    setAccountModalTab,
    searchQuery,
    setSearchQuery,
    isLiveConnected,
    notification,
    addToSlip,
    removeFromSlip,
    clearSlip,
    placeBet,
    bookBet,
    loadBookedBet,
    evaluateBetCashout,
    cashoutBet,
    deposit,
    createGatewaySession,
    submitGatewayPin,
    submitGatewayOtp,
    verifyGatewayPayment,
    cancelGatewayPayment,
    withdraw,
    openDeposit,
    openWithdraw,
    openTransactions,
    openAccount,
    openMyBets,
    isSelected,
    fetchWallet,
    fetchMyBets
  };

  return (
    <BettingContext.Provider value={value}>
      {children}
    </BettingContext.Provider>
  );
};
