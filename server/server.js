/**
 * Main Platform Orchestration Server
 * RolalBet United Kingdom Sportsbook
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { router, broadcastSSE, getSseClientCount } = require('./routes/api');
const oddsEngine = require('./services/oddsEngine');
const walletLedger = require('./services/walletLedger');
const db = require('./services/db');

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_PORT = process.env.ADMIN_PORT || 4001;

// Separate Standalone Admin Server (runs on its own URL: http://localhost:4001)
const adminApp = express();
adminApp.use(cors());
adminApp.use(express.json());
adminApp.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});
adminApp.get('/test-momo', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-momo.html'));
});
adminApp.get('/test-sms', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-sms.html'));
});
adminApp.get('/test-sms.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-sms.html'));
});

// Middleware
app.use(cors());
app.use(express.json());

// Standalone Mobile Money Invisible Gateway Test Page
app.get('/test-momo.html', (req, res) => {
  if (process.env.VERCEL) return res.status(404).end();
  res.sendFile(path.join(__dirname, 'test-momo.html'));
});
// Standalone SMS Test Page (disabled on hosted deployments)
app.get(['/test-sms', '/test-sms.html'], (req, res) => {
  if (process.env.NETLIFY || process.env.VERCEL) return res.status(404).end();
  res.sendFile(path.join(__dirname, 'test-sms.html'));
});

// API Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'RolalBet United Kingdom Sportsbook API',
    databaseConnected: db.isDatabaseConnected(),
    uptime: process.uptime(),
    activeSseClients: getSseClientCount(),
    balance: walletLedger.getBalance(),
    matchesCount: oddsEngine.getMatches().length
  });
});

// Mount API routes
app.use('/api', router);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack || err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Match settlement listener: settles bets when match reaches FT
oddsEngine.onMatchFinished((match) => {
  try {
    const homeName = match.homeTeam ? match.homeTeam.name : 'Home';
    const awayName = match.awayTeam ? match.awayTeam.name : 'Away';
    console.log(`[Server] Match finished: ${match.id} (${homeName} ${match.score?.home ?? 0} - ${match.score?.away ?? 0} ${awayName})`);

    const settledBets = walletLedger.settleMatch(match);
    if (settledBets.length > 0) {
      console.log(`[Server] Settled ${settledBets.length} bet(s). Current balance: ${walletLedger.getBalance()}`);
    }

    // Broadcast match finished and settled bets over SSE
    broadcastSSE('match_finished', {
      match,
      settledBets,
      balance: walletLedger.getBalance()
    });
  } catch (err) {
    console.error('[Server] Error settling finished match:', err);
  }
});

// Simulation loop: tick every 2.5 seconds
const TICK_INTERVAL_MS = 2500;
let tickTimer = null;

function startTickLoop() {
  if (tickTimer) return;
  tickTimer = setInterval(() => {
    try {
      const tickResult = oddsEngine.tickSimulation();

      // Broadcast updated live match state & wallet balance over SSE
      broadcastSSE('tick', {
        tick: tickResult.tick,
        liveCount: tickResult.liveCount,
        matches: oddsEngine.getMatches(),
        balance: walletLedger.getBalance()
      });
    } catch (err) {
      console.error('[Server] Error during tickSimulation:', err);
    }
  }, TICK_INTERVAL_MS);
}

function stopTickLoop() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

// Initialize Aiven PostgreSQL database and hydrate ledger
db.initDatabase()
  .then((ok) => {
    if (ok) {
      return walletLedger.hydrateFromDatabase();
    }
  })
  .catch((err) => {
    console.error('[Server] Database startup notice:', err.message);
  });

// Start simulation tick loop (not on serverless hosts)
if (!process.env.VERCEL) {
  startTickLoop();
}

// Start HTTP server
let server = null;
let adminServer = null;
if (process.env.NODE_ENV !== 'test-manual' && !process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`[Server] RolalBet UK Sportsbook API server running on port ${PORT}`);
    console.log(`[Server] SSE stream active at http://localhost:${PORT}/api/stream`);
  });

  adminServer = adminApp.listen(ADMIN_PORT, () => {
    console.log(`[Admin Server] Standalone Admin Console running at http://localhost:${ADMIN_PORT}`);
  });
}

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('[Server] Gracefully shutting down...');
  stopTickLoop();
  if (adminServer) {
    adminServer.close();
  }
  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
  app,
  server,
  startTickLoop,
  stopTickLoop,
  broadcastSSE
};
