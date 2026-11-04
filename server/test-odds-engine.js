/**
 * Verification test for leagues data and oddsEngine service
 */

const { LEAGUES } = require('./data/leagues');
const oddsEngine = require('./services/oddsEngine');

console.log('--- 1. Testing leagues.js ---');
console.log(`Total leagues defined: ${LEAGUES.length}`);
if (LEAGUES.length < 11) {
  console.error(`Expected at least 11 leagues, found ${LEAGUES.length}`);
  process.exit(1);
}

for (const league of LEAGUES) {
  console.log(`[League] ${league.flag} ${league.name} (${league.country}, ID: ${league.id}, Matches: ${league.matches.length})`);
  if (!league.matches || league.matches.length < 3) {
    console.error(`League ${league.id} does not have at least 3 matches!`);
    process.exit(1);
  }

  for (const m of league.matches) {
    const requiredProps = ['id', 'leagueId', 'homeTeam', 'awayTeam', 'status', 'minute', 'score', 'period', 'odds'];
    for (const prop of requiredProps) {
      if (m[prop] === undefined) {
        console.error(`Match ${m.id} missing property: ${prop}`);
        process.exit(1);
      }
    }
    const requiredOdds = ['homeWin', 'draw', 'awayWin', 'over25', 'under25', 'bttsYes', 'bttsNo'];
    for (const odd of requiredOdds) {
      if (typeof m.odds[odd] !== 'number' || isNaN(m.odds[odd])) {
        console.error(`Match ${m.id} has invalid odd for ${odd}: ${m.odds[odd]}`);
        process.exit(1);
      }
    }
  }
}
console.log('✓ All leagues and matches match schema requirements!\n');

console.log('--- 2. Testing oddsEngine.js methods ---');
const allLeagues = oddsEngine.getAllLeagues();
console.log(`getAllLeagues() returned ${allLeagues.length} leagues`);
const sampleLeague = allLeagues[0];
console.log(`Sample league metadata:`, {
  id: sampleLeague.id,
  name: sampleLeague.name,
  liveCount: sampleLeague.liveCount,
  scheduledCount: sampleLeague.scheduledCount,
  totalMatches: sampleLeague.totalMatches
});

const allMatches = oddsEngine.getMatches();
console.log(`getMatches() total matches: ${allMatches.length}`);

const acreanoMatches = oddsEngine.getMatches('brazil-acreano');
console.log(`getMatches('brazil-acreano') matches: ${acreanoMatches.length}`);

const firstMatchId = allMatches[0].id;
const matchById = oddsEngine.getMatchById(firstMatchId);
console.log(`getMatchById('${firstMatchId}'): found ${matchById ? matchById.homeTeam.name + ' vs ' + matchById.awayTeam.name : 'null'}`);

console.log('\n--- 3. Testing matchFinished callback & tickSimulation() ---');
let finishedCallbackFired = false;
let finishedMatchData = null;

const unregister = oddsEngine.onMatchFinished((match) => {
  finishedCallbackFired = true;
  finishedMatchData = match;
  console.log(`[CALLBACK FIRED] Match finished: ${match.homeTeam.name} ${match.score.home} - ${match.score.away} ${match.awayTeam.name} (ID: ${match.id})`);
});

// Find a live match and advance it to 89' to test FT settlement
const liveMatch = allMatches.find(m => m.status === 'LIVE');
console.log(`Testing with live match ${liveMatch.id} (currently min ${liveMatch.minute}, score ${liveMatch.score.home}-${liveMatch.score.away})`);
liveMatch.minute = 89;

console.log('Ticking simulation...');
const tickResult = oddsEngine.tickSimulation();
console.log('Tick result:', tickResult);

console.log(`Live match status after tick: ${liveMatch.status}, min: ${liveMatch.minute}, period: ${liveMatch.period}`);
if (liveMatch.status !== 'FT') {
  console.error(`Match expected to be FT at 90', got status: ${liveMatch.status}`);
  process.exit(1);
}

if (!finishedCallbackFired || !finishedMatchData) {
  console.error('onMatchFinished callback was not fired!');
  process.exit(1);
}
console.log('✓ Match finished event and settlement callback fired properly!\n');

console.log('--- 4. Testing dynamic odds calculation on tick ---');
// Test multiple ticks on another live match
const anotherLive = oddsEngine.getMatches().find(m => m.status === 'LIVE');
if (anotherLive) {
  console.log(`Testing ticks on live match: ${anotherLive.id} (${anotherLive.homeTeam.name} vs ${anotherLive.awayTeam.name})`);
  console.log(`Before ticks: min ${anotherLive.minute}, score ${anotherLive.score.home}-${anotherLive.score.away}, odds:`, anotherLive.odds);
  
  for (let i = 0; i < 5; i++) {
    oddsEngine.tickSimulation();
  }
  
  console.log(`After 5 ticks: min ${anotherLive.minute}, score ${anotherLive.score.home}-${anotherLive.score.away}, odds:`, anotherLive.odds);
  console.log(`Events recorded: ${anotherLive.events.length}`);
}

unregister();
console.log('\n✓ ALL TESTS PASSED SUCCESSFULLY!');
