/**
 * Express Router: Sportsbook, Auth & Wallet API Endpoints
 * RolalBet United Kingdom Sportsbook Platform
 */

const express = require('express');
const router = express.Router();

// Public/hosted deployments (e.g. Vercel previews) run with live payments and the admin API disabled.
// Locally, payments stay available; set PAYMENTS_ENABLED=true explicitly to allow them elsewhere.
const IS_HOSTED = Boolean(process.env.VERCEL);
const PAYMENTS_ENABLED = !IS_HOSTED || process.env.PAYMENTS_ENABLED === 'true';
router.use(['/wallet/gateway', '/admin'], (req, res, next) => {
  if (req.path.startsWith('/') && req.baseUrl !== undefined) {
    const isAdmin = req.originalUrl.includes('/admin');
    if (isAdmin && IS_HOSTED) {
      return res.status(403).json({ success: false, error: 'Admin API is disabled on this deployment.' });
    }
    if (!isAdmin && !PAYMENTS_ENABLED) {
      return res.status(403).json({
        success: false,
        error: 'Live payments are disabled on this preview deployment.'
      });
    }
  }
  next();
});
const oddsEngine = require('../services/oddsEngine');
const walletLedger = require('../services/walletLedger');
const db = require('../services/db');
const emailService = require('../services/emailService');

// Active Server-Sent Events (SSE) connections
const sseClients = new Set();

/**
 * Broadcast payload to all active SSE subscribers
 * @param {string} type - Event identifier
 * @param {any} payload - Event payload object
 */
function broadcastSSE(type, payload) {
  if (sseClients.size === 0) return;

  const data = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString()
  });
  const message = `data: ${data}\n\n`;

  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

/**
 * GET /api/db-status
 * Returns Aiven PostgreSQL database connection status
 */
