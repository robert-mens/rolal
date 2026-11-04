/**
 * Wallet Ledger & Financial Operations Service
 * 
 * Handles double-entry ledger style wallet balance, deposits, withdrawals,
 * bet placement validation, accumulator math, and automated settlement.
 * Backed by Aiven PostgreSQL persistence.
 */

const db = require('./db');

class WalletLedger {
  /**
   * @param {number} [initialBalance=0.00] - Initial balance in GBP (£)
   * @param {string} [currency='GBP'] - Currency symbol / code
   */
  constructor(initialBalance = 0.00, currency = 'GBP') {
    this.currency = currency;
    this.balance = this._round2(initialBalance);
    this.activeUserId = 'UK-849102';
    this.transactions = [];
    this.bets = [];

    // Record initial funding transaction if positive
    if (this.balance > 0) {
      this.transactions.push({
        id: this._generateId('tx'),
        type: 'INITIAL_DEPOSIT',
        amount: this.balance,
        balanceAfter: this.balance,
        description: 'Initial account funding credits',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Hydrate ledger state from Aiven PostgreSQL
   */
  async hydrateFromDatabase(userId = null) {
    if (userId) {
      this.activeUserId = userId;
    }
    const state = await db.loadLedgerState(this.activeUserId);
    if (state) {
      if (typeof state.balance === 'number') {
        this.balance = this._round2(state.balance);
      }
      if (Array.isArray(state.transactions)) {
        this.transactions = state.transactions;
      }
      if (Array.isArray(state.bets)) {
        this.bets = state.bets;
      }
    }
  }

  /**
   * Helper to round numbers to 2 decimal places safely
   * @param {number} num 
   * @returns {number}
   */
  _round2(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Unique ID generator
   * @param {string} prefix 
   * @returns {string}
   */
  _generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Reset the ledger state to an initial balance
   * @param {number} [initialBalance=1000.00] 
   */
  reset(initialBalance = 1000.00) {
    this.balance = this._round2(initialBalance);
    this.transactions = [];
    this.bets = [];
    if (this.balance > 0) {
      this.transactions.push({
        id: this._generateId('tx'),
        type: 'INITIAL_DEPOSIT',
        amount: this.balance,
        balanceAfter: this.balance,
        description: 'Initial account funding credits',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get current wallet balance
   * @returns {number}
   */
  getBalance() {
    return this._round2(this.balance);
  }

  /**
   * Get wallet summary including currency and statistics
   * @returns {object}
   */
  getWalletSummary() {
    return {
      balance: this.getBalance(),
      currency: this.currency,
      transactionCount: this.transactions.length,
      activeBetsCount: this.getActiveBets().length,
      settledBetsCount: this.getSettledBets().length
    };
  }

  /**
   * Deposit funds into wallet
   * @param {number} amount 
   * @param {string} [description='Account deposit'] 
   * @param {string} [userId]
   * @returns {object} Transaction record
   */
  deposit(amount, description = 'Account deposit', userId = null) {
    const targetUser = userId || this.activeUserId;
    if (userId) this.activeUserId = userId;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Deposit amount must be greater than 0');
    }

    const roundedAmount = this._round2(numAmount);
    this.balance = this._round2(this.balance + roundedAmount);

    const transaction = {
      id: this._generateId('tx'),
      userId: targetUser,
      type: 'DEPOSIT',
      amount: roundedAmount,
      balanceAfter: this.balance,
      description,
      timestamp: new Date().toISOString()
    };

    this.transactions.unshift(transaction);
    db.saveTransaction(transaction, this.balance, targetUser);
    return transaction;
  }

  /**
   * Withdraw funds from wallet
   * @param {number} amount 
   * @param {string} [description='Account withdrawal'] 
   * @param {string} [userId]
   * @returns {object} Transaction record
   */
  withdraw(amount, description = 'Account withdrawal', userId = null) {
    const targetUser = userId || this.activeUserId;
    if (userId) this.activeUserId = userId;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Withdrawal amount must be greater than 0');
    }

    const roundedAmount = this._round2(numAmount);
    if (roundedAmount > this.balance) {
      throw new Error(`Insufficient funds: balance is ${this.balance.toFixed(2)}, attempted withdrawal of ${roundedAmount.toFixed(2)}`);
    }

    this.balance = this._round2(this.balance - roundedAmount);

    const transaction = {
      id: this._generateId('tx'),
      userId: targetUser,
      type: 'WITHDRAWAL',
      amount: -roundedAmount,
      balanceAfter: this.balance,
      description,
      timestamp: new Date().toISOString()
    };

    this.transactions.unshift(transaction);
    db.saveTransaction(transaction, this.balance, targetUser);
    return transaction;
  }

  /**
   * Get all transactions
   * @returns {Array<object>}
   */
  getTransactions() {
    return [...this.transactions];
  }

  /**
   * Place a bet (Single or Multi/Accumulator)
   * 
   * @param {object} betData
   * @param {string} [betData.userId]
   * @param {'SINGLE' | 'MULTI'} [betData.type]
   * @param {number} betData.stake
   * @param {Array<object>} betData.selections
   * @returns {object} Created bet record
   */
  placeBet({ userId, type, stake, selections } = {}) {
    const targetUser = userId || this.activeUserId;
    if (userId) this.activeUserId = userId;
    // Validate selections
    if (!Array.isArray(selections) || selections.length === 0) {
      throw new Error('Bet selections must be a non-empty array');
    }

    // Determine and validate bet type
    let betType = (type ? String(type).toUpperCase() : (selections.length > 1 ? 'MULTI' : 'SINGLE'));
    if (betType !== 'SINGLE' && betType !== 'MULTI') {
      throw new Error("Bet type must be either 'SINGLE' or 'MULTI'");
    }

    if (betType === 'SINGLE' && selections.length > 1) {
      // If multiple selections are marked as SINGLE, auto-escalate to MULTI
      betType = 'MULTI';
    }

    // Validate stake
    const numStake = Number(stake);
    if (isNaN(numStake) || numStake <= 0) {
      throw new Error('Stake must be greater than 0');
    }

    const roundedStake = this._round2(numStake);
    if (roundedStake > this.balance) {
      throw new Error(`Insufficient balance: available ${this.balance.toFixed(2)}, required ${roundedStake.toFixed(2)}`);
    }

    // Validate and normalize selections
    const validatedSelections = selections.map((sel, idx) => {
      if (!sel.matchId) {
        throw new Error(`Selection at index ${idx} is missing required 'matchId'`);
      }
      if (!sel.selectionKey) {
        throw new Error(`Selection at index ${idx} is missing required 'selectionKey'`);
      }
      const odds = Number(sel.odds);
      if (isNaN(odds) || odds <= 0) {
        throw new Error(`Selection at index ${idx} has invalid odds: ${sel.odds}`);
      }

      const rawKey = String(sel.selectionKey).trim().toUpperCase();
      const rawMarket = sel.market ? String(sel.market).trim().toUpperCase() : '1X2';

      return {
        matchId: sel.matchId,
        matchName: sel.matchName || `${sel.homeTeam || 'Home'} vs ${sel.awayTeam || 'Away'}`,
        homeTeam: sel.homeTeam || '',
        awayTeam: sel.awayTeam || '',
        market: rawMarket,
        selectionKey: rawKey,
        label: sel.label || rawKey,
        odds: this._round2(odds),
        status: 'PENDING'
      };
    });

    // Calculate total odds
    let totalOdds;
    if (betType === 'SINGLE') {
      totalOdds = validatedSelections[0].odds;
    } else {
      // MULTI: product of all selection.odds (rounded to 2 decimal places)
      const rawMultiplier = validatedSelections.reduce((acc, sel) => acc * sel.odds, 1);
      totalOdds = this._round2(rawMultiplier);
    }

    // Calculate potential return: stake * totalOdds (rounded to 2 decimal places)
    const potentialReturn = this._round2(roundedStake * totalOdds);

    // Deduct stake from wallet balance
    this.balance = this._round2(this.balance - roundedStake);

    const betId = this._generateId('bet');

    // Record ledger transaction for bet placement
    const tx = {
      id: this._generateId('tx'),
      userId: targetUser,
      type: 'BET_PLACED',
      amount: -roundedStake,
      balanceAfter: this.balance,
      description: `Placed ${betType} bet (${validatedSelections.length} leg${validatedSelections.length > 1 ? 's' : ''}) #${betId}`,
      timestamp: new Date().toISOString()
    };
    this.transactions.unshift(tx);

    // Create bet object
    const bet = {
      id: betId,
      userId: targetUser,
      type: betType,
      stake: roundedStake,
      totalOdds,
      potentialReturn,
      placedAt: new Date().toISOString(),
      status: 'PENDING',
      selections: validatedSelections
    };

    this.bets.push(bet);
    db.saveTransaction(tx, this.balance, targetUser);
    db.saveBet(bet, targetUser);
    return bet;
  }

  /**
   * Settle bets against a finished match result
   * 
   * @param {object} finishedMatch
   * @param {string|number} finishedMatch.id - Match ID
   * @param {{ home: number, away: number }} finishedMatch.score - Final match score
   * @returns {Array<object>} List of settled bets during this match settlement
   */
  settleMatch(finishedMatch) {
    if (!finishedMatch) {
      throw new Error('Finished match object is required');
    }

    const matchId = finishedMatch.id ?? finishedMatch.matchId;
    if (matchId === undefined || matchId === null) {
      throw new Error('Finished match must contain an id');
    }

    // Normalize match score
    const homeScore = finishedMatch.score?.home ?? finishedMatch.homeScore ?? finishedMatch.homeGoals ?? 0;
    const awayScore = finishedMatch.score?.away ?? finishedMatch.awayScore ?? finishedMatch.awayGoals ?? 0;

    const settledBetsThisRound = [];

    // Filter only currently pending bets
    const pendingBets = this.bets.filter(b => b.status === 'PENDING');

    for (const bet of pendingBets) {
      let betUpdated = false;

      // Evaluate selections matching this match
      for (const sel of bet.selections) {
        if (String(sel.matchId) === String(matchId) && sel.status === 'PENDING') {
          const outcomeWon = this._evaluateSelection(sel, homeScore, awayScore);
          sel.status = outcomeWon ? 'WON' : 'LOST';
          sel.settledScore = { home: homeScore, away: awayScore };
          betUpdated = true;
        }
      }

      // Check overall bet status
      // Evaluates overall bet status:
      // - If all selections in the bet are evaluated:
      //   - If all are 'WON', mark bet as 'WON', credit wallet with potentialReturn, record WIN transaction.
      //   - If any selection is 'LOST', mark bet as 'LOST'.
      // - If some selections are still pending other matches, keep bet status as 'PENDING'.
      const allEvaluated = bet.selections.every(s => s.status === 'WON' || s.status === 'LOST');

      if (allEvaluated) {
        const allWon = bet.selections.every(s => s.status === 'WON');
        bet.settledAt = new Date().toISOString();

        if (allWon) {
          bet.status = 'WON';
          // Credit wallet with potential return
          this.balance = this._round2(this.balance + bet.potentialReturn);

          // Record WIN transaction
          const targetWinnerUserId = bet.userId || this.activeUserId;
          const winTx = {
            id: this._generateId('tx'),
            userId: targetWinnerUserId,
            type: 'BET_WIN',
            amount: bet.potentialReturn,
            balanceAfter: this.balance,
            description: `Winnings payout for bet #${bet.id}`,
            timestamp: new Date().toISOString()
          };
          this.transactions.unshift(winTx);
          db.saveTransaction(winTx, this.balance, targetWinnerUserId);
        } else {
          bet.status = 'LOST';
        }

        db.updateBetStatus(bet);
        settledBetsThisRound.push(bet);
      } else {
        // Some selections are still pending other matches
        bet.status = 'PENDING';
        if (betUpdated) {
          db.updateBetStatus(bet);
        }
      }
    }

    return settledBetsThisRound;
  }

  /**
   * Evaluate a single selection outcome based on the finished score
   * 
   * @param {object} selection 
   * @param {number} home 
   * @param {number} away 
   * @returns {boolean} Whether selection won
   */
  _evaluateSelection(selection, home, away) {
    const key = String(selection.selectionKey).trim().toUpperCase();
    const market = selection.market ? String(selection.market).trim().toUpperCase() : '1X2';
    const totalGoals = home + away;

    // 1X2 Market
    if (key === '1') {
      return home > away;
    }
    if (key === 'X' || key === 'DRAW') {
      return home === away;
    }
    if (key === '2') {
      return away > home;
    }

    // Totals / Over Under 2.5 Market
    if (key === 'OVER' || key === 'OVER_2.5' || key === 'O2.5') {
      return totalGoals > 2.5;
    }
    if (key === 'UNDER' || key === 'UNDER_2.5' || key === 'U2.5') {
      return totalGoals < 2.5;
    }

    // Both Teams to Score (BTTS / GG / NG) Market
    if (key === 'YES' || key === 'GG' || key === 'BTTS_YES') {
      return home > 0 && away > 0;
    }
    if (key === 'NO' || key === 'NG' || key === 'BTTS_NO') {
      return home === 0 || away === 0;
    }

    // Fallback if market specific
    if (market === '1X2') {
      if (key.includes('HOME') || key === '1') return home > away;
      if (key.includes('AWAY') || key === '2') return away > home;
      if (key.includes('DRAW') || key === 'X') return home === away;
    }

    if (market === 'TOTALS' || market === 'OVER_UNDER') {
      if (key.startsWith('OVER')) return totalGoals > 2.5;
      if (key.startsWith('UNDER')) return totalGoals < 2.5;
    }

    if (market === 'BTTS') {
      if (key === 'YES' || key === 'GG') return home > 0 && away > 0;
      if (key === 'NO' || key === 'NG') return home === 0 || away === 0;
    }

    return false;
  }

  /**
   * Evaluate live Cash Out availability and offer amount for a bet
   * @param {object} bet
   * @param {Array<object>} [matchesList=[]]
   * @returns {{ available: boolean, amount: number, reason: string|null }}
   */
  evaluateCashout(bet, matchesList = []) {
    if (!bet || bet.status !== 'PENDING') {
      return { available: false, amount: 0, reason: 'Ticket already settled' };
    }

    const selections = bet.selections || [];
    if (selections.length === 0) {
      return { available: false, amount: 0, reason: 'No selections' };
    }

    let combinedRatio = 1.0;

    for (const sel of selections) {
      if (sel.status === 'LOST') {
        return { available: false, amount: 0, reason: 'One or more selections have lost' };
      }

      const match = matchesList.find(m => String(m.id) === String(sel.matchId));
      const placedOdd = Number(sel.odds) || 1.0;

      if (sel.status === 'WON') {
        combinedRatio *= placedOdd;
        continue;
      }

      if (!match) {
        // Match not found in live memory -> treat as pre-match neutral
        combinedRatio *= 1.0;
        continue;
      }

      if (match.status === 'FT' || match.status === 'FINISHED') {
        const homeScore = match.score?.home ?? 0;
        const awayScore = match.score?.away ?? 0;
        const won = this._evaluateSelection(sel, homeScore, awayScore);
        if (!won) {
          return { available: false, amount: 0, reason: `${match.homeTeam?.name || 'Match'} selection lost at FT` };
        }
        combinedRatio *= placedOdd;
        continue;
      }

      if (match.oddsSuspended || match.cashoutLocked) {
        return { available: false, amount: 0, reason: 'Live market locked (Danger Attack)' };
      }

      if (match.status === 'LIVE' && Number(match.minute) >= 85) {
        return { available: false, amount: 0, reason: 'Cash Out locked in final minutes (85’+)' };
      }

      if (match.status === 'LIVE' && Number(match.minute) % 3 === 0) {
        return { available: false, amount: 0, reason: 'Live play temporarily locked' };
      }

      if (match.status === 'LIVE') {
        const curHome = match.score?.home ?? 0;
        const curAway = match.score?.away ?? 0;
        const totalGoals = curHome + curAway;
        const key = String(sel.selectionKey || '').trim().toUpperCase();
        const market = String(sel.market || '1X2').trim().toUpperCase();

        // Check mathematically dead in-play markets
        if ((key === 'UNDER' || key === 'UNDER_2.5' || key === 'U2.5') && totalGoals >= 3) {
          return { available: false, amount: 0, reason: 'Under 2.5 selection already lost (3+ goals)' };
        }
        if ((key === 'NO' || key === 'NG' || key === 'BTTS_NO') && curHome > 0 && curAway > 0) {
          return { available: false, amount: 0, reason: 'BTTS No selection already lost (Both scored)' };
        }

        // Get live odd for this selection
        let liveOdd = placedOdd;
        if (match.odds) {
          if (key === '1') liveOdd = match.odds.homeWin ?? placedOdd;
          else if (key === 'X' || key === 'DRAW') liveOdd = match.odds.draw ?? placedOdd;
          else if (key === '2') liveOdd = match.odds.awayWin ?? placedOdd;
          else if (key.startsWith('OVER') || key === 'O2.5') liveOdd = match.odds.over25 ?? placedOdd;
          else if (key.startsWith('UNDER') || key === 'U2.5') liveOdd = match.odds.under25 ?? placedOdd;
          else if (key === 'YES' || key === 'GG' || key === 'BTTS_YES') liveOdd = match.odds.bttsYes ?? placedOdd;
          else if (key === 'NO' || key === 'NG' || key === 'BTTS_NO') liveOdd = match.odds.bttsNo ?? placedOdd;
          else if (market === 'OU') {
            liveOdd = key.includes('OVER') ? (match.odds.over25 ?? placedOdd) : (match.odds.under25 ?? placedOdd);
          }
        }

        liveOdd = Math.max(1.01, Number(liveOdd) || placedOdd);
        if (liveOdd >= 18.0) {
          return { available: false, amount: 0, reason: 'Cash Out suspended due to high live odds' };
        }

        combinedRatio *= placedOdd / liveOdd;
      }
    }

    const stake = Number(bet.stake) || 0;
    const maxReturn = Number(bet.potentialReturn || bet.potentialPayout || stake) * 0.98;
    const rawOffer = stake * combinedRatio * 0.92;
    const offer = this._round2(Math.min(maxReturn, Math.max(0, rawOffer)));

    if (offer < this._round2(stake * 0.12) || offer <= 0.1) {
      return { available: false, amount: 0, reason: 'Cash Out value below minimum threshold' };
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
  }

  /**
   * Execute Cash Out on a pending bet
   * @param {string} betId
   * @param {Array<object>} [matchesList=[]]
   * @param {string} [userId=null]
   * @returns {object} Settled cashed-out bet
   */
  cashoutBet(betId, matchesList = [], userId = null) {
    const targetUser = userId || this.activeUserId;
    if (userId) this.activeUserId = userId;

    const bet = this.bets.find(b => String(b.id) === String(betId));
    if (!bet) {
      throw new Error(`Bet #${betId} not found`);
    }
    if (bet.status !== 'PENDING') {
      throw new Error(`Bet #${betId} is no longer open for Cash Out (Status: ${bet.status})`);
    }

    const evaluation = this.evaluateCashout(bet, matchesList);
    if (!evaluation.available || evaluation.amount <= 0) {
      throw new Error(evaluation.reason || 'Cash Out is currently unavailable for this bet');
    }

    const cashoutAmount = evaluation.amount;
    bet.status = 'CASHED_OUT';
    bet.cashedOutAmount = cashoutAmount;
    bet.payout = cashoutAmount;
    bet.settledAt = new Date().toISOString();

    this.balance = this._round2(this.balance + cashoutAmount);

    const tx = {
      id: this._generateId('tx'),
      userId: bet.userId || targetUser,
      type: 'BET_CASHOUT',
      amount: cashoutAmount,
      balanceAfter: this.balance,
      description: `Cash Out settled for bet #${bet.id}`,
      timestamp: new Date().toISOString()
    };

    this.transactions.unshift(tx);
    db.saveTransaction(tx, this.balance, bet.userId || targetUser);
    db.updateBetStatus(bet);

    return {
      bet,
      cashoutAmount,
      balance: this.balance,
      transaction: tx
    };
  }

  /**
   * Get active pending bets
   * @param {string} [userId]
   * @returns {Array<object>}
   */
  getActiveBets(userId = null) {
    return this.bets.filter(
      b => b.status === 'PENDING' && (!userId || !b.userId || b.userId === userId)
    );
  }

  /**
   * Get settled bets (WON, LOST, or CASHED_OUT)
   * @param {string} [userId]
   * @returns {Array<object>}
   */
  getSettledBets(userId = null) {
    return this.bets.filter(
      b =>
        (b.status === 'WON' || b.status === 'LOST' || b.status === 'CASHED_OUT') &&
        (!userId || !b.userId || b.userId === userId)
    );
  }

  /**
   * Get all bets
   * @param {string} [userId]
   * @returns {Array<object>}
   */
  getAllBets(userId = null) {
    if (!userId) return [...this.bets];
    return this.bets.filter(b => !b.userId || b.userId === userId);
  }

  /**
   * Find a specific bet by ID
   * @param {string} id 
   * @returns {object|undefined}
   */
  getBetById(id) {
    return this.bets.find(b => b.id === id);
  }
}

// Export singleton default instance alongside the class
const defaultLedger = new WalletLedger();

module.exports = defaultLedger;
module.exports.WalletLedger = WalletLedger;
module.exports.default = defaultLedger;
