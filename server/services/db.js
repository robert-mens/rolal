/**
 * Aiven PostgreSQL Database Service
 * RolalBet UK Sportsbook Platform
 */

require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.PG_HOST || 'pg-316fb7fc-rolal-bet.i.aivencloud.com',
  port: Number(process.env.PG_PORT || 20177),
  database: process.env.PG_DATABASE || 'defaultdb',
  user: process.env.PG_USER || 'avnadmin',
  password: process.env.PG_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  max: Number(process.env.PG_CONNECTION_LIMIT || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

let isConnected = false;

pool.on('error', (err) => {
  console.error('[Aiven PostgreSQL] Unexpected idle client error:', err.message);
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

/**
 * Initialize schema and seed default demo account on Aiven PostgreSQL
 */
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(64) DEFAULT '+44 7700 900077',
        team_code VARCHAR(64),
        team_name VARCHAR(255),
        registered_via VARCHAR(32) DEFAULT 'phone',
        password_hash VARCHAR(255) NOT NULL,
        jurisdiction VARCHAR(128) DEFAULT 'United Kingdom (UK)',
        tier VARCHAR(64) DEFAULT 'UK Tier 1 Verified',
        balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      ALTER TABLE users ALTER COLUMN balance SET DEFAULT 0.00;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS team_code VARCHAR(64);
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS team_name VARCHAR(255);
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS registered_via VARCHAR(32) DEFAULT 'phone';
    `);

    // 1b. Teams table (Created by phone-registered users; joined by team-code users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        code VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Transactions ledger table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(64) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        balance_after NUMERIC(12, 2) NOT NULL,
        description TEXT,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Bets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bets (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        type VARCHAR(32) NOT NULL,
        stake NUMERIC(12, 2) NOT NULL,
        total_odds NUMERIC(12, 2) NOT NULL,
        potential_return NUMERIC(12, 2) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        selections JSONB NOT NULL,
        placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        settled_at TIMESTAMPTZ
      );
    `);

    // 4. Booked Bets table (for booking codes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS booked_bets (
        code VARCHAR(32) PRIMARY KEY,
        bet_type VARCHAR(32) NOT NULL DEFAULT 'multi',
        stake NUMERIC(12, 2) NOT NULL DEFAULT 10.00,
        selections JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Platform Settings table (for UK Geo-Protection toggle & global config)
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        key VARCHAR(64) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(
      `INSERT INTO platform_settings (key, value)
       VALUES ('uk_only_protection', $1)
       ON CONFLICT (key) DO NOTHING`,
      [JSON.stringify({ enabled: true })]
    );

    // 4. Ensure default UK Demo user exists
    const demoCheck = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      ['demo@rolalbet.co.uk']
    );

    if (demoCheck.rowCount === 0) {
      await client.query(
        `INSERT INTO users (id, full_name, email, phone, password_hash, jurisdiction, tier, balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          'UK-849102',
          'Oliver Harrison',
          'demo@rolalbet.co.uk',
          '+44 7700 900077',
          hashPassword('demo1234'),
          'United Kingdom (UK)',
          'UK Tier 1 Verified',
          1000.00
        ]
      );
    }

    await client.query('COMMIT');
    isConnected = true;
    console.log('[Aiven PostgreSQL] Connected & schema verified on pg-316fb7fc-rolal-bet.i.aivencloud.com:20177/defaultdb');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Aiven PostgreSQL] Initialization error:', err.message);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Load persisted state (balance, transactions, bets) from Aiven PostgreSQL
 * When userId is passed, filters transactions and bets strictly for that user account.
 */
async function loadLedgerState(userId = null) {
  try {
    let balance = 0.00;
    const targetUserId = userId || 'UK-849102';

    const userRes = await pool.query(`SELECT balance FROM users WHERE id = $1 LIMIT 1`, [targetUserId]);
    if (userRes.rowCount > 0) {
      balance = Number(userRes.rows[0].balance);
    }

    const txRes = userId
      ? await pool.query(
          `SELECT id, user_id, type, amount, balance_after, description, timestamp
           FROM transactions
           WHERE user_id = $1
           ORDER BY timestamp DESC
           LIMIT 100`,
          [userId]
        )
      : await pool.query(
          `SELECT id, user_id, type, amount, balance_after, description, timestamp
           FROM transactions
           ORDER BY timestamp DESC
           LIMIT 200`
        );

    const betsRes = userId
      ? await pool.query(
          `SELECT id, user_id, type, stake, total_odds, potential_return, status, selections, placed_at, settled_at
           FROM bets
           WHERE user_id = $1
           ORDER BY placed_at DESC
           LIMIT 200`,
          [userId]
        )
      : await pool.query(
          `SELECT id, user_id, type, stake, total_odds, potential_return, status, selections, placed_at, settled_at
           FROM bets
           ORDER BY placed_at DESC
           LIMIT 300`
        );

    return {
      balance,
      transactions: txRes.rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        type: r.type,
        amount: Number(r.amount),
        balanceAfter: Number(r.balance_after),
        description: r.description,
        timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp
      })),
      bets: betsRes.rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        type: r.type,
        stake: Number(r.stake),
        totalOdds: Number(r.total_odds),
        potentialReturn: Number(r.potential_return),
        cashedOutAmount: r.status === 'CASHED_OUT' ? Number(r.potential_return) : undefined,
        payout: (r.status === 'WON' || r.status === 'CASHED_OUT') ? Number(r.potential_return) : 0,
        status: r.status,
        selections: typeof r.selections === 'string' ? JSON.parse(r.selections) : r.selections,
        placedAt: r.placed_at instanceof Date ? r.placed_at.toISOString() : r.placed_at,
        settledAt: r.settled_at ? (r.settled_at instanceof Date ? r.settled_at.toISOString() : r.settled_at) : undefined
      }))
    };
  } catch (err) {
    console.error('[Aiven PostgreSQL] Failed to load ledger state:', err.message);
    return null;
  }
}

/**
 * Persist a transaction and update user balance in Aiven PostgreSQL
 */
async function saveTransaction(tx, newBalance, userId = 'UK-849102') {
  try {
    await pool.query(
      `INSERT INTO transactions (id, user_id, type, amount, balance_after, description, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        tx.id,
        userId,
        tx.type,
        tx.amount,
        tx.balanceAfter,
        tx.description || '',
        tx.timestamp || new Date().toISOString()
      ]
    );

    if (userId) {
      await pool.query(
        `UPDATE users SET balance = $1 WHERE id = $2`,
        [newBalance, userId]
      );
    }
  } catch (err) {
    console.error('[Aiven PostgreSQL] Error saving transaction:', err.message);
  }
}

