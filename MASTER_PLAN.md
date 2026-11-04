# MASTER ARCHITECTURE PLAN: GLOBAL BETTING SPORTSBOOK (OUT-OF-GHANA LEAGUES)

## 1. System Overview
A high-performance, business-scaled football betting platform focused on verified out-of-Ghana coverage gap leagues:
- **Brazil State Leagues**: Campeonato Acreano, Campeonato Amapaense
- **Australia Regional Football**: Western Australia State League 1, Queensland Premier League 1
- **Germany Non-Top-Tier**: Oberliga (Westfalen, Bayern)
- **South Africa**: Motsepe Foundation Championship (National First Division)
- **England Non-League Step 4**: Isthmian League North, Isthmian South Central, Northern Midlands
- **Japan**: Japan Football League (JFL)

## 2. Agent Assignments
- **Agent 1 (`sports-data-engine`)**:
  - Implements `server/data/leagues.js` and `server/services/oddsEngine.js`
  - Handles API-Football v3 schema structures, fixture generation, in-play minute ticks, goal events, dynamic odds adjustments (1X2, Over/Under 2.5, Both Teams to Score GG/NG), and odds suspension upon goals.
- **Agent 2 (`betting-ledger-service`)**:
  - Implements `server/services/walletLedger.js`
  - Handles double-entry ledger style wallet balance, deposits, withdrawals, bet placement, accumulator multiplier calculations, and match outcome settlement with automated payouts.
- **Agent 3 (`sportsbook-frontend`)**:
  - Implements `client/` React + Vite + Tailwind CSS frontend
  - Creates SportyBet-inspired dark theme UI, country/league quick-switchers, dynamic pulsating odds buttons, sticky betslip drawer (Singles & Acca/Multibet), My Bets modal, and wallet top-up modal.
- **Agent 4 (`platform-orchestrator`)**:
  - Implements `server/routes/api.js`, `server/server.js`, root and client `package.json`, Vite configuration with API proxy, dependency installations, and end-to-end integration tests.

## 3. API Contract
- `GET /api/leagues` -> List of active international leagues with country flags, icons, and match counts.
- `GET /api/matches?leagueId={id}` -> List of matches with status (LIVE, SCHEDULED, FT), scores, and current odds (1X2, Over/Under, BTTS).
- `GET /api/stream` -> Server-Sent Events (SSE) streaming live score and odds updates every 2 seconds.
- `POST /api/bets/place` -> Place single or multi-bet with validation.
- `GET /api/bets/my-bets` -> Retrieve active/settled user bets.
- `GET /api/wallet` -> Current balance and transaction history.
- `POST /api/wallet/deposit` -> Mock deposit to test wallet functionality.
