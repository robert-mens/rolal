/**
 * Dynamic Sports Data & Odds Engine
 * Manages in-memory live matches, real-time tick simulations, Poisson-based dynamic odds adjustments,
 * and automated match completion events for settlement.
 */

const EventEmitter = require('events');
const { LEAGUES } = require('../data/leagues');

// Realistic Goal Scorer Name Pools by Region
const GOALSCORERS = {
  brazil: ['Danilo Silva', 'Lucas Paquetá', 'Gabriel Natan', 'Thiago Mendes', 'Matheus Carioca', 'Erick Bahia', 'Felipe Alagoas', 'Juninho Acreano', 'Diego Rocha', 'Bruno Cantanhede'],
  australia: ['Jesse Fuller', 'Liam Higgins', 'Oliver McDonald', 'Noah Shamaki', 'Dylan Rogers', 'Lachlan Hunter', 'Cameron Burgess', 'Harrison Delbridge', 'Joe O\'Brien', 'Declan Hughes'],
  germany: ['Lukas Podolski', 'Felix Casalino', 'Stefan Oerterer', 'Maximilian Hippe', 'Nico Buckmaier', 'Fabian Eberle', 'Julian Kudala', 'Kevin Freiberger', 'Marvin Schurig', 'Tim Kaminski'],
  'south-africa': ['Ashley Cupido', 'Kganyago Mashego', 'Sipho Mbule', 'Thabiso Kutumela', 'Bonginkosi Makume', 'Junior Dion', 'Mahlatsi Makudubela', 'Sphiwe Mahlangu', 'Menzi Ndwandwe'],
  england: ['Cemil Cemal', 'Ethan Mayhew', 'Fletcher Toll', 'Reuben Marshall', 'Tyrell Shannon', 'Jack Sambrook', 'Callum Watts', 'Archie Proctor', 'Brad Wellmen', 'Harry Hope'],
  japan: ['Koki Matsumura', 'Takuma Ito', 'Ryota Nakamura', 'Shuto Kitagawa', 'Yuki Omoto', 'Haruki Nishimura', 'Kazuki Sato', 'Daiki Tanaka', 'Shohei Takeda', 'Kenjiro Ogawa']
};

class OddsEngine extends EventEmitter {
  constructor() {
    super();
    this.leagues = [];
    this.matches = new Map();
    this.matchFinishedListeners = [];
    this.timer = null;
    this.tickCount = 0;

    this.initializeData();
  }

  /**
   * Clone initial data from leagues.js into active in-memory state
   */
  initializeData() {
    this.leagues = JSON.parse(JSON.stringify(LEAGUES));
    this.matches.clear();

    for (const league of this.leagues) {
      if (Array.isArray(league.matches)) {
        for (const match of league.matches) {
          // Store match reference in Map
          this.matches.set(match.id, match);
        }
      }
    }
  }

  /**
   * Get all active leagues with match counts
   */
  getAllLeagues() {
    return this.leagues.map(league => {
      const leagueMatches = this.getMatches(league.id);
      const liveCount = leagueMatches.filter(m => m.status === 'LIVE').length;
      const scheduledCount = leagueMatches.filter(m => m.status === 'SCHEDULED').length;
      const ftCount = leagueMatches.filter(m => m.status === 'FT').length;

      return {
        id: league.id,
        name: league.name,
        country: league.country,
        countryCode: league.countryCode,
        flag: league.flag,
        categoryId: league.categoryId,
        season: league.season,
        tier: league.tier,
        apiFootballId: league.apiFootballId,
        teamsCount: (league.teams || []).length,
        liveCount,
        scheduledCount,
        ftCount,
        totalMatches: leagueMatches.length
      };
    });
  }

  /**
   * Get matches, optionally filtered by leagueId
   */
  getMatches(leagueId = null) {
    const all = Array.from(this.matches.values());
    if (!leagueId) {
      return all;
    }
    return all.filter(m => m.leagueId === leagueId);
  }