/**
 * Persist a newly placed bet in Aiven PostgreSQL
 */
async function saveBet(bet, userId = 'UK-849102') {
  try {
    await pool.query(
      `INSERT INTO bets (id, user_id, type, stake, total_odds, potential_return, status, selections, placed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        bet.id,
        userId,
        bet.type,
        bet.stake,
        bet.totalOdds,
        bet.potentialReturn,
        bet.status,
        JSON.stringify(bet.selections),
        bet.placedAt || new Date().toISOString()
      ]
    );
  } catch (err) {
    console.error('[Aiven PostgreSQL] Error saving bet:', err.message);
  }
}

/**
 * Update a settled or partially updated bet in Aiven PostgreSQL
 */
async function updateBetStatus(bet) {
  try {
    const returnVal =
      bet.status === 'CASHED_OUT' && bet.cashedOutAmount != null
        ? bet.cashedOutAmount
        : bet.potentialReturn;
    await pool.query(
      `UPDATE bets
       SET status = $1, selections = $2, settled_at = $3, potential_return = COALESCE($4, potential_return)
       WHERE id = $5`,
      [
        bet.status,
        JSON.stringify(bet.selections),
        bet.settledAt || null,
        returnVal,
        bet.id
      ]
    );
  } catch (err) {
    console.error('[Aiven PostgreSQL] Error updating bet status:', err.message);
  }
}

/**
 * Register a new UK user account in Aiven PostgreSQL (supports either UK Phone Number or Team Code)
 * - Users registering with a UK Phone Number can later create a Team.
 * - Users registering with a Team Code join that Team, see the Team Name on their Account page, and cannot create a Team.
 */
async function registerUser({ fullName, email, phone, teamCode, password }) {
  const cleanEmail = String(email).trim().toLowerCase();
  const existing = await pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [cleanEmail]);
  if (existing.rowCount > 0) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const userId = `UK-${Math.floor(100000 + Math.random() * 900000)}`;
  const cleanTeamCode = teamCode ? String(teamCode).trim().toUpperCase() : null;
  let resolvedTeamCode = null;
  let resolvedTeamName = null;
  let registeredVia = 'phone';
  let cleanPhone = (phone && String(phone).trim()) || '+44 7700 900077';

  if (cleanTeamCode) {
    const teamRes = await pool.query(
      `SELECT code, name FROM teams WHERE UPPER(code) = $1 LIMIT 1`,
      [cleanTeamCode]
    );
    if (teamRes.rowCount === 0) {
      throw new Error(`Invalid Team Code '${cleanTeamCode}'. Please enter a valid Team Code created by a team owner.`);
    }
    resolvedTeamCode = teamRes.rows[0].code;
    resolvedTeamName = teamRes.rows[0].name;
    registeredVia = 'team';
    cleanPhone = null;
  }

  const passwordHash = hashPassword(password);
  const initialBalance = 0.00;

  const res = await pool.query(
    `INSERT INTO users (id, full_name, email, phone, team_code, team_name, registered_via, password_hash, jurisdiction, tier, balance)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'United Kingdom (UK)', 'UK Tier 1 Verified', $9)
     RETURNING id, full_name, email, phone, team_code, team_name, registered_via, jurisdiction, tier, balance, created_at`,
    [
      userId,
      fullName.trim(),
      cleanEmail,
      cleanPhone,
      resolvedTeamCode,
      resolvedTeamName,
      registeredVia,
      passwordHash,
      initialBalance
    ]
  );

  const row = res.rows[0];
  return formatUserRow(row);
}

/**
 * Authenticate an existing UK user account against Aiven PostgreSQL
 */
async function loginUser({ email, password }) {
  const cleanEmail = String(email).trim().toLowerCase();
  const res = await pool.query(
    `SELECT id, full_name, email, phone, team_code, team_name, registered_via, password_hash, jurisdiction, tier, balance, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [cleanEmail]
  );

  if (res.rowCount === 0) {
    throw new Error('No account found with this email address. Please create an account.');
  }

  const row = res.rows[0];
  const expectedHash = hashPassword(password);
  if (row.password_hash !== expectedHash) {
    throw new Error('Incorrect password for this account.');
  }

  // If user has a team_code but missing team_name, hydrate from teams table
  if (row.team_code && !row.team_name) {
    const tRes = await pool.query(`SELECT name FROM teams WHERE UPPER(code) = $1 LIMIT 1`, [
      String(row.team_code).toUpperCase()
    ]);
    if (tRes.rowCount > 0) {
      row.team_name = tRes.rows[0].name;
    }
  }

  return formatUserRow(row);
}

