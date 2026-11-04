/**
 * Standalone End-to-End API Test Script
 * Verifies all REST and SSE endpoints for Out-of-Ghana Sportsbook API
 */

const assert = require('assert');
const http = require('http');

const PORT = process.env.TEST_PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess = null;
let customApp = null;
let testServer = null;

async function checkPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServerIfNeeded() {
  const isOpen = await checkPortOpen(PORT);
  if (isOpen) {
    console.log(`[Test] Server is already running on port ${PORT}. Testing active instance.`);
    return null;
  }

  console.log(`[Test] No active server detected on port ${PORT}. Starting in-process server...`);
  const serverModule = require('./server/server');
  testServer = serverModule.server;

  // Wait for server to listen
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return testServer;
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`  TEST: ${name} ... `);
    await fn();
    console.log(`\x1b[32mPASSED\x1b[0m`);
    passed++;
  } catch (err) {
    console.log(`\x1b[31mFAILED\x1b[0m`);
    console.error(`    Error:`, err.message);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log(' STARTING SPORTSBOOK API END-TO-END VERIFICATION');
  console.log('======================================================\n');

  await startServerIfNeeded();

  let sampleMatch = null;
  let sampleLeagueId = null;
  let initialBalance = 0;

  // 1. Health check
  await test('GET /health - Server health and operational status', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'online');
    assert.strictEqual(typeof data.balance, 'number');
    assert.ok(data.matchesCount > 0, 'Matches count should be greater than 0');
  });

  // 2. Leagues
  await test('GET /api/leagues - Fetch all out-of-Ghana leagues', async () => {
    const res = await fetch(`${BASE_URL}/api/leagues`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const leagues = await res.json();
    assert.ok(Array.isArray(leagues), 'Response should be an array');
    assert.ok(leagues.length >= 6, `Expected at least 6 verified leagues, found ${leagues.length}`);

    const first = leagues[0];
    sampleLeagueId = first.id;
    assert.ok(first.name, 'League must have name');
    assert.ok(first.country, 'League must have country');
    assert.ok(first.flag, 'League must have flag');
    assert.strictEqual(typeof first.liveCount, 'number');
    assert.strictEqual(typeof first.totalMatches, 'number');
  });

  // 3. Matches (All)
  await test('GET /api/matches - Fetch all fixtures', async () => {
    const res = await fetch(`${BASE_URL}/api/matches`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const matches = await res.json();
    assert.ok(Array.isArray(matches), 'Matches should be an array');
    assert.ok(matches.length > 0, 'Should have fixtures loaded');

    sampleMatch = matches.find(m => m.status === 'LIVE') || matches[0];
    assert.ok(sampleMatch.id, 'Match must have id');
    assert.ok(sampleMatch.homeTeam, 'Match must have homeTeam');
    assert.ok(sampleMatch.awayTeam, 'Match must have awayTeam');
    assert.ok(sampleMatch.odds, 'Match must have odds');
    assert.ok(sampleMatch.odds.homeWin > 1, 'Odds homeWin should be > 1');
  });

  // 4. Matches (Filter by League)
  await test(`GET /api/matches?leagueId=${sampleLeagueId} - Filter matches by league`, async () => {
    const res = await fetch(`${BASE_URL}/api/matches?leagueId=${sampleLeagueId}`);
    assert.strictEqual(res.status, 200);
    const matches = await res.json();
    assert.ok(Array.isArray(matches));
    for (const m of matches) {
      assert.strictEqual(m.leagueId, sampleLeagueId, `Match leagueId should match ${sampleLeagueId}`);
    }
  });

  // 5. Matches (Single Match by ID)
  await test(`GET /api/matches/:id - Fetch single match by ID`, async () => {
    const res = await fetch(`${BASE_URL}/api/matches/${sampleMatch.id}`);
    assert.strictEqual(res.status, 200);
    const match = await res.json();
    assert.strictEqual(match.id, sampleMatch.id);
  });

  // 6. Matches (Non-existent ID)
  await test('GET /api/matches/invalid-id - Return 404 for unknown match', async () => {
    const res = await fetch(`${BASE_URL}/api/matches/non-existent-match-999`);
    assert.strictEqual(res.status, 404);
  });

  // 7. Wallet Get
  await test('GET /api/wallet - Get initial balance and ledger transactions', async () => {
    const res = await fetch(`${BASE_URL}/api/wallet`);
    assert.strictEqual(res.status, 200);
    const wallet = await res.json();
    assert.strictEqual(typeof wallet.balance, 'number');
    assert.ok(Array.isArray(wallet.transactions));
    initialBalance = wallet.balance;
  });

  // 8. Wallet Deposit
  await test('POST /api/wallet/deposit - Top-up account funds', async () => {
    const depositAmount = 250.00;
    const res = await fetch(`${BASE_URL}/api/wallet/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: depositAmount, description: 'Test Deposit' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.balance, Math.round((initialBalance + depositAmount) * 100) / 100);
    assert.strictEqual(data.transaction.type, 'DEPOSIT');
    initialBalance = data.balance;
  });

  // 9. Bet Placement (Single)
  let singleBetId = null;
  await test('POST /api/bets/place - Place valid Single bet', async () => {
    const stake = 25.00;
    const selection = {
      matchId: sampleMatch.id,
      matchName: `${sampleMatch.homeTeam.name} vs ${sampleMatch.awayTeam.name}`,
      market: '1X2',
      selectionKey: '1',
      odds: sampleMatch.odds.homeWin
    };

    const res = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SINGLE',
        stake,
        selections: [selection]
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.bet);
    assert.strictEqual(data.bet.type, 'SINGLE');
    assert.strictEqual(data.bet.stake, stake);
    assert.strictEqual(data.bet.status, 'PENDING');
    singleBetId = data.bet.id;

    // Balance should be deducted by stake
    assert.strictEqual(data.balance, Math.round((initialBalance - stake) * 100) / 100);
    initialBalance = data.balance;
  });

  // 10. Bet Placement (Multi / Accumulator)
  await test('POST /api/bets/place - Place Multi-leg Accumulator bet', async () => {
    const matchesRes = await fetch(`${BASE_URL}/api/matches`);
    const matches = await matchesRes.json();
    const m1 = matches[0];
    const m2 = matches[1] || matches[0];

    const stake = 15.00;
    const selections = [
      {
        matchId: m1.id,
        matchName: `${m1.homeTeam.name} vs ${m1.awayTeam.name}`,
        market: '1X2',
        selectionKey: '1',
        odds: m1.odds.homeWin
      },
      {
        matchId: m2.id,
        matchName: `${m2.homeTeam.name} vs ${m2.awayTeam.name}`,
        market: 'OU25',
        selectionKey: 'OVER25',
        odds: m2.odds.over25
      }
    ];

    const res = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'MULTI',
        stake,
        selections
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.bet.type, 'MULTI');
    assert.strictEqual(data.bet.selections.length, 2);
    assert.ok(data.bet.totalOdds > 1);
    assert.strictEqual(data.bet.potentialReturn, Math.round(stake * data.bet.totalOdds * 100) / 100);
    initialBalance = data.balance;
  });

  // 11. Bet Placement Validation (Insufficient Stake / Balance)
  await test('POST /api/bets/place - Reject bet with excessive stake', async () => {
    const res = await fetch(`${BASE_URL}/api/bets/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SINGLE',
        stake: 99999999,
        selections: [{ matchId: sampleMatch.id, selectionKey: '1', odds: 1.5 }]
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('Insufficient balance'));
  });

  // 12. Active Bets
  await test('GET /api/bets/active - List pending active bets', async () => {
    const res = await fetch(`${BASE_URL}/api/bets/active`);
    assert.strictEqual(res.status, 200);
    const bets = await res.json();
    assert.ok(Array.isArray(bets));
    assert.ok(bets.length >= 2, `Expected at least 2 active bets, got ${bets.length}`);
    const found = bets.find(b => b.id === singleBetId);
    assert.ok(found, `Placed bet ${singleBetId} should be in active bets`);
  });

  // 13. Settled Bets / History
  await test('GET /api/bets/history - Fetch settled bets', async () => {
    const res = await fetch(`${BASE_URL}/api/bets/history`);
    assert.strictEqual(res.status, 200);
    const history = await res.json();
    assert.ok(Array.isArray(history));
  });

  // 14. My Bets Combined
  await test('GET /api/bets/my-bets - Fetch combined active & settled bets', async () => {
    const res = await fetch(`${BASE_URL}/api/bets/my-bets`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.active));
    assert.ok(Array.isArray(data.settled));
    assert.ok(Array.isArray(data.all));
  });

  // 15. Server-Sent Events (SSE) Stream
  await test('GET /api/stream - Server-Sent Events real-time stream', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`${BASE_URL}/api/stream`, {
        signal: controller.signal
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.headers.get('content-type')?.includes('text/event-stream'), 'Content-Type must be text/event-stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let receivedInit = false;

      // Read chunks until init event is received
      const { value, done } = await reader.read();
      if (value) {
        const text = decoder.decode(value);
        if (text.includes('data:') && text.includes('"type":"init"')) {
          receivedInit = true;
        }
      }

      await reader.cancel();
      clearTimeout(timeout);
      assert.ok(receivedInit, 'Should receive initial SSE snapshot with type="init"');
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('SSE stream connection timed out');
      }
      throw err;
    }
  });

  console.log('\n======================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('[Test Execution Error]:', err);
  process.exit(1);
});
