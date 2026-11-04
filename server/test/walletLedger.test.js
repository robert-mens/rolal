const assert = require('assert');
const { WalletLedger } = require('../services/walletLedger');

function runTests() {
  console.log('🧪 Starting WalletLedger test suite...\n');

  // Test 1: Initial Balance & Get Balance
  {
    console.log('Test 1: Initial Balance & Get Balance');
    const ledger = new WalletLedger(1000.00);
    assert.strictEqual(ledger.getBalance(), 1000.00);
    const txs = ledger.getTransactions();
    assert.strictEqual(txs.length, 1);
    assert.strictEqual(txs[0].type, 'INITIAL_DEPOSIT');
    assert.strictEqual(txs[0].amount, 1000.00);
    console.log('  ✅ Passed');
  }

  // Test 2: Deposit
  {
    console.log('\nTest 2: Deposit');
    const ledger = new WalletLedger(500.00);
    const tx = ledger.deposit(250.50, 'Bank Transfer');
    assert.strictEqual(ledger.getBalance(), 750.50);
    assert.strictEqual(tx.type, 'DEPOSIT');
    assert.strictEqual(tx.amount, 250.50);
    assert.strictEqual(tx.balanceAfter, 750.50);
    assert.strictEqual(tx.description, 'Bank Transfer');

    // Deposit validation
    assert.throws(() => ledger.deposit(0), /must be greater than 0/);
    assert.throws(() => ledger.deposit(-50), /must be greater than 0/);
    assert.throws(() => ledger.deposit('abc'), /must be greater than 0/);
    console.log('  ✅ Passed');
  }

  // Test 3: Withdrawal
  {
    console.log('\nTest 3: Withdrawal');
    const ledger = new WalletLedger(1000.00);
    const tx = ledger.withdraw(300.00, 'ATM withdrawal');
    assert.strictEqual(ledger.getBalance(), 700.00);
    assert.strictEqual(tx.type, 'WITHDRAWAL');
    assert.strictEqual(tx.amount, -300.00);
    assert.strictEqual(tx.balanceAfter, 700.00);

    // Overdraft validation
    assert.throws(() => ledger.withdraw(700.01), /Insufficient funds/);
    assert.throws(() => ledger.withdraw(0), /must be greater than 0/);
    assert.throws(() => ledger.withdraw(-10), /must be greater than 0/);
    console.log('  ✅ Passed');
  }

  // Test 4: Bet Placement (SINGLE)
  {
    console.log('\nTest 4: Bet Placement (SINGLE)');
    const ledger = new WalletLedger(1000.00);
    const bet = ledger.placeBet({
      type: 'SINGLE',
      stake: 100.00,
      selections: [
        {
          matchId: 'match_1',
          matchName: 'Arsenal vs Chelsea',
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea',
          market: '1X2',
          selectionKey: '1',
          odds: 1.85
        }
      ]
    });

    assert.strictEqual(ledger.getBalance(), 900.00);
    assert.strictEqual(bet.type, 'SINGLE');
    assert.strictEqual(bet.stake, 100.00);
    assert.strictEqual(bet.totalOdds, 1.85);
    assert.strictEqual(bet.potentialReturn, 185.00);
    assert.strictEqual(bet.status, 'PENDING');
    assert.strictEqual(bet.selections.length, 1);
    assert.strictEqual(bet.selections[0].status, 'PENDING');

    const activeBets = ledger.getActiveBets();
    assert.strictEqual(activeBets.length, 1);
    assert.strictEqual(activeBets[0].id, bet.id);

    // Check transaction recorded
    const txs = ledger.getTransactions();
    const betTx = txs.find(t => t.type === 'BET_PLACED');
    assert(betTx);
    assert.strictEqual(betTx.amount, -100.00);
    assert.strictEqual(betTx.balanceAfter, 900.00);

    // Stake validation
    assert.throws(() => ledger.placeBet({ type: 'SINGLE', stake: 950.00, selections: bet.selections }), /Insufficient balance/);
    assert.throws(() => ledger.placeBet({ type: 'SINGLE', stake: 0, selections: bet.selections }), /Stake must be greater than 0/);
    assert.throws(() => ledger.placeBet({ type: 'SINGLE', stake: 50, selections: [] }), /non-empty array/);
    console.log('  ✅ Passed');
  }

  // Test 5: Bet Placement (MULTI / ACCUMULATOR MATH)
  {
    console.log('\nTest 5: Bet Placement (MULTI / ACCUMULATOR MATH)');
    const ledger = new WalletLedger(1000.00);
    // 3 selections: 1.50 * 2.00 * 2.20 = 6.60
    const selections = [
      { matchId: 'm1', market: '1X2', selectionKey: '1', odds: 1.50, homeTeam: 'A', awayTeam: 'B' },
      { matchId: 'm2', market: 'TOTALS', selectionKey: 'OVER', odds: 2.00, homeTeam: 'C', awayTeam: 'D' },
      { matchId: 'm3', market: 'BTTS', selectionKey: 'YES', odds: 2.20, homeTeam: 'E', awayTeam: 'F' }
    ];

    const bet = ledger.placeBet({
      type: 'MULTI',
      stake: 50.00,
      selections
    });

    assert.strictEqual(ledger.getBalance(), 950.00);
    assert.strictEqual(bet.type, 'MULTI');
    assert.strictEqual(bet.stake, 50.00);
    assert.strictEqual(bet.totalOdds, 6.60);
    assert.strictEqual(bet.potentialReturn, 330.00); // 50 * 6.60 = 330.00
    assert.strictEqual(bet.status, 'PENDING');
    console.log('  ✅ Passed');
  }

  // Test 6: Bet Settlement (SINGLE WON & LOST)
  {
    console.log('\nTest 6: Bet Settlement (SINGLE WON & LOST)');
    const ledger = new WalletLedger(1000.00);
    
    // Bet 1: Home Win (1), Odds 2.00, Stake 100 -> Wins
    const winBet = ledger.placeBet({
      type: 'SINGLE',
      stake: 100.00,
      selections: [{ matchId: 'm1', market: '1X2', selectionKey: '1', odds: 2.00 }]
    });

    // Bet 2: Away Win (2), Odds 3.00, Stake 50 -> Loses
    const loseBet = ledger.placeBet({
      type: 'SINGLE',
      stake: 50.00,
      selections: [{ matchId: 'm1', market: '1X2', selectionKey: '2', odds: 3.00 }]
    });

    // Balance after stakes: 1000 - 100 - 50 = 850
    assert.strictEqual(ledger.getBalance(), 850.00);

    // Settle m1: Arsenal 2 - 1 Chelsea (Home win)
    const settled = ledger.settleMatch({
      id: 'm1',
      score: { home: 2, away: 1 }
    });

    assert.strictEqual(settled.length, 2);
    assert.strictEqual(winBet.status, 'WON');
    assert.strictEqual(winBet.selections[0].status, 'WON');
    assert.strictEqual(loseBet.status, 'LOST');
    assert.strictEqual(loseBet.selections[0].status, 'LOST');

    // Winner gets credited: 850 + (100 * 2.00) = 1050.00
    assert.strictEqual(ledger.getBalance(), 1050.00);

    const winTx = ledger.getTransactions().find(t => t.type === 'BET_WIN');
    assert(winTx);
    assert.strictEqual(winTx.amount, 200.00);
    assert.strictEqual(winTx.balanceAfter, 1050.00);
    console.log('  ✅ Passed');
  }

  // Test 7: Totals & BTTS Market Settlement
  {
    console.log('\nTest 7: Totals (Over/Under) & BTTS Market Settlement');
    const ledger = new WalletLedger(1000.00);

    // Bet Over 2.5
    const betOver = ledger.placeBet({
      type: 'SINGLE',
      stake: 10.00,
      selections: [{ matchId: 'm_totals', market: 'TOTALS', selectionKey: 'OVER', odds: 1.80 }]
    });
    // Bet Under 2.5
    const betUnder = ledger.placeBet({
      type: 'SINGLE',
      stake: 10.00,
      selections: [{ matchId: 'm_totals', market: 'TOTALS', selectionKey: 'UNDER', odds: 2.00 }]
    });
    // Bet BTTS Yes
    const betBttsYes = ledger.placeBet({
      type: 'SINGLE',
      stake: 10.00,
      selections: [{ matchId: 'm_totals', market: 'BTTS', selectionKey: 'YES', odds: 1.90 }]
    });
    // Bet BTTS No
    const betBttsNo = ledger.placeBet({
      type: 'SINGLE',
      stake: 10.00,
      selections: [{ matchId: 'm_totals', market: 'BTTS', selectionKey: 'NO', odds: 1.90 }]
    });

    // Score: 3 - 0 (Total 3 goals: Over WON, Under LOST, BTTS No WON, BTTS Yes LOST)
    ledger.settleMatch({
      id: 'm_totals',
      score: { home: 3, away: 0 }
    });

    assert.strictEqual(betOver.status, 'WON');
    assert.strictEqual(betUnder.status, 'LOST');
    assert.strictEqual(betBttsNo.status, 'WON');
    assert.strictEqual(betBttsYes.status, 'LOST');
    console.log('  ✅ Passed');
  }

  // Test 8: Multi-Leg Bet Partial & Final Settlement
  {
    console.log('\nTest 8: Multi-Leg Bet Partial & Final Settlement');
    const ledger = new WalletLedger(1000.00);

    // Multi bet with 2 legs
    const multiBet = ledger.placeBet({
      type: 'MULTI',
      stake: 100.00,
      selections: [
        { matchId: 'leg1', market: '1X2', selectionKey: '1', odds: 2.00 }, // needs home win
        { matchId: 'leg2', market: '1X2', selectionKey: 'X', odds: 3.00 }  // needs draw
      ]
    });

    // Balance after placing bet: 900.00
    assert.strictEqual(ledger.getBalance(), 900.00);

    // Leg 1 finishes: Home wins (1-0)
    const settled1 = ledger.settleMatch({ id: 'leg1', score: { home: 1, away: 0 } });
    assert.strictEqual(settled1.length, 0); // Not settled yet because leg 2 is pending
    assert.strictEqual(multiBet.status, 'PENDING');
    assert.strictEqual(multiBet.selections[0].status, 'WON');
    assert.strictEqual(multiBet.selections[1].status, 'PENDING');
    assert.strictEqual(ledger.getActiveBets().length, 1);

    // Leg 2 finishes: Draw (2-2)
    const settled2 = ledger.settleMatch({ id: 'leg2', score: { home: 2, away: 2 } });
    assert.strictEqual(settled2.length, 1);
    assert.strictEqual(multiBet.status, 'WON');
    assert.strictEqual(multiBet.selections[1].status, 'WON');
    // Multi totalOdds: 2.00 * 3.00 = 6.00, return = 100 * 6 = 600.00
    // Balance: 900 + 600 = 1500.00
    assert.strictEqual(ledger.getBalance(), 1500.00);
    assert.strictEqual(ledger.getActiveBets().length, 0);
    assert.strictEqual(ledger.getSettledBets().length, 1);
    console.log('  ✅ Passed');
  }

  // Test 9: Multi-Leg Bet Loss Evaluation
  {
    console.log('\nTest 9: Multi-Leg Bet Loss Evaluation');
    const ledger = new WalletLedger(1000.00);

    const multiBet = ledger.placeBet({
      type: 'MULTI',
      stake: 50.00,
      selections: [
        { matchId: 'm_lose_1', market: '1X2', selectionKey: '1', odds: 1.50 },
        { matchId: 'm_lose_2', market: '1X2', selectionKey: '2', odds: 2.00 }
      ]
    });

    // Match 1 finishes with Draw (0-0) -> selection loses
    ledger.settleMatch({ id: 'm_lose_1', score: { home: 0, away: 0 } });
    assert.strictEqual(multiBet.selections[0].status, 'LOST');
    // Leg 2 is still pending, so bet remains pending per specification until all evaluated
    assert.strictEqual(multiBet.status, 'PENDING');

    // Match 2 finishes with Away win (0-1) -> selection wins
    const settled = ledger.settleMatch({ id: 'm_lose_2', score: { home: 0, away: 1 } });
    assert.strictEqual(settled.length, 1);
    assert.strictEqual(multiBet.status, 'LOST');
    assert.strictEqual(ledger.getBalance(), 950.00); // No payout
    console.log('  ✅ Passed');
  }

  // Test 10: History & Retrieval
  {
    console.log('\nTest 10: History & Retrieval');
    const ledger = new WalletLedger(1000.00);
    const b1 = ledger.placeBet({
      type: 'SINGLE',
      stake: 10,
      selections: [{ matchId: 'h1', market: '1X2', selectionKey: '1', odds: 2.0 }]
    });
    const b2 = ledger.placeBet({
      type: 'SINGLE',
      stake: 20,
      selections: [{ matchId: 'h2', market: '1X2', selectionKey: '2', odds: 3.0 }]
    });

    assert.strictEqual(ledger.getAllBets().length, 2);
    assert.strictEqual(ledger.getActiveBets().length, 2);
    assert.strictEqual(ledger.getSettledBets().length, 0);

    ledger.settleMatch({ id: 'h1', score: { home: 1, away: 0 } });

    assert.strictEqual(ledger.getAllBets().length, 2);
    assert.strictEqual(ledger.getActiveBets().length, 1);
    assert.strictEqual(ledger.getSettledBets().length, 1);
    assert.strictEqual(ledger.getBetById(b1.id).status, 'WON');
    assert.strictEqual(ledger.getBetById(b2.id).status, 'PENDING');
    console.log('  ✅ Passed');
  }

  // Test 11: Singleton default instance export
  {
    console.log('\nTest 11: Singleton default instance export');
    const defaultInstance = require('../services/walletLedger');
    assert.strictEqual(typeof defaultInstance.getBalance, 'function');
    assert.strictEqual(typeof defaultInstance.placeBet, 'function');
    assert.strictEqual(typeof defaultInstance.settleMatch, 'function');
    assert.strictEqual(typeof defaultInstance.deposit, 'function');
    assert.strictEqual(typeof defaultInstance.withdraw, 'function');
    assert.strictEqual(typeof defaultInstance.getTransactions, 'function');
    assert.strictEqual(typeof defaultInstance.getActiveBets, 'function');
    assert.strictEqual(typeof defaultInstance.getSettledBets, 'function');
    assert.strictEqual(typeof defaultInstance.getAllBets, 'function');
    console.log('  ✅ Passed');
  }

  console.log('\n🎉 ALL 11 TEST SUITES PASSED PERFECTLY!\n');
}

runTests();