/**
 * Create a new Team (Strictly restricted to users who registered with a Phone Number, NOT a Team Code)
 */
async function createTeam({ userId, teamName }) {
  if (!userId) {
    throw new Error('Authentication required to create a team.');
  }
  const cleanName = String(teamName || '').trim();
  if (cleanName.length < 2) {
    throw new Error('Team Name must be at least 2 characters long.');
  }

  const userRes = await pool.query(
    `SELECT id, full_name, email, phone, team_code, team_name, registered_via, jurisdiction, tier, balance, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  if (userRes.rowCount === 0) {
    throw new Error('User account not found.');
  }

  const userRow = userRes.rows[0];
  const regVia = userRow.registered_via || (userRow.phone ? 'phone' : 'team');

  if (regVia === 'team' || !userRow.phone) {
    throw new Error('Only users who registered with a UK mobile number can create a team.');
  }

  if (userRow.team_code) {
    throw new Error(`You have already created a team (${userRow.team_name || userRow.team_code}).`);
  }

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const code = `ROLAL-${suffix}`;

  await pool.query(
    `INSERT INTO teams (code, name, owner_user_id)
     VALUES ($1, $2, $3)`,
    [code, cleanName, userId]
  );

  const updatedRes = await pool.query(
    `UPDATE users
     SET team_code = $1, team_name = $2, registered_via = 'phone'
     WHERE id = $3
     RETURNING id, full_name, email, phone, team_code, team_name, registered_via, jurisdiction, tier, balance, created_at`,
    [code, cleanName, userId]
  );

  return {
    user: formatUserRow(updatedRes.rows[0]),
    team: {
      code,
      name: cleanName,
      ownerUserId: userId
    }
  };
}

function formatUserRow(row) {
  const createdDate = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  const registeredVia = row.registered_via || (row.phone ? 'phone' : 'team');
  const canCreateTeam = registeredVia === 'phone' && Boolean(row.phone) && !row.team_code;

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || null,
    teamCode: row.team_code || null,
    teamName: row.team_name || null,
    registeredVia,
    canCreateTeam,
    jurisdiction: row.jurisdiction,
    tier: row.tier,
    balance: Number(row.balance),
    createdAt: createdDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  };
}

const inMemoryBookedBets = new Map();

function generateBookingCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let part = '';
  for (let i = 0; i < 6; i++) {
    part += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RB-${part}`;
}

async function createBookedBet({ betType = 'multi', stake = 10, selections = [] }) {
  const code = generateBookingCode();
  const normalizedCode = code.toUpperCase();
  const numStake = Number(stake) > 0 ? Number(stake) : 10;
  const record = {
    code: normalizedCode,
    betType: String(betType || 'multi').toLowerCase(),
    stake: numStake,
    selections,
    createdAt: new Date().toISOString()
  };

  inMemoryBookedBets.set(normalizedCode, record);
  inMemoryBookedBets.set(normalizedCode.replace('-', ''), record);

  try {
    await pool.query(
      `INSERT INTO booked_bets (code, bet_type, stake, selections)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET selections = EXCLUDED.selections, stake = EXCLUDED.stake, bet_type = EXCLUDED.bet_type`,
      [normalizedCode, record.betType, record.stake, JSON.stringify(selections)]
    );
  } catch (err) {
    console.error('[Aiven PostgreSQL] Booked bet save notice:', err.message);
  }

  return record;
}

async function getBookedBetByCode(rawCode) {
  if (!rawCode) return null;
  const clean = String(rawCode).trim().toUpperCase();
  const withPrefix = clean.startsWith('RB-')
    ? clean
    : clean.startsWith('RB')
    ? `RB-${clean.slice(2)}`
    : `RB-${clean}`;

  if (inMemoryBookedBets.has(clean)) {
    return inMemoryBookedBets.get(clean);
  }
  if (inMemoryBookedBets.has(withPrefix)) {
    return inMemoryBookedBets.get(withPrefix);
  }

  try {
    const res = await pool.query(
      `SELECT code, bet_type, stake, selections, created_at
       FROM booked_bets
       WHERE UPPER(code) = $1 OR UPPER(code) = $2
       LIMIT 1`,
      [clean, withPrefix]
    );
    if (res.rowCount > 0) {
      const row = res.rows[0];
      return {
        code: row.code,
        betType: row.bet_type,
        stake: Number(row.stake),
        selections: typeof row.selections === 'string' ? JSON.parse(row.selections) : row.selections,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
      };
    }
  } catch (err) {
    console.error('[Aiven PostgreSQL] Booked bet lookup error:', err.message);
  }

  return null;
}

let cachedUkOnlyProtection = true;

async function getUkProtectionSetting() {
  try {
    const res = await pool.query(
      `SELECT value FROM platform_settings WHERE key = 'uk_only_protection' LIMIT 1`
    );
    if (res.rowCount > 0) {
      const val = typeof res.rows[0].value === 'string' ? JSON.parse(res.rows[0].value) : res.rows[0].value;
      cachedUkOnlyProtection = Boolean(val?.enabled);
      return cachedUkOnlyProtection;
    }
  } catch (err) {
    console.warn('[Aiven PostgreSQL] UK protection setting lookup fallback:', err.message);
  }
  return cachedUkOnlyProtection;
}

async function setUkProtectionSetting(enabled) {
  const boolVal = Boolean(enabled);
  cachedUkOnlyProtection = boolVal;
  try {
    await pool.query(
      `INSERT INTO platform_settings (key, value, updated_at)
       VALUES ('uk_only_protection', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify({ enabled: boolVal })]
    );
  } catch (err) {
    console.error('[Aiven PostgreSQL] Error saving UK protection setting:', err.message);
  }
  return cachedUkOnlyProtection;
}

async function getAllUsersAdmin() {
  const res = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.team_code, u.team_name, u.registered_via, u.jurisdiction, u.tier, u.balance, u.created_at,
            (SELECT COUNT(*) FROM bets b WHERE b.user_id = u.id) AS total_bets
     FROM users u
     ORDER BY u.created_at DESC`
  );
  return res.rows.map((row) => ({
    ...formatUserRow(row),
    totalBets: Number(row.total_bets || 0)
  }));
}

async function getAllTeamsAdmin() {
  const res = await pool.query(
    `SELECT t.code, t.name, t.owner_user_id, t.created_at,
            u.full_name AS owner_name, u.email AS owner_email,
            (SELECT COUNT(*) FROM users m WHERE UPPER(m.team_code) = UPPER(t.code)) AS member_count
     FROM teams t
     LEFT JOIN users u ON u.id = t.owner_user_id
     ORDER BY t.created_at DESC`
  );
  return res.rows.map((r) => ({
    code: r.code,
    name: r.name,
    ownerUserId: r.owner_user_id,
    ownerName: r.owner_name || 'Unknown',
    ownerEmail: r.owner_email || '',
    memberCount: Number(r.member_count || 0),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
  }));
}

async function updateUserBalanceAdmin(userId, newBalance) {
  const numericBalance = Math.max(0, Math.round(Number(newBalance) * 100) / 100);
  const res = await pool.query(
    `UPDATE users
     SET balance = $1
     WHERE id = $2
     RETURNING id, full_name, email, phone, team_code, team_name, registered_via, jurisdiction, tier, balance, created_at`,
    [numericBalance, userId]
  );
  if (res.rowCount === 0) {
    throw new Error('User not found.');
  }
  return formatUserRow(res.rows[0]);
}

async function deleteUserAdmin(userId) {
  await pool.query(`DELETE FROM transactions WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM bets WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM teams WHERE owner_user_id = $1`, [userId]);
  const res = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [userId]);
  if (res.rowCount === 0) {
    throw new Error('User not found.');
  }
  return { deletedId: userId };
}

module.exports = {
  pool,
  initDatabase,
  loadLedgerState,
  saveTransaction,
  saveBet,
  updateBetStatus,
  registerUser,
  loginUser,
  createTeam,
  createBookedBet,
  getBookedBetByCode,
  getUkProtectionSetting,
  setUkProtectionSetting,
  getAllUsersAdmin,
  getAllTeamsAdmin,
  updateUserBalanceAdmin,
  deleteUserAdmin,
  isDatabaseConnected: () => isConnected
};