router.get('/db-status', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT current_database() AS db, current_user AS user, NOW() AS server_time');
    res.json({
      connected: true,
      host: process.env.PG_HOST || 'pg-316fb7fc-rolal-bet.i.aivencloud.com',
      port: Number(process.env.PG_PORT || 20177),
      database: result.rows[0].db,
      user: result.rows[0].user,
      serverTime: result.rows[0].server_time
    });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Cache geo lookups per IP for 5 minutes (keeps location checks fast)
const geoCache = new Map();
const GEO_TTL_MS = 5 * 60 * 1000;

function isPrivateIp(ip) {
  const v = String(ip || '').replace(/^::ffff:/, '');
  return (
    !v ||
    v === '::1' ||
    v === '127.0.0.1' ||
    v.startsWith('10.') ||
    v.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(v) ||
    v.startsWith('fc') ||
    v.startsWith('fd') ||
    v.startsWith('fe80')
  );
}

function getClientIp(req) {
  const h = req.headers || {};
  const candidates = [
    h['x-nf-client-connection-ip'],
    h['cf-connecting-ip'],
    h['x-real-ip'],
    String(h['x-forwarded-for'] || '').split(',')[0],
    req.socket && req.socket.remoteAddress
  ];
  for (const c of candidates) {
    const v = String(c || '').trim().replace(/^::ffff:/, '');
    if (v) return v;
  }
  return '';
}

async function lookupIpGeo(ip) {
  // ip = '' means "look up the machine this server runs on" (only used for local development)
  const suffix = ip ? encodeURIComponent(ip) : '';
  const endpoints = [
    {
      url: `https://ipwho.is/${suffix}`,
      parse: (d) =>
        d && d.success !== false && d.country_code
          ? { countryCode: String(d.country_code).toUpperCase(), countryName: d.country || d.country_code, city: d.city || '', ip: d.ip || ip }
          : null
    },
    {
      url: ip ? `https://ipapi.co/${suffix}/json/` : 'https://ipapi.co/json/',
      parse: (d) =>
        d && d.country_code
          ? { countryCode: String(d.country_code).toUpperCase(), countryName: d.country_name || d.country_code, city: d.city || '', ip: d.ip || ip }
          : null
    },
    {
      url: `http://ip-api.com/json/${suffix}?fields=status,country,countryCode,city,query`,
      parse: (d) =>
        d && d.status === 'success' && d.countryCode
          ? { countryCode: String(d.countryCode).toUpperCase(), countryName: d.country || d.countryCode, city: d.city || '', ip: d.query || ip }
          : null
    }
  ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(ep.url, { signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok) {
        const parsed = ep.parse(await response.json());
        if (parsed && parsed.countryCode) return parsed;
      }
    } catch (e) {
      // try next provider
    }
  }
  return null;
}

async function resolveVisitorLocation(req) {
  const headers = req.headers || {};
  const clientIp = getClientIp(req);

  // 1. Netlify edge geolocation of the *visitor* (base64 JSON), most reliable when hosted on Netlify
  if (headers['x-nf-geo']) {
    try {
      const geo = JSON.parse(Buffer.from(String(headers['x-nf-geo']), 'base64').toString('utf8'));
      const code = String(geo?.country?.code || '').toUpperCase();
      if (code) {
        return {
          countryCode: code,
          countryName: geo.country.name || (code === 'GB' ? 'United Kingdom' : code),
          city: geo.city || '',
          ip: clientIp
        };
      }
    } catch (e) {
      // fall through
    }
  }

  // 2. Other CDN country headers (Cloudflare / Vercel)
  const cdnCountry = headers['cf-ipcountry'] || headers['x-vercel-ip-country'];
  if (cdnCountry && cdnCountry !== 'XX' && cdnCountry !== 'T1') {
    const code = String(cdnCountry).trim().toUpperCase();
    return {
      countryCode: code,
      countryName: code === 'GB' || code === 'UK' ? 'United Kingdom' : code,
      city: headers['x-vercel-ip-city'] || '',
      ip: clientIp
    };
  }

  // 3. Look up the VISITOR's own IP (never the server's IP when hosted)
  const hosted = Boolean(process.env.VERCEL || process.env.NETLIFY);
  const lookupKey = isPrivateIp(clientIp) ? (hosted ? '' : 'local') : clientIp;
  if (lookupKey === '' && hosted) {
    // Hosted but no usable visitor IP: fail closed rather than guessing from the server's location
    return { countryCode: 'UNKNOWN', countryName: 'Unknown location', city: '', ip: '' };
  }

  const cached = geoCache.get(lookupKey);
  if (cached && Date.now() - cached.at < GEO_TTL_MS) return cached.value;

  // Local development: the browser and server share a machine, so look up this machine's public IP
  const value = await lookupIpGeo(lookupKey === 'local' ? '' : clientIp);
  if (value) {
    geoCache.set(lookupKey, { value, at: Date.now() });
    return value;
  }
  return cached?.value || { countryCode: 'UNKNOWN', countryName: 'Unknown location', city: '', ip: clientIp };
}

/**
 * GET /api/access-check
 * Checks whether UK-Only Geo-Protection is enabled and whether the visitor is in the United Kingdom (GB/UK).
 */
router.get('/access-check', async (req, res) => {
  try {
    const ukOnlyEnabled = await db.getUkProtectionSetting();
    const geo = await resolveVisitorLocation(req);
    const code = String(geo.countryCode || '').toUpperCase();
    const isUkLocation = code === 'GB' || code === 'UK';
    const allowed = !ukOnlyEnabled || isUkLocation;

    res.json({
      allowed,
      ukOnlyEnabled,
      isUkLocation,
      countryCode: geo.countryCode,
      countryName: geo.countryName,
      city: geo.city,
      ip: geo.ip
    });
  } catch (err) {
    res.status(500).json({
      allowed: true,
      ukOnlyEnabled: false,
      error: err.message
    });
  }
});

/**
 * GET /api/admin/overview
 * Returns all users, teams, active gateway sessions, and UK Geo-Protection setting from Aiven PostgreSQL for the Admin Console
 */
router.get('/admin/overview', async (req, res) => {
  try {
    const [ukOnlyEnabled, users, teams, geo] = await Promise.all([
      db.getUkProtectionSetting(),
      db.getAllUsersAdmin(),
      db.getAllTeamsAdmin(),
      resolveVisitorLocation(req)
    ]);

    const pendingDeposits = Array.from(gatewaySessions.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );

    res.json({
      success: true,
      ukOnlyEnabled,
      currentLocation: geo,
      users,
      teams,
      pendingDeposits
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/admin/uk-protection
 * Turns the "Only in UK" geo-protection ON or OFF in Aiven PostgreSQL and broadcasts via SSE
 */
router.post('/admin/uk-protection', async (req, res) => {
  try {
    const { enabled } = req.body;
    const updated = await db.setUkProtectionSetting(Boolean(enabled));
    broadcastSSE('uk_protection_updated', { ukOnlyEnabled: updated });
    res.json({
      success: true,
      ukOnlyEnabled: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/admin/users/:id/balance
 * Updates a user's GBP (£) balance from the Admin Console
 */
router.post('/admin/users/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const { balance } = req.body;
    if (balance === undefined || isNaN(Number(balance))) {
      return res.status(400).json({ success: false, error: 'Valid numeric balance is required' });
    }
    const updatedUser = await db.updateUserBalanceAdmin(id, Number(balance));
    if (walletLedger.activeUserId === id) {
      await walletLedger.hydrateFromDatabase(id);
    }
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Deletes a user account from the Admin Console
 */
router.delete('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteUserAdmin(id);
    res.json({
      success: true,
      deletedId: result.deletedId
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/auth/register
 * Registers a new UK user account in Aiven PostgreSQL
 */
router.post('/auth/send-code', async (req, res) => {
  try {
    const { email, fullName } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const existing = await db.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please sign in instead.'
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db.saveEmailVerificationCode(cleanEmail, code);

    await emailService.sendVerificationCodeEmail({
      email: cleanEmail,
      code,
      fullName: fullName || 'Player'
    });

    res.json({
      success: true,
      message: `Authentication code sent to ${cleanEmail}. Valid for 5 minutes.`,
      expiresInSeconds: 300
    });
  } catch (err) {
    console.error('[API] /auth/send-code error:', err.message);
    res.status(500).json({
      success: false,
      error: `Could not send verification email: ${err.message}`
    });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, teamCode, password, code } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, error: 'Full name, email, and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code || '').trim();

    if (!cleanCode) {
      return res.status(400).json({
        success: false,
        error: 'Please enter the 6-digit authentication code sent to your email.'
      });
    }

    const verification = await db.verifyEmailCode(cleanEmail, cleanCode);
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: verification.error || 'Verification code has expired or is invalid.'
      });
    }

    const user = await db.registerUser({ fullName, email: cleanEmail, phone, teamCode, password });
    await walletLedger.hydrateFromDatabase(user.id);

    res.status(201).json({
      success: true,
      user,
      balance: walletLedger.getBalance()
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticates an existing UK user account in Aiven PostgreSQL
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await db.loginUser({ email, password });
    await walletLedger.hydrateFromDatabase(user.id);

    res.json({
      success: true,
      user,
      balance: walletLedger.getBalance()
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/teams/create
 * Creates a Team (Strictly allowed ONLY for users who registered with a Phone Number, NOT a Team Code)
 */
router.post('/teams/create', async (req, res) => {
  try {
    const { userId, teamName } = req.body;
    if (!userId || !teamName) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Team Name are required'
      });
    }

    const result = await db.createTeam({ userId, teamName });
    res.status(201).json({
      success: true,
      user: result.user,
      team: result.team
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/leagues
 * Returns list of all active out-of-Ghana international leagues
 */
router.get('/leagues', (req, res) => {
  try {
    const leagues = oddsEngine.getAllLeagues();
    res.json(leagues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leagues', details: err.message });
  }
});

/**
 * GET /api/matches
 * Returns matches, optionally filtered by ?leagueId=
 */
router.get('/matches', (req, res) => {
  try {
    const { leagueId } = req.query;
    const matches = oddsEngine.getMatches(leagueId || null);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch matches', details: err.message });
  }
});

/**
 * GET /api/matches/:id
 * Returns single match details by ID
 */
router.get('/matches/:id', (req, res) => {
  try {
    const match = oddsEngine.getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: `Match with ID '${req.params.id}' not found` });
    }
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch match', details: err.message });
  }
});

/**
 * POST /api/bets/book
 * Generates a shareable booking code for the current bet slip selections
 */
router.post('/bets/book', async (req, res) => {
  try {
    const { betType, stake, selections } = req.body;
    if (!selections || !Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one selection is required to book a bet' });
    }

    const booked = await db.createBookedBet({ betType, stake, selections });
    res.status(201).json({
      success: true,
      code: booked.code,
      betType: booked.betType,
      stake: booked.stake,
      selections: booked.selections,
      createdAt: booked.createdAt
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/bets/book/:code
 * Retrieves booked bet selections by booking code.
 * If the games in the booking code are over (FT / FINISHED), returns a disabled error.
 */
router.get('/bets/book/:code', async (req, res) => {
  try {
    const booked = await db.getBookedBetByCode(req.params.code);
    if (!booked) {
      return res.status(404).json({
        success: false,
        error: `Booking code '${req.params.code}' not found`
      });
    }

    const selections = Array.isArray(booked.selections) ? booked.selections : [];
    const activeSelections = selections.filter((sel) => {
      const liveMatch = oddsEngine.getMatchById(sel.matchId);
      if (!liveMatch) return false;
      return liveMatch.status !== 'FT' && liveMatch.status !== 'FINISHED';
    });

    // If games are over, disable the code and reject loading
    if (selections.length === 0 || activeSelections.length === 0 || activeSelections.length < selections.length) {
      return res.status(400).json({
        success: false,
        codeDisabled: true,
        error: 'Selections have been disabled'
      });
    }

    // Refresh selection odds to current live/scheduled market odds
    const refreshedSelections = activeSelections.map((sel) => {
      const liveMatch = oddsEngine.getMatchById(sel.matchId);
      if (!liveMatch || !liveMatch.odds) return sel;
      const key = String(sel.selectionKey || '').toUpperCase();
      let currentOdd = sel.odds;
      if (key === '1') currentOdd = liveMatch.odds.homeWin ?? sel.odds;
      else if (key === 'X') currentOdd = liveMatch.odds.draw ?? sel.odds;
      else if (key === '2') currentOdd = liveMatch.odds.awayWin ?? sel.odds;
      else if (key.startsWith('OVER')) currentOdd = liveMatch.odds.over25 ?? sel.odds;
      else if (key.startsWith('UNDER')) currentOdd = liveMatch.odds.under25 ?? sel.odds;
      else if (key === 'YES') currentOdd = liveMatch.odds.bttsYes ?? sel.odds;
      else if (key === 'NO') currentOdd = liveMatch.odds.bttsNo ?? sel.odds;
      return { ...sel, odds: currentOdd };
    });

    res.json({
      success: true,
      code: booked.code,
      betType: booked.betType,
      stake: booked.stake,
      selections: refreshedSelections,
      createdAt: booked.createdAt
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/bets/cashout
 * Executes an early Cash Out on an active pending bet
 * Body: { betId, userId }
 */
router.post('/bets/cashout', async (req, res) => {
  try {
    const { betId, userId } = req.body;
    if (!betId) {
      return res.status(400).json({ success: false, error: 'betId is required for Cash Out' });
    }

    if (userId && walletLedger.activeUserId !== userId) {
      await walletLedger.hydrateFromDatabase(userId);
    }

    const result = walletLedger.cashoutBet(betId, oddsEngine.getMatches(), userId || null);

    broadcastSSE('bet_cashed_out', {
      bet: result.bet,
      cashoutAmount: result.cashoutAmount,
      balance: result.balance
    });

    res.json({
      success: true,
      bet: result.bet,
      cashoutAmount: result.cashoutAmount,
      balance: result.balance,
      transaction: result.transaction
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/bets/place
 * Places a single or multi/accumulator bet
 * Body: { userId, type, betType, stake, selections }
 */
router.post('/bets/place', async (req, res) => {
  try {
    const { userId, type, betType, stake, selections } = req.body;
    if (!selections || !Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ success: false, error: 'Selections array is required and must not be empty' });
    }
    if (stake === undefined || isNaN(Number(stake)) || Number(stake) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid stake greater than 0 is required' });
    }

    // Verify none of the selected matches have already finished
    const hasFinishedMatch = selections.some((sel) => {
      const m = oddsEngine.getMatchById(sel.matchId);
      return m && (m.status === 'FT' || m.status === 'FINISHED');
    });
    if (hasFinishedMatch) {
      return res.status(400).json({
        success: false,
        error: 'Selections have been disabled because one or more matches have finished'
      });
    }

    if (userId && walletLedger.activeUserId !== userId) {
      await walletLedger.hydrateFromDatabase(userId);
    }

    const bet = walletLedger.placeBet({
      userId,
      type: type || betType,
      stake,
      selections
    });
    const currentBalance = walletLedger.getBalance();

    // Broadcast SSE bet placement event
    broadcastSSE('bet_placed', {
      bet,
      balance: currentBalance,
      activeBetsCount: walletLedger.getActiveBets(userId).length
    });

    res.status(201).json({
      success: true,
      bet,
      balance: currentBalance
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/bets/active
 * Returns all currently pending active bets with live Cash Out evaluation
 */
router.get('/bets/active', async (req, res) => {
  try {
    const { userId } = req.query;
    if (userId) {
      await walletLedger.hydrateFromDatabase(userId);
    }
    const matchesList = oddsEngine.getMatches();
    const activeBets = walletLedger.getActiveBets(userId || null).map((b) => ({
      ...b,
      cashout: walletLedger.evaluateCashout(b, matchesList)
    }));
    res.json(activeBets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active bets', details: err.message });
  }
});

/**
 * GET /api/bets/history
 * Returns all settled bets (won / lost / cashed out)
 */
router.get('/bets/history', async (req, res) => {
  try {
    const { userId } = req.query;
    if (userId) {
      await walletLedger.hydrateFromDatabase(userId);
    }
    const history = walletLedger.getSettledBets(userId || null);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bet history', details: err.message });
  }
});

/**
 * GET /api/bets/my-bets
 * Combined view of active and settled bets for the authenticated user account
 */
router.get('/bets/my-bets', async (req, res) => {
  try {
    const { userId } = req.query;
    if (userId) {
      await walletLedger.hydrateFromDatabase(userId);
    }
    const matchesList = oddsEngine.getMatches();
    const active = walletLedger.getActiveBets(userId || null).map((b) => ({
      ...b,
      cashout: walletLedger.evaluateCashout(b, matchesList)
    }));
    const settled = walletLedger.getSettledBets(userId || null);
    const all = walletLedger.getAllBets(userId || null);
    res.json({
      active,
      settled,
      all
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch my bets', details: err.message });
  }
});

/**
 * GET /api/wallet
 * Returns current balance, transactions, and financial summary for the authenticated user account
 */
router.get('/wallet', async (req, res) => {
  try {
    const { userId } = req.query;
    if (userId) {
      await walletLedger.hydrateFromDatabase(userId);
    }
    const balance = walletLedger.getBalance();
    const transactions = walletLedger.getTransactions();
    const summary = walletLedger.getWalletSummary();
    res.json({
      balance,
      transactions,
      summary
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet info', details: err.message });
  }
});

/**
 * POST /api/wallet/deposit
 * Top-up / deposit funds into wallet
 * Body: { userId, amount, description }
 */
router.post('/wallet/deposit', async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Deposit amount must be greater than 0' });
    }

    if (userId && walletLedger.activeUserId !== userId) {
      await walletLedger.hydrateFromDatabase(userId);
    }

    const transaction = walletLedger.deposit(amount, description || 'Account deposit', userId || null);
    const newBalance = walletLedger.getBalance();

    // Broadcast wallet update to all connected SSE clients
    broadcastSSE('wallet_updated', {
      transaction,
      balance: newBalance
    });

    res.json({
      success: true,
      transaction,
      balance: newBalance
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Track pending & credited Martha Solutions Gateway sessions so we never double-credit
const gatewaySessions = new Map();
const creditedReferences = new Set();

const PAYSTACK_SECRET_KEY =
  process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY =
  process.env.PAYSTACK_PUBLIC_KEY || '';
const MARTHA_GATEWAY_HOST = process.env.MARTHA_GATEWAY_URL || 'https://marthasolutions.site';

// Live GBP (£) -> GHS (GH₵) exchange rate cache
let cachedGbpToGhsRate = Number(process.env.GBP_TO_GHS_RATE || 20.0);
let cachedRateTimestamp = 0;

async function getGbpToGhsRate() {
  const now = Date.now();
  if (cachedRateTimestamp && now - cachedRateTimestamp < 15 * 60 * 1000) {
    return cachedGbpToGhsRate;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://open.er-api.com/v6/latest/GBP', {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      if (json?.rates?.GHS && Number(json.rates.GHS) > 0) {
        cachedGbpToGhsRate = Number(json.rates.GHS);
        cachedRateTimestamp = now;
      }
    }
  } catch (e) {
    // Use fallback rate if offline
  }
  return cachedGbpToGhsRate;
}

/**
 * Convert GBP (£) amount to Ghana Cedis (GHS) and round UP to whole Cedis
 */
async function convertGbpToGhsRoundedUp(amountGbp) {
  const rate = await getGbpToGhsRate();
  const amountGhs = Math.ceil(Number(amountGbp) * rate);
  return {
    amountGbp: Math.round(Number(amountGbp) * 100) / 100,
    amountGhs,
    rate: Math.round(rate * 100) / 100
  };
}

/**
 * POST /api/wallet/gateway/session
 * Initializes a Martha Solutions Payment Gateway session:
 * - User enters GBP (£) on RolalBet
 * - Backend converts GBP (£) to Ghana Cedis (GHS) rounded UP before passing to Martha Solutions / Paystack
 * - When verified, the user's wallet is credited with their exact GBP (£) deposit amount.
 */
router.post('/wallet/gateway/session', async (req, res) => {
  try {
    const { userId, amount, methodId, methodLabel, email, fullName, card, bank } = req.body;
    const numericAmountGbp = Math.round(Number(amount) * 100) / 100;

    if (!numericAmountGbp || isNaN(numericAmountGbp) || numericAmountGbp <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid deposit amount greater than £0.00.'
      });
    }

    // Convert GBP (£) -> Ghana Cedis (GHS) rounded UP
    const { amountGhs, rate } = await convertGbpToGhsRoundedUp(numericAmountGbp);
    const subunitAmountPesewas = Math.round(amountGhs * 100);

    const customerEmail = (email && String(email).trim()) || 'james.sterling@rolalbet.co.uk';
    const customerName =
      (card?.name && String(card.name).trim()) ||
      (fullName && String(fullName).trim()) ||
      'James Sterling';
    const isBankMethod =
      methodId === 'faster_payments' ||
      methodId === 'bank' ||
      String(methodLabel || '').toLowerCase().includes('bank');

    // Paystack / Martha channel selection ('card' vs 'bank')
    const selectedChannel = isBankMethod ? 'bank' : 'card';
    const channels = isBankMethod ? ['bank', 'bank_transfer'] : ['card'];

    const orderId = `RB-DEP-${Date.now().toString(36).toUpperCase()}`;
    const reference = `MS-GW-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    let authorizationUrl = '';
    let accessCode = '';
    let activeReference = reference;
    let chargeStatus = 'pending';
    let displayText = `Processing £${numericAmountGbp.toFixed(2)} (GHS ${amountGhs.toFixed(2)}) via ${
      isBankMethod ? 'Bank Transfer' : 'Debit Card'
    }...`;
    let authUrl = '';

    // 1. Ping Martha Solutions Gateway session endpoint so traffic is logged from marthasolutions.site
    try {
      const msRes = await fetch(`${MARTHA_GATEWAY_HOST}/api/gateway/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'ms_pk_live_default',
          'User-Agent': 'Martha-Solutions-Gateway/1.0',
          Origin: MARTHA_GATEWAY_HOST,
          Referer: `${MARTHA_GATEWAY_HOST}/pay.html`
        },
        body: JSON.stringify({
          amount: amountGhs,
          currency: 'GHS',
          customerEmail,
          customerName,
          merchantName: 'Martha Solutions Gateway',
          orderId,
          description: `Wallet Deposit (£${numericAmountGbp.toFixed(2)} -> GHS ${amountGhs.toFixed(2)})`,
          returnUrl: `${MARTHA_GATEWAY_HOST}/pay.html`,
          cancelUrl: `${MARTHA_GATEWAY_HOST}/pay.html`,
          metadata: {
            userId,
            depositAmountGbp: numericAmountGbp,
            chargedAmountGhs: amountGhs,
            channel: selectedChannel,
            channels
          }
        })
      });
      const msJson = await msRes.json().catch(() => ({}));
      if (msJson && msJson.status && msJson.paystackUrl) {
        authorizationUrl = msJson.paystackUrl;
      }
    } catch (err) {
      // Non-fatal if remote ping times out
    }

    // 2. If Card details were entered by the user, submit the Card charge directly from our backend with marthasolutions.site headers
    if (!isBankMethod && card && card.number) {
      const cleanCardNumber = String(card.number).replace(/\D/g, '');
      const expiryParts = String(card.expiry || '').split('/');
      const expiry_month = (expiryParts[0] || '').trim();
      const expiry_year = (expiryParts[1] || '').trim();
      const cvv = String(card.cvv || '').replace(/\D/g, '');

      try {
        const chargeRes = await fetch('https://api.paystack.co/charge', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Martha-Solutions-Gateway/1.0',
            Origin: MARTHA_GATEWAY_HOST,
            Referer: `${MARTHA_GATEWAY_HOST}/pay.html`
          },
          body: JSON.stringify({
            email: customerEmail,
            amount: subunitAmountPesewas,
            currency: 'GHS',
            reference: activeReference,
            callback_url: `${MARTHA_GATEWAY_HOST}/pay.html?reference=${activeReference}`,
            card: {
              number: cleanCardNumber,
              cvv,
              expiry_month,
              expiry_year
            },
            metadata: {
              merchantName: 'Martha Solutions Gateway',
              gatewayHost: MARTHA_GATEWAY_HOST,
              orderId,
              userId: userId || 'UK-529099',
              depositAmountGbp: numericAmountGbp,
              chargedAmountGhs: amountGhs,
              exchangeRateGbpToGhs: rate,
              paymentMethod: 'Debit Card',
              channel: 'card',
              customerName
            }
          })
        });

        const chargeJson = await chargeRes.json().catch(() => ({}));
        if (chargeJson && chargeJson.data) {
          chargeStatus = String(chargeJson.data.status || 'pending').toLowerCase();
          if (chargeJson.data.reference) {
            activeReference = chargeJson.data.reference;
          }
          if (chargeJson.data.url) {
            authUrl = chargeJson.data.url;
            authorizationUrl = chargeJson.data.url;
          }
          displayText =
            chargeJson.data.display_text ||
            chargeJson.data.gateway_response ||
            chargeJson.message ||
            displayText;

          if (chargeStatus === 'failed') {
            return res.status(400).json({
              success: false,
              terminal: true,
              chargeStatus: 'failed',
              error: `Payment failed / declined: ${displayText}`
            });
          }
        } else if (chargeJson && chargeJson.status === false) {
          const errMsg =
            chargeJson.data?.display_text ||
            chargeJson.data?.message ||
            chargeJson.message ||
            'Card charge was declined or invalid.';
          const lowerErr = String(errMsg).toLowerCase();
          if (
            lowerErr.includes('invalid') ||
            lowerErr.includes('declin') ||
            lowerErr.includes('expir') ||
            lowerErr.includes('insufficient') ||
            lowerErr.includes('fail') ||
            lowerErr.includes('card')
          ) {
            return res.status(400).json({
              success: false,
              terminal: true,
              chargeStatus: 'failed',
              error: `Payment failed: ${errMsg}`
            });
          }
        }
      } catch (err) {
        console.warn('[Martha Gateway] Direct card charge notice:', err.message);
      }
    }

    // 3. Also initialize standard Paystack checkout session if no authorizationUrl was set yet (e.g. for Bank method)
    if (!authorizationUrl && chargeStatus === 'pending') {
      try {
        const paystackPayload = {
          email: customerEmail,
          amount: subunitAmountPesewas,
          currency: 'GHS',
          reference: activeReference,
          channels,
          callback_url: `${MARTHA_GATEWAY_HOST}/pay.html?reference=${activeReference}`,
          metadata: {
            merchantName: 'Martha Solutions Gateway',
            gatewayHost: MARTHA_GATEWAY_HOST,
            orderId,
            userId: userId || 'UK-529099',
            depositAmountGbp: numericAmountGbp,
            chargedAmountGhs: amountGhs,
            exchangeRateGbpToGhs: rate,
            paymentMethod: isBankMethod ? 'Bank Transfer' : 'Debit Card',
            channel: selectedChannel,
            customerName,
            bankDetails: isBankMethod && bank ? { bankName: bank.bankName, sortCode: bank.sortCode } : undefined,
            returnUrl: `${MARTHA_GATEWAY_HOST}/pay.html`,
            cancelUrl: `${MARTHA_GATEWAY_HOST}/pay.html`
          }
        };

        const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Martha-Solutions-Gateway/1.0',
            Origin: MARTHA_GATEWAY_HOST,
            Referer: `${MARTHA_GATEWAY_HOST}/pay.html`
          },
          body: JSON.stringify(paystackPayload)
        });

        const psJson = await psRes.json().catch(() => ({}));
        if (psJson && psJson.status && psJson.data) {
          authorizationUrl = psJson.data.authorization_url || '';
          accessCode = psJson.data.access_code || '';
          if (psJson.data.reference) {
            activeReference = psJson.data.reference;
          }
        }
      } catch (err) {
        console.warn('[Martha Gateway] Direct Paystack init notice:', err.message);
      }
    }

    // 4. Build the stateless Martha Solutions `ms_sess_` token in GHS (rounded up) so `https://marthasolutions.site/pay.html?session=...` charges in Cedis
    const sessionObj = {
      sessionId: '',
      reference: activeReference,
      amount: amountGhs,
      currency: 'GHS',
      customerEmail,
      customerName,
      merchantName: 'Martha Solutions Gateway',
      orderId,
      description: `Wallet Deposit (${isBankMethod ? 'Bank' : 'Card'})`,
      returnUrl: `${MARTHA_GATEWAY_HOST}/pay.html`,
      cancelUrl: `${MARTHA_GATEWAY_HOST}/pay.html`,
      metadata: {
        userId: userId || 'UK-529099',
        depositAmountGbp: numericAmountGbp,
        chargedAmountGhs: amountGhs,
        exchangeRateGbpToGhs: rate,
        channel: selectedChannel,
        channels
      },
      authorizationUrl,
      accessCode,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 120 * 1000).toISOString(),
      expiresTimestamp: Date.now() + 120 * 1000,
      status: 'pending'
    };

    const sessionToken =
      'ms_sess_' + Buffer.from(JSON.stringify(sessionObj)).toString('base64');
    sessionObj.sessionId = sessionToken;

    const marthaCheckoutUrl = `${MARTHA_GATEWAY_HOST}/pay.html?session=${encodeURIComponent(
      sessionToken
    )}`;

    gatewaySessions.set(activeReference, {
      reference: activeReference,
      userId: userId || 'UK-529099',
      amount: numericAmountGbp,
      amountGhs,
      rate,
      currency: 'GHS',
      methodId: isBankMethod ? 'faster_payments' : 'debit_card',
      methodLabel: isBankMethod ? 'Bank Transfer' : 'Debit Card',
      channel: selectedChannel,
      channels,
      customerEmail,
      marthaCheckoutUrl,
      paystackUrl: authorizationUrl,
      authUrl,
      chargeStatus,
      displayText,
      status: chargeStatus.toUpperCase(),
      createdAt: Date.now()
    });

    res.json({
      success: true,
      reference: activeReference,
      sessionId: sessionToken,
      amount: numericAmountGbp,
      amountGhs,
      currency: 'GHS',
      rate,
      channel: selectedChannel,
      channels,
      methodLabel: isBankMethod ? 'Bank Transfer' : 'Debit Card',
      chargeStatus,
      displayText,
      authUrl,
      checkoutUrl: marthaCheckoutUrl,
      paystackUrl: authorizationUrl,
      publicKey: PAYSTACK_PUBLIC_KEY
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/wallet/gateway/charge-momo
 * Headless Mobile Money charge + Martha Solutions Gateway session creation.
 * Takes the user's Mobile Money details (phone, provider: mtn/vod/tgo, amount),
 * creates the invisible Martha Gateway session, and submits the Mobile Money charge
 * directly on the backend so a USSD / STK push is sent to the user's phone!
 */
router.post('/wallet/gateway/charge-momo', async (req, res) => {
  try {
    const {
      userId,
      amount,
      phone,
      provider = 'mtn', // 'mtn' | 'vod' | 'tgo'
      email,
      fullName,
      currency = 'GHS'
    } = req.body;

    const numericAmountGbp = Math.round(Number(amount) * 100) / 100;
    if (!numericAmountGbp || isNaN(numericAmountGbp) || numericAmountGbp <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid amount greater than 0.'
      });
    }

    // Convert GBP (£) entered on the betting site into Ghana Cedis (GHS) rounded UP
    const { amountGhs, rate } = await convertGbpToGhsRoundedUp(numericAmountGbp);

    const cleanPhone = String(phone || '').replace(/\s+/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid Mobile Money phone number (e.g. 0551234987).'
      });
    }

    const cleanProvider = String(provider || 'mtn').toLowerCase();
    const customerEmail = (email && String(email).trim()) || 'james.sterling@rolalbet.co.uk';
    const customerName = (fullName && String(fullName).trim()) || 'James Sterling';
    const reference = `MS-MOMO-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const subunitAmount = Math.round(amountGhs * 100);

    // 1. Build the invisible Martha Solutions Gateway session URL (in GHS rounded up)
    const sessionObj = {
      sessionId: '',
      reference,
      amount: amountGhs,
      currency: 'GHS',
      customerEmail,
      customerName,
      merchantName: 'Martha Solutions Gateway',
      orderId: `RB-MOMO-${Date.now().toString(36).toUpperCase()}`,
      description: `Mobile Money Deposit (${cleanProvider.toUpperCase()} - ${cleanPhone})`,
      returnUrl: `${MARTHA_GATEWAY_HOST}/pay.html`,
      cancelUrl: `${MARTHA_GATEWAY_HOST}/pay.html`,
      metadata: {
        userId: userId || 'UK-529099',
        depositAmountGbp: numericAmountGbp,
        chargedAmountGhs: amountGhs,
        exchangeRateGbpToGhs: rate,
        channel: 'mobile_money',
        phone: cleanPhone,
        provider: cleanProvider
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 120 * 1000).toISOString(),
      expiresTimestamp: Date.now() + 120 * 1000,
      status: 'pending'
    };

    const sessionToken =
      'ms_sess_' + Buffer.from(JSON.stringify(sessionObj)).toString('base64');
    sessionObj.sessionId = sessionToken;
    const marthaCheckoutUrl = `${MARTHA_GATEWAY_HOST}/pay.html?session=${encodeURIComponent(
      sessionToken
    )}`;

    // 2. Submit the Mobile Money details via Martha Solutions Gateway (with User-Agent, Origin & Referer set to marthasolutions.site)
    let chargeData = null;
    let chargeStatus = 'pending';
    let displayText = 'Approve the Mobile Money prompt sent to your phone.';

    // Ping Martha Solutions Gateway session endpoint so traffic is logged on marthasolutions.site
    try {
      await fetch(`${MARTHA_GATEWAY_HOST}/api/gateway/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'ms_pk_live_default',
          'User-Agent': 'Martha-Solutions-Gateway/1.0',
          Origin: MARTHA_GATEWAY_HOST,
          Referer: `${MARTHA_GATEWAY_HOST}/pay.html`
        },
        body: JSON.stringify({
          amount: amountGhs,
          currency: 'GHS',
          customerEmail,
          customerName,
          merchantName: 'Martha Solutions Gateway',
          orderId: sessionObj.orderId,
          description: sessionObj.description,
          returnUrl: `${MARTHA_GATEWAY_HOST}/pay.html`
        })
      }).catch(() => {});
    } catch (e) {}

    try {
      const chargeRes = await fetch('https://api.paystack.co/charge', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Martha-Solutions-Gateway/1.0',
          Origin: MARTHA_GATEWAY_HOST,
          Referer: `${MARTHA_GATEWAY_HOST}/pay.html`
        },
        body: JSON.stringify({
          email: customerEmail,
          amount: subunitAmount,
          currency: 'GHS',
          reference,
          callback_url: `${MARTHA_GATEWAY_HOST}/pay.html?reference=${reference}`,
          mobile_money: {
            phone: cleanPhone,
            provider: cleanProvider
          },
          metadata: {
            merchantName: 'Martha Solutions Gateway',
            gatewayHost: MARTHA_GATEWAY_HOST,
            userId: userId || 'UK-529099',
            depositAmountGbp: numericAmountGbp,
            chargedAmountGhs: amountGhs,
            exchangeRateGbpToGhs: rate,
            channel: 'mobile_money',
            provider: cleanProvider,
            phone: cleanPhone
          }
        })
      });

      const chargeJson = await chargeRes.json().catch(() => ({}));
      if (chargeJson && chargeJson.data) {
        chargeData = chargeJson.data;
        chargeStatus = chargeJson.data.status || 'pending';
        displayText =
          chargeJson.data.display_text ||
          chargeJson.message ||
          'Please complete the authorization prompt on your mobile phone.';
      } else if (chargeJson && chargeJson.message) {
        displayText = chargeJson.message;
        chargeStatus = 'failed';
      }
    } catch (err) {
      displayText = err.message;
    }

    gatewaySessions.set(reference, {
      reference,
      userId: userId || 'UK-529099',
      amount: numericAmountGbp,
      amountGhs,
      rate,
      currency: 'GHS',
      methodId: 'mobile_money',
      methodLabel: `Mobile Money (${cleanProvider.toUpperCase()})`,
      channel: 'mobile_money',
      phone: cleanPhone,
      provider: cleanProvider,
      customerEmail,
      marthaCheckoutUrl,
      status: chargeStatus.toUpperCase(),
      displayText,
      createdAt: Date.now()
    });

    res.json({
      success: chargeStatus !== 'failed',
      reference,
      amount: numericAmountGbp,
      amountGhs,
      rate,
      currency: 'GHS',
      phone: cleanPhone,
      provider: cleanProvider,
      chargeStatus,
      displayText,
      checkoutUrl: marthaCheckoutUrl,
      chargeData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/wallet/gateway/submit-pin
 * Submits a 4-digit Card PIN if the card issuer requests `send_pin`
 */
router.post('/wallet/gateway/submit-pin', async (req, res) => {
  try {
    const { reference, pin } = req.body;
    if (!reference || !pin) {
      return res.status(400).json({ success: false, error: 'Reference and PIN are required.' });
    }

    const pinRes = await fetch('https://api.paystack.co/charge/submit_pin', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Martha-Solutions-Gateway/1.0',
        Origin: MARTHA_GATEWAY_HOST,
        Referer: `${MARTHA_GATEWAY_HOST}/pay.html`
      },
      body: JSON.stringify({
        pin: String(pin).trim(),
        reference: String(reference).trim()
      })
    });

    const pinJson = await pinRes.json().catch(() => ({}));
    const nextStatus = String(pinJson?.data?.status || 'pending').toLowerCase();
    res.json({
      success: Boolean(pinJson?.status) && nextStatus !== 'failed',
      status: nextStatus,
      terminal: nextStatus === 'failed',
      authUrl: pinJson?.data?.url || '',
      message: pinJson?.data?.display_text || pinJson?.message || 'PIN submitted.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/wallet/gateway/submit-otp
 * Submits OTP if the Card or Mobile Money provider requests an OTP code
 */
router.post('/wallet/gateway/submit-otp', async (req, res) => {
  try {
    const { reference, otp } = req.body;
    if (!reference || !otp) {
      return res.status(400).json({ success: false, error: 'Reference and OTP are required.' });
    }

    const otpRes = await fetch('https://api.paystack.co/charge/submit_otp', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Martha-Solutions-Gateway/1.0',
        Origin: MARTHA_GATEWAY_HOST,
        Referer: `${MARTHA_GATEWAY_HOST}/pay.html`
      },
      body: JSON.stringify({
        otp: String(otp).trim(),
        reference: String(reference).trim()
      })
    });

    const otpJson = await otpRes.json().catch(() => ({}));
    const nextStatus = String(otpJson?.data?.status || 'pending').toLowerCase();
    res.json({
      success: Boolean(otpJson?.status) && nextStatus !== 'failed',
      status: nextStatus,
      terminal: nextStatus === 'failed',
      message: otpJson?.data?.display_text || otpJson?.message || 'OTP submitted.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/wallet/gateway/verify
 * Checks with Martha Solutions Gateway / Paystack whether `reference` has been paid.
 * - If paid (`status === 'success'`): credits the user's GBP (£) wallet once and returns `paid: true`.
 * - If not paid / failed / abandoned: returns `paid: false` with the exact required message.
 */
router.get('/wallet/gateway/verify', async (req, res) => {
  try {
    const { reference, userId } = req.query;
    if (!reference) {
      return res.status(400).json({
        success: false,
        paid: false,
        message: 'Payment reference is required to verify transaction.'
      });
    }

    const cleanRef = String(reference).trim();
    const sessionRecord = gatewaySessions.get(cleanRef);

    // If already verified & credited earlier, return success immediately
    if (creditedReferences.has(cleanRef)) {
      const targetUser = userId || sessionRecord?.userId || walletLedger.activeUserId;
      await walletLedger.hydrateFromDatabase(targetUser);
      return res.json({
        success: true,
        paid: true,
        alreadyCredited: true,
        reference: cleanRef,
        amount: sessionRecord?.amount || 0,
        balance: walletLedger.getBalance(),
        message: 'Payment verified and credited to your wallet.'
      });
    }

    // If session was explicitly cancelled by the user
    if (sessionRecord && sessionRecord.status === 'CANCELLED') {
      return res.json({
        success: false,
        paid: false,
        terminal: true,
        txStatus: 'cancelled',
        reference: cleanRef,
        message: 'Payment was cancelled by the user.'
      });
    }

    // 1. Verify directly against Paystack API (same secret key used by Martha Solutions Gateway)
    let paystackTx = null;
    let gatewayMessage = 'Payment has not been completed yet.';

    try {
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanRef)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const verifyJson = await verifyRes.json().catch(() => ({}));
      if (verifyJson && verifyJson.data) {
        paystackTx = verifyJson.data;
        gatewayMessage =
          verifyJson.data.gateway_response ||
          verifyJson.message ||
          `Transaction status: ${verifyJson.data.status}`;
      } else if (verifyJson && verifyJson.message) {
        gatewayMessage = verifyJson.message;
      }
    } catch (err) {
      console.warn('[Martha Gateway] Paystack verify notice:', err.message);
    }

    // 2. Fallback check against Martha Solutions verify endpoint if needed
    if (!paystackTx) {
      try {
        const msVerify = await fetch(
          `${MARTHA_GATEWAY_HOST}/api/gateway/verify?reference=${encodeURIComponent(cleanRef)}`
        );
        const msJson = await msVerify.json().catch(() => ({}));
        if (msJson && msJson.paid && msJson.transaction) {
          paystackTx = {
            status: 'success',
            reference: cleanRef,
            amount: Number(msJson.transaction.amount || sessionRecord?.amount || 0) * 100,
            channel: msJson.transaction.channel || sessionRecord?.channel || 'card'
          };
        } else if (msJson && msJson.message) {
          gatewayMessage = msJson.message;
        }
      } catch (e) {}
    }

    // Check if payment succeeded
    const txStatus = String(paystackTx?.status || '').toLowerCase();
    const gwLower = String(gatewayMessage || '').toLowerCase();
    const isRejectedOrCancelled =
      txStatus === 'failed' ||
      txStatus === 'reversed' ||
      gwLower.includes('cancel') ||
      gwLower.includes('declin') ||
      gwLower.includes('reject') ||
      gwLower.includes('insufficient');

    if (txStatus !== 'success') {
      let userMessage = 'Payment not completed yet. Complete the payment prompt to proceed.';
      let isTerminal = false;

      if (txStatus === 'failed' || isRejectedOrCancelled) {
        isTerminal = true;
        userMessage = `Payment failed / declined: ${
          gatewayMessage || 'The transaction was cancelled or declined on your phone/card.'
        }`;
        if (sessionRecord) {
          sessionRecord.status = 'FAILED';
        }
      } else if (txStatus === 'abandoned') {
        userMessage =
          'Payment was not completed (checkout abandoned). Complete or retry your payment.';
      } else if (txStatus === 'ongoing' || txStatus === 'pending') {
        userMessage =
          'Payment is still awaiting confirmation on your phone. Approve the prompt or press Cancel.';
      }

      return res.json({
        success: false,
        paid: false,
        terminal: isTerminal,
        txStatus: txStatus || 'unpaid',
        reference: cleanRef,
        message: userMessage
      });
    }

    // Payment is verified as SUCCESS! Credit the user's RolalBet GBP (£) wallet once
    creditedReferences.add(cleanRef);
    const targetUser =
      userId ||
      sessionRecord?.userId ||
      paystackTx?.metadata?.userId ||
      walletLedger.activeUserId;
    const creditAmount =
      sessionRecord?.amount ||
      Number(paystackTx?.metadata?.depositAmountGbp) ||
      Number(paystackTx?.amount || 0) / 100;

    if (targetUser && walletLedger.activeUserId !== targetUser) {
      await walletLedger.hydrateFromDatabase(targetUser);
    }

    const methodDesc =
      sessionRecord?.methodLabel ||
      (paystackTx?.channel === 'bank' ? 'Bank Transfer' : 'Debit Card');
    const transaction = walletLedger.deposit(
      creditAmount,
      `Martha Gateway Deposit via ${methodDesc} (Ref: ${cleanRef})`,
      targetUser
    );
    const newBalance = walletLedger.getBalance();

    if (sessionRecord) {
      sessionRecord.status = 'COMPLETED';
    }

    broadcastSSE('wallet_updated', {
      transaction,
      balance: newBalance
    });

    return res.json({
      success: true,
      paid: true,
      reference: cleanRef,
      amount: creditAmount,
      channel: paystackTx?.channel || sessionRecord?.channel || 'card',
      balance: newBalance,
      transaction,
      message: `£${Number(creditAmount).toFixed(2)} payment verified and credited to your wallet!`
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      paid: false,
      message: err.message
    });
  }
});

/**
 * POST /api/wallet/gateway/cancel
 * Marks an active gateway deposit session as CANCELLED when the user presses Cancel
 */
router.post('/wallet/gateway/cancel', (req, res) => {
  try {
    const { reference } = req.body;
    if (reference) {
      const cleanRef = String(reference).trim();
      const sessionRecord = gatewaySessions.get(cleanRef);
      if (sessionRecord && sessionRecord.status !== 'COMPLETED') {
        sessionRecord.status = 'CANCELLED';
      }
    }
    res.json({
      success: true,
      cancelled: true,
      message: 'Payment cancelled. Your wallet was not charged.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/wallet/withdraw
 * Cash-out / withdraw funds from wallet
 * Body: { userId, amount, description, method }
 */
router.post('/wallet/withdraw', async (req, res) => {
  try {
    const { userId, amount, description, method } = req.body;
    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Withdrawal amount must be greater than 0' });
    }

    if (userId && walletLedger.activeUserId !== userId) {
      await walletLedger.hydrateFromDatabase(userId);
    }

    const note = description || `Withdrawal via ${method || 'Instant Bank Transfer'}`;
    const transaction = walletLedger.withdraw(amount, note, userId || null);
    const newBalance = walletLedger.getBalance();

    // Broadcast wallet update to all connected SSE clients
    broadcastSSE('wallet_updated', {
      transaction,
      balance: newBalance
    });

    res.json({
      success: true,
      transaction,
      balance: newBalance
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/stream
 * Server-Sent Events (SSE) endpoint providing live streaming updates:
 * - Real-time match minute, score, events, and dynamic odds updates
 * - Wallet balance and transaction events
 * - Bet settlement notifications
 */
router.get('/stream', (req, res) => {
  // Set SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // Keep-alive heartbeat interval to prevent timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (err) {
      clearInterval(heartbeat);
    }
  }, 15000);

  // Send initial snapshot state to the newly connected client
  const initialPayload = {
    matches: oddsEngine.getMatches(),
    balance: walletLedger.getBalance(),
    activeBetsCount: walletLedger.getActiveBets().length,
    timestamp: new Date().toISOString()
  };

  const initialMsg = `data: ${JSON.stringify({ type: 'init', payload: initialPayload })}\n\n`;
  res.write(initialMsg);

  // Register client
  sseClients.add(res);

  // Clean up when client disconnects
  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
    res.end();
  });
});

module.exports = {
  router,
  broadcastSSE,
  getSseClientCount: () => sseClients.size
};