  /**
   * Get specific match by ID
   */
  getMatchById(id) {
    return this.matches.get(id) || null;
  }

  /**
   * Register a callback for when any match reaches FT
   */
  onMatchFinished(callback) {
    if (typeof callback === 'function') {
      this.matchFinishedListeners.push(callback);
    }
    return () => {
      this.matchFinishedListeners = this.matchFinishedListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Math helper: Poisson probability P(k; lambda) = (lambda^k * e^-lambda) / k!
   */
  static poissonProb(k, lambda) {
    if (lambda <= 0) return k === 0 ? 1 : 0;
    let fact = 1;
    for (let i = 2; i <= k; i++) fact *= i;
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / fact;
  }

  /**
   * Dynamic odds calculation using bivariate Poisson model with bookmaker margins
   */
  calculateDynamicOdds(match) {
    if (match.status === 'FT') {
      return match.odds;
    }

    const curHome = match.score.home || 0;
    const curAway = match.score.away || 0;
    const minute = Math.min(90, Math.max(1, match.minute || 1));
    const remainingFraction = Math.max(0.01, (90 - minute) / 90);

    // Baseline goal expectancy remaining
    const homeStrength = (match.homeTeam && match.homeTeam.strength) || 1.15;
    const awayStrength = (match.awayTeam && match.awayTeam.strength) || 1.00;

    const baseHomeRate = 1.35 * (homeStrength / awayStrength);
    const baseAwayRate = 1.05 * (awayStrength / homeStrength);

    const lambdaHome = Math.max(0.02, baseHomeRate * remainingFraction);
    const lambdaAway = Math.max(0.02, baseAwayRate * remainingFraction);

    let probHomeWin = 0;
    let probDraw = 0;
    let probAwayWin = 0;
    let probOver25 = 0;
    let probUnder25 = 0;
    let probBttsYes = 0;
    let probBttsNo = 0;

    const MAX_GOALS = 6;
    for (let kh = 0; kh <= MAX_GOALS; kh++) {
      const ph = OddsEngine.poissonProb(kh, lambdaHome);
      for (let ka = 0; ka <= MAX_GOALS; ka++) {
        const pa = OddsEngine.poissonProb(ka, lambdaAway);
        const pJoint = ph * pa;

        const finalH = curHome + kh;
        const finalA = curAway + ka;

        // 1X2 outcomes
        if (finalH > finalA) probHomeWin += pJoint;
        else if (finalH === finalA) probDraw += pJoint;
        else probAwayWin += pJoint;

        // Over / Under 2.5
        if (finalH + finalA > 2.5) probOver25 += pJoint;
        else probUnder25 += pJoint;

        // Both Teams To Score (BTTS)
        if (finalH > 0 && finalA > 0) probBttsYes += pJoint;
        else probBttsNo += pJoint;
      }
    }

    // Normalization with bookmaker margin (~5-6% vigorish)
    const margin1X2 = 1.06;
    const marginOU = 1.05;
    const marginBTTS = 1.05;

    const total1X2Prob = Math.max(0.01, probHomeWin + probDraw + probAwayWin);
    const normHomeProb = (probHomeWin / total1X2Prob) * margin1X2;
    const normDrawProb = (probDraw / total1X2Prob) * margin1X2;
    const normAwayProb = (probAwayWin / total1X2Prob) * margin1X2;

    const clampOdd = (prob, minVal = 1.01, maxVal = 50.0) => {
      if (prob <= 0.005) return maxVal;
      const val = 1 / prob;
      return Math.round(Math.min(maxVal, Math.max(minVal, val)) * 100) / 100;
    };

    // Calculate 1X2 odds
    const homeWin = clampOdd(normHomeProb);
    const draw = clampOdd(normDrawProb);
    const awayWin = clampOdd(normAwayProb);

    // Over / Under 2.5
    let over25, under25;
    if (curHome + curAway >= 3) {
      // Over 2.5 is already achieved
      over25 = 1.01;
      under25 = 50.0;
    } else {
      const totalOU = Math.max(0.01, probOver25 + probUnder25);
      over25 = clampOdd((probOver25 / totalOU) * marginOU);
      under25 = clampOdd((probUnder25 / totalOU) * marginOU);
    }

    // BTTS Yes / No
    let bttsYes, bttsNo;
    if (curHome > 0 && curAway > 0) {
      // Both teams have already scored
      bttsYes = 1.01;
      bttsNo = 50.0;
    } else {
      const totalBTTS = Math.max(0.01, probBttsYes + probBttsNo);
      bttsYes = clampOdd((probBttsYes / totalBTTS) * marginBTTS);
      bttsNo = clampOdd((probBttsNo / totalBTTS) * marginBTTS);
    }

    return {
      homeWin,
      draw,
      awayWin,
      over25,
      under25,
      bttsYes,
      bttsNo
    };
  }

  /**
   * Main simulation tick called periodically (e.g. every 2-3 seconds)
   * Advances live matches, generates realistic attacks/goals, recalculates odds, and settles matches
   */
  tickSimulation() {
    this.tickCount++;
    const finishedMatches = [];

    for (const match of this.matches.values()) {
      if (match.status === 'LIVE') {
        // Reset temporary live locks from previous tick
        if (match.oddsSuspended) {
          match.oddsSuspended = false;
        }
        match.cashoutLocked = false;

        // Half-time handling: pause 1 tick at 45'
        if (match.minute === 45 && match.period === '1H') {
          match.period = 'HT';
          continue;
        } else if (match.minute === 45 && match.period === 'HT') {
          match.period = '2H';
          match.minute = 46;
        } else {
          match.minute += 1;
        }

        // Match finished at 90'
        if (match.minute >= 90) {
          match.minute = 90;
          match.status = 'FT';
          match.period = 'FT';
          match.oddsSuspended = true;
          finishedMatches.push(match);
          continue;
        }

        // Realistic live events during match
        const league = this.leagues.find(l => l.id === match.leagueId);
        const categoryId = league ? league.categoryId : 'brazil';
        const playerPool = GOALSCORERS[categoryId] || GOALSCORERS.brazil;

        // ~3.5% chance of goal per simulated minute (realistic ~2.5 - 3.1 total goals per 90m)
        const goalRoll = Math.random();
        if (goalRoll < 0.038) {
          // Determine scoring team based on relative form & possession
          const isHomeScore = Math.random() < 0.58;
          const scoringTeam = isHomeScore ? 'home' : 'away';
          const teamObj = isHomeScore ? match.homeTeam : match.awayTeam;

          match.score[scoringTeam] += 1;
          const randomPlayer = playerPool[Math.floor(Math.random() * playerPool.length)];

          // Record goal event
          match.events = match.events || [];
          match.events.push({
            minute: match.minute,
            type: 'goal',
            team: scoringTeam,
            teamName: teamObj.name,
            player: randomPlayer,
            score: { home: match.score.home, away: match.score.away }
          });

          // Temporarily suspend odds on goal (standard live sportsbook VAR/goal lock)
          match.oddsSuspended = true;
          match.cashoutLocked = true;

          // Increment shot on target
          if (match.stats && match.stats.shotsOnTarget) {
            match.stats.shotsOnTarget[scoringTeam] += 1;
          }
        } else if (goalRoll < 0.35) {
          // Dangerous attack / shot / corner update — temporarily lock cashout
          match.cashoutLocked = true;
          const team = Math.random() < 0.55 ? 'home' : 'away';
          if (match.stats) {
            if (Math.random() < 0.5 && match.stats.shotsOnTarget) {
              match.stats.shotsOnTarget[team] += 1;
            } else if (match.stats.corners) {
              match.stats.corners[team] += 1;
            }
          }
        }

        // Recalculate dynamic odds
        match.odds = this.calculateDynamicOdds(match);
      }
    }

    // Process finished matches: emit events and trigger callbacks
    for (const match of finishedMatches) {
      this.emit('matchFinished', match);
      for (const listener of this.matchFinishedListeners) {
        try {
          listener(match);
        } catch (err) {
          console.error(`[OddsEngine] Error in onMatchFinished listener for match ${match.id}:`, err);
        }
      }

      // Check if league has any other live match; if not, promote the first scheduled match to LIVE
      this.autoPromoteNextScheduledMatch(match.leagueId);
    }

    // Ensure every league always maintains at least 1 LIVE match and 2 SCHEDULED matches
    for (const league of this.leagues) {
      this.autoPromoteNextScheduledMatch(league.id);
    }

    return {
      tick: this.tickCount,
      liveCount: this.getMatches().filter(m => m.status === 'LIVE').length,
      finishedCount: finishedMatches.length
    };
  }

  /**
   * If a league has no LIVE matches left, promote a SCHEDULED match to LIVE at minute 1
   * Ensures uninterrupted in-play betting excitement!
   */
  autoPromoteNextScheduledMatch(leagueId) {
    // Ensure upcoming fixtures pipeline is replenished first
    let remainingScheduled = this.getMatches(leagueId).filter(m => m.status === 'SCHEDULED');
    while (remainingScheduled.length < 3) {
      this.generateFutureFixture(leagueId);
      remainingScheduled = this.getMatches(leagueId).filter(m => m.status === 'SCHEDULED');
      if (remainingScheduled.length === 0) break;
    }

    const leagueMatches = this.getMatches(leagueId);
    const hasLive = leagueMatches.some(m => m.status === 'LIVE');
    if (!hasLive) {
      const nextScheduled = leagueMatches.find(m => m.status === 'SCHEDULED');
      if (nextScheduled) {
        nextScheduled.status = 'LIVE';
        nextScheduled.period = '1H';
        nextScheduled.minute = 1;
        nextScheduled.score = { home: 0, away: 0 };
        nextScheduled.events = [];
        nextScheduled.oddsSuspended = false;
        nextScheduled.odds = this.calculateDynamicOdds(nextScheduled);
      }
    }
  }

  /**
   * Generates a new future fixture for a league to guarantee continuous upcoming action
   */
  generateFutureFixture(leagueId) {
    const league = this.leagues.find(l => l.id === leagueId);
    if (!league || !league.teams || league.teams.length < 2) return;

    const shuffled = [...league.teams].sort(() => 0.5 - Math.random());
    const homeTeam = shuffled[0];
    const awayTeam = shuffled[1];

    const futureHours = Math.floor(Math.random() * 48) + 4;
    const startTime = new Date(Date.now() + futureHours * 3600 * 1000).toISOString();
    const id = `match-${leagueId}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const match = {
      id,
      leagueId,
      homeTeam,
      awayTeam,
      status: 'SCHEDULED',
      minute: 0,
      score: { home: 0, away: 0 },
      period: 'PRE',
      odds: null,
      oddsSuspended: false,
      events: [],
      stats: {
        possession: { home: 50, away: 50 },
        shotsOnTarget: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 }
      },
      startTime
    };
    match.odds = this.calculateDynamicOdds(match);
    this.matches.set(id, match);
  }

  /**
   * Start periodic simulation timer
   */
  startSimulation(intervalMs = 2500) {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      this.tickSimulation();
    }, intervalMs);
    console.log(`[OddsEngine] Live simulation loop started (${intervalMs}ms interval)`);
  }

  /**
   * Stop periodic simulation timer
   */
  stopSimulation() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[OddsEngine] Live simulation loop stopped');
    }
  }
}

// Export singleton instance
const oddsEngineInstance = new OddsEngine();
module.exports = oddsEngineInstance;
