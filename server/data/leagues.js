/**
 * Out-of-Ghana Football Leagues and Live/Scheduled Match Data
 * Verified API-Football v3 schema structures & realistic teams/fixtures
 */

const LEAGUES = [
  {
    id: 'brazil-acreano',
    name: 'Campeonato Acreano',
    country: 'Brazil',
    countryCode: 'BR',
    flag: '🇧🇷',
    categoryId: 'brazil',
    season: '2026',
    tier: 'State League 1st Division',
    apiFootballId: 479,
    teams: [
      { id: 'ac-rio-branco', name: 'Rio Branco FC', shortName: 'RBR', form: ['W', 'W', 'D', 'W', 'L'], strength: 1.25, logo: 'https://media.api-sports.io/football/teams/124.png' },
      { id: 'ac-atletico', name: 'Atlético Acreano', shortName: 'AAC', form: ['L', 'W', 'W', 'D', 'W'], strength: 1.15, logo: 'https://media.api-sports.io/football/teams/125.png' },
      { id: 'ac-galvez', name: 'Galvez EC', shortName: 'GAL', form: ['W', 'D', 'L', 'W', 'D'], strength: 1.05, logo: 'https://media.api-sports.io/football/teams/126.png' },
      { id: 'ac-humaita', name: 'Humaitá SC', shortName: 'HUM', form: ['W', 'W', 'W', 'D', 'W'], strength: 1.30, logo: 'https://media.api-sports.io/football/teams/127.png' },
      { id: 'ac-vasco', name: 'Vasco da Gama AC', shortName: 'VAS', form: ['D', 'L', 'L', 'W', 'D'], strength: 0.90, logo: 'https://media.api-sports.io/football/teams/128.png' },
      { id: 'ac-placido', name: 'Plácido de Castro', shortName: 'PDC', form: ['L', 'W', 'D', 'L', 'L'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/129.png' },
      { id: 'ac-sao-francisco', name: 'São Francisco AC', shortName: 'SFA', form: ['L', 'L', 'D', 'W', 'L'], strength: 0.80, logo: 'https://media.api-sports.io/football/teams/130.png' },
      { id: 'ac-andira', name: 'Andirá EC', shortName: 'AND', form: ['L', 'L', 'L', 'D', 'L'], strength: 0.70, logo: 'https://media.api-sports.io/football/teams/131.png' }
    ],
    matches: [
      {
        id: 'match-acreano-101',
        leagueId: 'brazil-acreano',
        homeTeam: { id: 'ac-rio-branco', name: 'Rio Branco FC', shortName: 'RBR', form: ['W', 'W', 'D', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/124.png' },
        awayTeam: { id: 'ac-galvez', name: 'Galvez EC', shortName: 'GAL', form: ['W', 'D', 'L', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/126.png' },
        status: 'LIVE',
        minute: 63,
        score: { home: 2, away: 1 },
        period: '2H',
        odds: {
          homeWin: 1.48,
          draw: 3.75,
          awayWin: 7.20,
          over25: 1.05,
          under25: 8.50,
          bttsYes: 1.01,
          bttsNo: 15.00
        },
        oddsSuspended: false,
        events: [
          { minute: 18, type: 'goal', team: 'home', teamName: 'Rio Branco FC', player: 'Matheus Carioca', score: { home: 1, away: 0 } },
          { minute: 41, type: 'goal', team: 'away', teamName: 'Galvez EC', player: 'Erick Bahia', score: { home: 1, away: 1 } },
          { minute: 55, type: 'goal', team: 'home', teamName: 'Rio Branco FC', player: 'Davi Cunha', score: { home: 2, away: 1 } }
        ],
        stats: {
          possession: { home: 56, away: 44 },
          shotsOnTarget: { home: 6, away: 3 },
          corners: { home: 5, away: 2 },
          yellowCards: { home: 2, away: 3 }
        },
        startTime: new Date(Date.now() - 65 * 60 * 1000).toISOString()
      },
      {
        id: 'match-acreano-102',
        leagueId: 'brazil-acreano',
        homeTeam: { id: 'ac-humaita', name: 'Humaitá SC', shortName: 'HUM', form: ['W', 'W', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/127.png' },
        awayTeam: { id: 'ac-atletico', name: 'Atlético Acreano', shortName: 'AAC', form: ['L', 'W', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/125.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 1.85,
          draw: 3.40,
          awayWin: 4.10,
          over25: 1.90,
          under25: 1.88,
          bttsYes: 1.82,
          bttsNo: 1.94
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 45 * 60 * 1000).toISOString()
      },
      {
        id: 'match-acreano-103',
        leagueId: 'brazil-acreano',
        homeTeam: { id: 'ac-vasco', name: 'Vasco da Gama AC', shortName: 'VAS', form: ['D', 'L', 'L', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/128.png' },
        awayTeam: { id: 'ac-placido', name: 'Plácido de Castro', shortName: 'PDC', form: ['L', 'W', 'D', 'L', 'L'], logo: 'https://media.api-sports.io/football/teams/129.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.30,
          draw: 3.10,
          awayWin: 3.05,
          over25: 2.10,
          under25: 1.70,
          bttsYes: 1.88,
          bttsNo: 1.88
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 120 * 60 * 1000).toISOString()
      },
      {
        id: 'match-acreano-104',
        leagueId: 'brazil-acreano',
        homeTeam: { id: 'ac-sao-francisco', name: 'São Francisco AC', shortName: 'SFA', form: ['L', 'L', 'D', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/130.png' },
        awayTeam: { id: 'ac-andira', name: 'Andirá EC', shortName: 'AND', form: ['L', 'L', 'L', 'D', 'L'], logo: 'https://media.api-sports.io/football/teams/131.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.15,
          draw: 3.25,
          awayWin: 3.20,
          over25: 1.95,
          under25: 1.82,
          bttsYes: 1.80,
          bttsNo: 1.96
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 240 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'brazil-amapaense',
    name: 'Campeonato Amapaense',
    country: 'Brazil',
    countryCode: 'BR',
    flag: '🇧🇷',
    categoryId: 'brazil',
    season: '2026',
    tier: 'State League 1st Division',
    apiFootballId: 480,
    teams: [
      { id: 'ap-trem', name: 'Trem DC', shortName: 'TRM', form: ['W', 'W', 'W', 'D', 'W'], strength: 1.35, logo: 'https://media.api-sports.io/football/teams/132.png' },
      { id: 'ap-santos', name: 'Santos AP', shortName: 'SAN', form: ['W', 'D', 'W', 'L', 'W'], strength: 1.20, logo: 'https://media.api-sports.io/football/teams/133.png' },
      { id: 'ap-ypiranga', name: 'Ypiranga Clube', shortName: 'YPI', form: ['D', 'W', 'L', 'W', 'D'], strength: 1.05, logo: 'https://media.api-sports.io/football/teams/134.png' },
      { id: 'ap-oratorio', name: 'Oratório RC', shortName: 'ORA', form: ['W', 'L', 'W', 'W', 'D'], strength: 1.10, logo: 'https://media.api-sports.io/football/teams/135.png' },
      { id: 'ap-macapa', name: 'EC Macapá', shortName: 'MAC', form: ['L', 'W', 'D', 'L', 'W'], strength: 0.90, logo: 'https://media.api-sports.io/football/teams/136.png' },
      { id: 'ap-santana', name: 'Santana EC', shortName: 'STN', form: ['L', 'L', 'L', 'W', 'L'], strength: 0.75, logo: 'https://media.api-sports.io/football/teams/137.png' },
      { id: 'ap-sao-paulo', name: 'São Paulo AP', shortName: 'SPA', form: ['L', 'D', 'L', 'L', 'D'], strength: 0.70, logo: 'https://media.api-sports.io/football/teams/138.png' }
    ],
    matches: [
      {
        id: 'match-amapaense-201',
        leagueId: 'brazil-amapaense',
        homeTeam: { id: 'ap-trem', name: 'Trem DC', shortName: 'TRM', form: ['W', 'W', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/132.png' },
        awayTeam: { id: 'ap-santos', name: 'Santos AP', shortName: 'SAN', form: ['W', 'D', 'W', 'L', 'W'], logo: 'https://media.api-sports.io/football/teams/133.png' },
        status: 'LIVE',
        minute: 38,
        score: { home: 1, away: 0 },
        period: '1H',
        odds: {
          homeWin: 1.62,
          draw: 3.45,
          awayWin: 5.50,
          over25: 1.82,
          under25: 1.94,
          bttsYes: 1.85,
          bttsNo: 1.90
        },
        oddsSuspended: false,
        events: [
          { minute: 22, type: 'goal', team: 'home', teamName: 'Trem DC', player: 'Rafael Mandacaru', score: { home: 1, away: 0 } }
        ],
        stats: {
          possession: { home: 54, away: 46 },
          shotsOnTarget: { home: 4, away: 2 },
          corners: { home: 3, away: 1 },
          yellowCards: { home: 1, away: 2 }
        },
        startTime: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      },
      {
        id: 'match-amapaense-202',
        leagueId: 'brazil-amapaense',
        homeTeam: { id: 'ap-oratorio', name: 'Oratório RC', shortName: 'ORA', form: ['W', 'L', 'W', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/135.png' },
        awayTeam: { id: 'ap-ypiranga', name: 'Ypiranga Clube', shortName: 'YPI', form: ['D', 'W', 'L', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/134.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.25,
          draw: 3.20,
          awayWin: 3.10,
          over25: 2.05,
          under25: 1.74,
          bttsYes: 1.85,
          bttsNo: 1.91
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      },
      {
        id: 'match-amapaense-203',
        leagueId: 'brazil-amapaense',
        homeTeam: { id: 'ap-macapa', name: 'EC Macapá', shortName: 'MAC', form: ['L', 'W', 'D', 'L', 'W'], logo: 'https://media.api-sports.io/football/teams/136.png' },
        awayTeam: { id: 'ap-santana', name: 'Santana EC', shortName: 'STN', form: ['L', 'L', 'L', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/137.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 1.75,
          draw: 3.50,
          awayWin: 4.40,
          over25: 1.80,
          under25: 1.95,
          bttsYes: 1.88,
          bttsNo: 1.88
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 180 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'australia-wa-state-1',
    name: 'Western Australia State League 1',
    country: 'Australia',
    countryCode: 'AU',
    flag: '🇦🇺',
    categoryId: 'australia',
    season: '2026',
    tier: 'Tier 3 (State Division 1)',
    apiFootballId: 789,
    teams: [
      { id: 'au-fremantle', name: 'Fremantle City', shortName: 'FRE', form: ['W', 'W', 'D', 'W', 'W'], strength: 1.30, logo: 'https://media.api-sports.io/football/teams/140.png' },
      { id: 'au-dianella', name: 'Dianella White Eagles', shortName: 'DIA', form: ['W', 'D', 'W', 'W', 'L'], strength: 1.20, logo: 'https://media.api-sports.io/football/teams/141.png' },
      { id: 'au-joondalup', name: 'Joondalup United', shortName: 'JON', form: ['D', 'W', 'L', 'W', 'D'], strength: 1.05, logo: 'https://media.api-sports.io/football/teams/142.png' },
      { id: 'au-mandurah', name: 'Mandurah City', shortName: 'MAN', form: ['W', 'L', 'W', 'D', 'W'], strength: 1.15, logo: 'https://media.api-sports.io/football/teams/143.png' },
      { id: 'au-murdoch', name: 'Murdoch University Melville', shortName: 'MUR', form: ['L', 'D', 'W', 'L', 'D'], strength: 0.90, logo: 'https://media.api-sports.io/football/teams/144.png' },
      { id: 'au-subiaco', name: 'Subiaco AFC', shortName: 'SUB', form: ['L', 'W', 'L', 'L', 'W'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/145.png' },
      { id: 'au-gwelup', name: 'Gwelup Croatia', shortName: 'GWE', form: ['D', 'L', 'D', 'W', 'L'], strength: 0.80, logo: 'https://media.api-sports.io/football/teams/146.png' },
      { id: 'au-rockingham', name: 'Rockingham City', shortName: 'ROC', form: ['L', 'L', 'L', 'D', 'W'], strength: 0.75, logo: 'https://media.api-sports.io/football/teams/147.png' }
    ],
    matches: [
      {
        id: 'match-wa-301',
        leagueId: 'australia-wa-state-1',
        homeTeam: { id: 'au-fremantle', name: 'Fremantle City', shortName: 'FRE', form: ['W', 'W', 'D', 'W', 'W'], logo: 'https://media.api-sports.io/football/teams/140.png' },
        awayTeam: { id: 'au-mandurah', name: 'Mandurah City', shortName: 'MAN', form: ['W', 'L', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/143.png' },
        status: 'LIVE',
        minute: 74,
        score: { home: 3, away: 2 },
        period: '2H',
        odds: {
          homeWin: 1.35,
          draw: 4.80,
          awayWin: 8.50,
          over25: 1.01,
          under25: 18.00,
          bttsYes: 1.01,
          bttsNo: 20.00
        },
        oddsSuspended: false,
        events: [
          { minute: 14, type: 'goal', team: 'home', teamName: 'Fremantle City', player: 'Jesse Fuller', score: { home: 1, away: 0 } },
          { minute: 29, type: 'goal', team: 'away', teamName: 'Mandurah City', player: 'Leigh Griffiths', score: { home: 1, away: 1 } },
          { minute: 48, type: 'goal', team: 'home', teamName: 'Fremantle City', player: 'Noah Shamaki', score: { home: 2, away: 1 } },
          { minute: 58, type: 'goal', team: 'away', teamName: 'Mandurah City', player: 'Joe O\'Brien', score: { home: 2, away: 2 } },
          { minute: 67, type: 'goal', team: 'home', teamName: 'Fremantle City', player: 'Jesse Fuller', score: { home: 3, away: 2 } }
        ],
        stats: {
          possession: { home: 58, away: 42 },
          shotsOnTarget: { home: 9, away: 5 },
          corners: { home: 7, away: 4 },
          yellowCards: { home: 2, away: 2 }
        },
        startTime: new Date(Date.now() - 76 * 60 * 1000).toISOString()
      },
      {
        id: 'match-wa-302',
        leagueId: 'australia-wa-state-1',
        homeTeam: { id: 'au-dianella', name: 'Dianella White Eagles', shortName: 'DIA', form: ['W', 'D', 'W', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/141.png' },
        awayTeam: { id: 'au-joondalup', name: 'Joondalup United', shortName: 'JON', form: ['D', 'W', 'L', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/142.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 1.95,
          draw: 3.65,
          awayWin: 3.45,
          over25: 1.65,
          under25: 2.20,
          bttsYes: 1.60,
          bttsNo: 2.25
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 90 * 60 * 1000).toISOString()
      },
      {
        id: 'match-wa-303',
        leagueId: 'australia-wa-state-1',
        homeTeam: { id: 'au-murdoch', name: 'Murdoch University Melville', shortName: 'MUR', form: ['L', 'D', 'W', 'L', 'D'], logo: 'https://media.api-sports.io/football/teams/144.png' },
        awayTeam: { id: 'au-subiaco', name: 'Subiaco AFC', shortName: 'SUB', form: ['L', 'W', 'L', 'L', 'W'], logo: 'https://media.api-sports.io/football/teams/145.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.45,
          draw: 3.40,
          awayWin: 2.70,
          over25: 1.75,
          under25: 2.05,
          bttsYes: 1.66,
          bttsNo: 2.15
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 150 * 60 * 1000).toISOString()
      },
      {
        id: 'match-wa-304',
        leagueId: 'australia-wa-state-1',
        homeTeam: { id: 'au-gwelup', name: 'Gwelup Croatia', shortName: 'GWE', form: ['D', 'L', 'D', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/146.png' },
        awayTeam: { id: 'au-rockingham', name: 'Rockingham City', shortName: 'ROC', form: ['L', 'L', 'L', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/147.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.10,
          draw: 3.50,
          awayWin: 3.20,
          over25: 1.70,
          under25: 2.10,
          bttsYes: 1.62,
          bttsNo: 2.20
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 270 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'australia-qpl-1',
    name: 'Queensland Premier League 1',
    country: 'Australia',
    countryCode: 'AU',
    flag: '🇦🇺',
    categoryId: 'australia',
    season: '2026',
    tier: 'Tier 3 (QPL 1)',
    apiFootballId: 795,
    teams: [
      { id: 'au-brisbane-strikers', name: 'Brisbane Strikers', shortName: 'STR', form: ['W', 'W', 'W', 'D', 'W'], strength: 1.35, logo: 'https://media.api-sports.io/football/teams/150.png' },
      { id: 'au-logan', name: 'Logan Lightning', shortName: 'LOG', form: ['W', 'L', 'W', 'W', 'D'], strength: 1.20, logo: 'https://media.api-sports.io/football/teams/151.png' },
      { id: 'au-caboolture', name: 'Caboolture SFC', shortName: 'CAB', form: ['D', 'W', 'D', 'L', 'W'], strength: 1.10, logo: 'https://media.api-sports.io/football/teams/152.png' },
      { id: 'au-swq', name: 'SWQ Thunder', shortName: 'SWQ', form: ['W', 'D', 'L', 'W', 'L'], strength: 1.00, logo: 'https://media.api-sports.io/football/teams/153.png' },
      { id: 'au-eastern-suburbs', name: 'Eastern Suburbs FC', shortName: 'EAS', form: ['L', 'W', 'W', 'L', 'D'], strength: 0.95, logo: 'https://media.api-sports.io/football/teams/154.png' },
      { id: 'au-mitchelton', name: 'Mitchelton FC', shortName: 'MIT', form: ['L', 'L', 'W', 'D', 'L'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/155.png' },
      { id: 'au-capalaba', name: 'Capalaba FC', shortName: 'CAP', form: ['D', 'L', 'L', 'W', 'D'], strength: 0.80, logo: 'https://media.api-sports.io/football/teams/156.png' },
      { id: 'au-southside', name: 'Southside Eagles', shortName: 'SOU', form: ['L', 'L', 'L', 'D', 'L'], strength: 0.75, logo: 'https://media.api-sports.io/football/teams/157.png' }
    ],
    matches: [
      {
        id: 'match-qpl-401',
        leagueId: 'australia-qpl-1',
        homeTeam: { id: 'au-brisbane-strikers', name: 'Brisbane Strikers', shortName: 'STR', form: ['W', 'W', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/150.png' },
        awayTeam: { id: 'au-swq', name: 'SWQ Thunder', shortName: 'SWQ', form: ['W', 'D', 'L', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/153.png' },
        status: 'LIVE',
        minute: 27,
        score: { home: 1, away: 0 },
        period: '1H',
        odds: {
          homeWin: 1.38,
          draw: 4.50,
          awayWin: 7.00,
          over25: 1.48,
          under25: 2.55,
          bttsYes: 1.72,
          bttsNo: 2.05
        },
        oddsSuspended: false,
        events: [
          { minute: 19, type: 'goal', team: 'home', teamName: 'Brisbane Strikers', player: 'Lachlan Hunter', score: { home: 1, away: 0 } }
        ],
        stats: {
          possession: { home: 62, away: 38 },
          shotsOnTarget: { home: 5, away: 1 },
          corners: { home: 4, away: 1 },
          yellowCards: { home: 0, away: 1 }
        },
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'match-qpl-402',
        leagueId: 'australia-qpl-1',
        homeTeam: { id: 'au-logan', name: 'Logan Lightning', shortName: 'LOG', form: ['W', 'L', 'W', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/151.png' },
        awayTeam: { id: 'au-caboolture', name: 'Caboolture SFC', shortName: 'CAB', form: ['D', 'W', 'D', 'L', 'W'], logo: 'https://media.api-sports.io/football/teams/152.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 1.85,
          draw: 3.75,
          awayWin: 3.80,
          over25: 1.60,
          under25: 2.30,
          bttsYes: 1.58,
          bttsNo: 2.30
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 75 * 60 * 1000).toISOString()
      },
      {
        id: 'match-qpl-403',
        leagueId: 'australia-qpl-1',
        homeTeam: { id: 'au-eastern-suburbs', name: 'Eastern Suburbs FC', shortName: 'EAS', form: ['L', 'W', 'W', 'L', 'D'], logo: 'https://media.api-sports.io/football/teams/154.png' },
        awayTeam: { id: 'au-mitchelton', name: 'Mitchelton FC', shortName: 'MIT', form: ['L', 'L', 'W', 'D', 'L'], logo: 'https://media.api-sports.io/football/teams/155.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.05,
          draw: 3.60,
          awayWin: 3.25,
          over25: 1.68,
          under25: 2.15,
          bttsYes: 1.62,
          bttsNo: 2.22
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 195 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'germany-oberliga-westfalen',
    name: 'Oberliga Westfalen',
    country: 'Germany',
    countryCode: 'DE',
    flag: '🇩🇪',
    categoryId: 'germany',
    season: '2025/2026',
    tier: 'Tier 5 (Oberliga)',
    apiFootballId: 174,
    teams: [
      { id: 'de-wattenscheid', name: 'SG Wattenscheid 09', shortName: 'WAT', form: ['W', 'W', 'D', 'L', 'W'], strength: 1.25, logo: 'https://media.api-sports.io/football/teams/160.png' },
      { id: 'de-asc-dortmund', name: 'ASC 09 Dortmund', shortName: 'DOR', form: ['W', 'W', 'W', 'D', 'W'], strength: 1.30, logo: 'https://media.api-sports.io/football/teams/161.png' },
      { id: 'de-ennepetal', name: 'TuS Ennepetal', shortName: 'ENN', form: ['D', 'L', 'W', 'D', 'L'], strength: 0.95, logo: 'https://media.api-sports.io/football/teams/162.png' },
      { id: 'de-erkenschwick', name: 'SpVgg Erkenschwick', shortName: 'ERK', form: ['W', 'D', 'L', 'W', 'W'], strength: 1.15, logo: 'https://media.api-sports.io/football/teams/163.png' },
      { id: 'de-siegen', name: 'Sportfreunde Siegen', shortName: 'SIE', form: ['D', 'W', 'W', 'D', 'L'], strength: 1.10, logo: 'https://media.api-sports.io/football/teams/164.png' },
      { id: 'de-preussen-ii', name: 'Preussen Münster II', shortName: 'MUN', form: ['L', 'W', 'D', 'W', 'D'], strength: 1.05, logo: 'https://media.api-sports.io/football/teams/165.png' },
      { id: 'de-rheine', name: 'FC Eintracht Rheine', shortName: 'RHE', form: ['L', 'L', 'D', 'W', 'L'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/166.png' },
      { id: 'de-rhynern', name: 'Westfalia Rhynern', shortName: 'RHY', form: ['D', 'L', 'L', 'L', 'D'], strength: 0.80, logo: 'https://media.api-sports.io/football/teams/167.png' }
    ],
    matches: [
      {
        id: 'match-westfalen-501',
        leagueId: 'germany-oberliga-westfalen',
        homeTeam: { id: 'de-wattenscheid', name: 'SG Wattenscheid 09', shortName: 'WAT', form: ['W', 'W', 'D', 'L', 'W'], logo: 'https://media.api-sports.io/football/teams/160.png' },
        awayTeam: { id: 'de-erkenschwick', name: 'SpVgg Erkenschwick', shortName: 'ERK', form: ['W', 'D', 'L', 'W', 'W'], logo: 'https://media.api-sports.io/football/teams/163.png' },
        status: 'LIVE',
        minute: 52,
        score: { home: 1, away: 1 },
        period: '2H',
        odds: {
          homeWin: 2.30,
          draw: 2.75,
          awayWin: 3.40,
          over25: 1.70,
          under25: 2.10,
          bttsYes: 1.01,
          bttsNo: 15.00
        },
        oddsSuspended: false,
        events: [
          { minute: 31, type: 'goal', team: 'away', teamName: 'SpVgg Erkenschwick', player: 'Stefan Oerterer', score: { home: 0, away: 1 } },
          { minute: 49, type: 'goal', team: 'home', teamName: 'SG Wattenscheid 09', player: 'Felix Casalino', score: { home: 1, away: 1 } }
        ],
        stats: {
          possession: { home: 51, away: 49 },
          shotsOnTarget: { home: 4, away: 4 },
          corners: { home: 3, away: 4 },
          yellowCards: { home: 2, away: 1 }
        },
        startTime: new Date(Date.now() - 55 * 60 * 1000).toISOString()
      },
      {
        id: 'match-westfalen-502',
        leagueId: 'germany-oberliga-westfalen',
        homeTeam: { id: 'de-asc-dortmund', name: 'ASC 09 Dortmund', shortName: 'DOR', form: ['W', 'W', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/161.png' },
        awayTeam: { id: 'de-ennepetal', name: 'TuS Ennepetal', shortName: 'ENN', form: ['D', 'L', 'W', 'D', 'L'], logo: 'https://media.api-sports.io/football/teams/162.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 1.55,
          draw: 4.10,
          awayWin: 5.25,
          over25: 1.52,
          under25: 2.40,
          bttsYes: 1.65,
          bttsNo: 2.15
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 110 * 60 * 1000).toISOString()
      },
      {
        id: 'match-westfalen-503',
        leagueId: 'germany-oberliga-westfalen',
        homeTeam: { id: 'de-siegen', name: 'Sportfreunde Siegen', shortName: 'SIE', form: ['D', 'W', 'W', 'D', 'L'], logo: 'https://media.api-sports.io/football/teams/164.png' },
        awayTeam: { id: 'de-preussen-ii', name: 'Preussen Münster II', shortName: 'MUN', form: ['L', 'W', 'D', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/165.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.15,
          draw: 3.35,
          awayWin: 3.10,
          over25: 1.75,
          under25: 2.00,
          bttsYes: 1.65,
          bttsNo: 2.15
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 230 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'germany-oberliga-bayern',
    name: 'Oberliga Bayern',
    country: 'Germany',
    countryCode: 'DE',
    flag: '🇩🇪',
    categoryId: 'germany',
    season: '2025/2026',
    tier: 'Tier 5 (Oberliga)',
    apiFootballId: 175,
    teams: [
      { id: 'de-eichstatt', name: 'VfB Eichstätt', shortName: 'EIC', form: ['W', 'W', 'W', 'D', 'W'], strength: 1.35, logo: 'https://media.api-sports.io/football/teams/170.png' },
      { id: 'de-eltersdorf', name: 'SC Eltersdorf', shortName: 'ELT', form: ['W', 'D', 'W', 'W', 'L'], strength: 1.25, logo: 'https://media.api-sports.io/football/teams/171.png' },
      { id: 'de-abtswind', name: 'TSV Abtswind', shortName: 'ABT', form: ['D', 'W', 'L', 'D', 'W'], strength: 1.05, logo: 'https://media.api-sports.io/football/teams/172.png' },
      { id: 'de-bayern-hof', name: 'SpVgg Bayern Hof', shortName: 'HOF', form: ['L', 'W', 'D', 'L', 'W'], strength: 1.00, logo: 'https://media.api-sports.io/football/teams/173.png' },
      { id: 'de-wurzburger-fv', name: 'Würzburger FV', shortName: 'WUR', form: ['W', 'L', 'L', 'W', 'D'], strength: 0.95, logo: 'https://media.api-sports.io/football/teams/174.png' },
      { id: 'de-fortuna-regensburg', name: 'SV Fortuna Regensburg', shortName: 'REG', form: ['L', 'D', 'W', 'L', 'L'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/175.png' },
      { id: 'de-cham', name: 'ASV Cham', shortName: 'CHA', form: ['D', 'D', 'L', 'W', 'L'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/176.png' },
      { id: 'de-erlangen', name: 'ATSV Erlangen', shortName: 'ERL', form: ['L', 'L', 'L', 'D', 'D'], strength: 0.75, logo: 'https://media.api-sports.io/football/teams/177.png' }
    ],
    matches: [
      {
        id: 'match-bayern-601',
        leagueId: 'germany-oberliga-bayern',
        homeTeam: { id: 'de-eichstatt', name: 'VfB Eichstätt', shortName: 'EIC', form: ['W', 'W', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/170.png' },
        awayTeam: { id: 'de-abtswind', name: 'TSV Abtswind', shortName: 'ABT', form: ['D', 'W', 'L', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/172.png' },
        status: 'LIVE',
        minute: 19,
        score: { home: 1, away: 0 },
        period: '1H',
        odds: {
          homeWin: 1.30,
          draw: 4.80,
          awayWin: 9.00,
          over25: 1.55,
          under25: 2.35,
          bttsYes: 1.95,
          bttsNo: 1.80
        },
        oddsSuspended: false,
        events: [
          { minute: 11, type: 'goal', team: 'home', teamName: 'VfB Eichstätt', player: 'Fabian Eberle', score: { home: 1, away: 0 } }
        ],
        stats: {
          possession: { home: 65, away: 35 },
          shotsOnTarget: { home: 3, away: 0 },
          corners: { home: 2, away: 1 },
          yellowCards: { home: 0, away: 1 }
        },
        startTime: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      },
      {
        id: 'match-bayern-602',
        leagueId: 'germany-oberliga-bayern',
        homeTeam: { id: 'de-eltersdorf', name: 'SC Eltersdorf', shortName: 'ELT', form: ['W', 'D', 'W', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/171.png' },
        awayTeam: { id: 'de-bayern-hof', name: 'SpVgg Bayern Hof', shortName: 'HOF', form: ['L', 'W', 'D', 'L', 'W'], logo: 'https://media.api-sports.io/football/teams/173.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 1.70,
          draw: 3.80,
          awayWin: 4.30,
          over25: 1.62,
          under25: 2.25,
          bttsYes: 1.65,
          bttsNo: 2.15
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 80 * 60 * 1000).toISOString()
      },
      {
        id: 'match-bayern-603',
        leagueId: 'germany-oberliga-bayern',
        homeTeam: { id: 'de-wurzburger-fv', name: 'Würzburger FV', shortName: 'WUR', form: ['W', 'L', 'L', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/174.png' },
        awayTeam: { id: 'de-fortuna-regensburg', name: 'SV Fortuna Regensburg', shortName: 'REG', form: ['L', 'D', 'W', 'L', 'L'], logo: 'https://media.api-sports.io/football/teams/175.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.00,
          draw: 3.50,
          awayWin: 3.35,
          over25: 1.70,
          under25: 2.10,
          bttsYes: 1.62,
          bttsNo: 2.20
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 200 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'south-africa-motsepe',
    name: 'Motsepe Foundation Championship',
    country: 'South Africa',
    countryCode: 'ZA',
    flag: '🇿🇦',
    categoryId: 'south-africa',
    season: '2025/2026',
    tier: 'National 1st Division (Tier 2)',
    apiFootballId: 289,
    teams: [
      { id: 'za-cape-town-spurs', name: 'Cape Town Spurs', shortName: 'CTS', form: ['W', 'W', 'D', 'W', 'L'], strength: 1.30, logo: 'https://media.api-sports.io/football/teams/180.png' },
      { id: 'za-casric-stars', name: 'Casric Stars', shortName: 'CAS', form: ['W', 'D', 'W', 'D', 'W'], strength: 1.25, logo: 'https://media.api-sports.io/football/teams/181.png' },
      { id: 'za-baroka', name: 'Baroka FC', shortName: 'BAR', form: ['D', 'W', 'W', 'L', 'D'], strength: 1.15, logo: 'https://media.api-sports.io/football/teams/182.png' },
      { id: 'za-pretoria-callies', name: 'Pretoria Callies', shortName: 'CAL', form: ['L', 'D', 'W', 'D', 'W'], strength: 1.05, logo: 'https://media.api-sports.io/football/teams/183.png' },
      { id: 'za-hungry-lions', name: 'Hungry Lions FC', shortName: 'HLI', form: ['W', 'L', 'L', 'D', 'W'], strength: 1.00, logo: 'https://media.api-sports.io/football/teams/184.png' },
      { id: 'za-university-pretoria', name: 'University of Pretoria (Amatuks)', shortName: 'UPR', form: ['D', 'W', 'D', 'L', 'D'], strength: 1.00, logo: 'https://media.api-sports.io/football/teams/185.png' },
      { id: 'za-milford', name: 'Milford FC', shortName: 'MIL', form: ['L', 'W', 'L', 'D', 'L'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/186.png' },
      { id: 'za-venda', name: 'Venda Football Academy', shortName: 'VEN', form: ['L', 'L', 'D', 'L', 'D'], strength: 0.80, logo: 'https://media.api-sports.io/football/teams/187.png' }
    ],
    matches: [
      {
        id: 'match-motsepe-701',
        leagueId: 'south-africa-motsepe',
        homeTeam: { id: 'za-cape-town-spurs', name: 'Cape Town Spurs', shortName: 'CTS', form: ['W', 'W', 'D', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/180.png' },
        awayTeam: { id: 'za-baroka', name: 'Baroka FC', shortName: 'BAR', form: ['D', 'W', 'W', 'L', 'D'], logo: 'https://media.api-sports.io/football/teams/182.png' },
        status: 'LIVE',
        minute: 82,
        score: { home: 1, away: 0 },
        period: '2H',
        odds: {
          homeWin: 1.15,
          draw: 6.00,
          awayWin: 17.00,
          over25: 4.80,
          under25: 1.16,
          bttsYes: 5.50,
          bttsNo: 1.12
        },
        oddsSuspended: false,
        events: [
          { minute: 57, type: 'goal', team: 'home', teamName: 'Cape Town Spurs', player: 'Ashley Cupido', score: { home: 1, away: 0 } },
          { minute: 69, type: 'card', team: 'away', teamName: 'Baroka FC', player: 'Ananias Gebhardt', text: 'Yellow Card' }
        ],
        stats: {
          possession: { home: 52, away: 48 },
          shotsOnTarget: { home: 4, away: 2 },
          corners: { home: 4, away: 3 },
          yellowCards: { home: 1, away: 3 }
        },
        startTime: new Date(Date.now() - 84 * 60 * 1000).toISOString()
      },
      {
        id: 'match-motsepe-702',
        leagueId: 'south-africa-motsepe',
        homeTeam: { id: 'za-casric-stars', name: 'Casric Stars', shortName: 'CAS', form: ['W', 'D', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/181.png' },
        awayTeam: { id: 'za-pretoria-callies', name: 'Pretoria Callies', shortName: 'CAL', form: ['L', 'D', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/183.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 1.95,
          draw: 3.10,
          awayWin: 3.85,
          over25: 2.25,
          under25: 1.60,
          bttsYes: 2.05,
          bttsNo: 1.72
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 65 * 60 * 1000).toISOString()
      },
      {
        id: 'match-motsepe-703',
        leagueId: 'south-africa-motsepe',
        homeTeam: { id: 'za-hungry-lions', name: 'Hungry Lions FC', shortName: 'HLI', form: ['W', 'L', 'L', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/184.png' },
        awayTeam: { id: 'za-university-pretoria', name: 'University of Pretoria (Amatuks)', shortName: 'UPR', form: ['D', 'W', 'D', 'L', 'D'], logo: 'https://media.api-sports.io/football/teams/185.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.40,
          draw: 2.95,
          awayWin: 3.05,
          over25: 2.30,
          under25: 1.58,
          bttsYes: 2.00,
          bttsNo: 1.75
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 185 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'england-isthmian-north',
    name: 'Isthmian League North',
    country: 'England',
    countryCode: 'GB-ENG',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    categoryId: 'england',
    season: '2025/2026',
    tier: 'Step 4 (Tier 8)',
    apiFootballId: 60,
    teams: [
      { id: 'eng-bury-town', name: 'Bury Town', shortName: 'BUR', form: ['W', 'W', 'W', 'D', 'W'], strength: 1.30, logo: 'https://media.api-sports.io/football/teams/190.png' },
      { id: 'eng-brentwood', name: 'Brentwood Town', shortName: 'BRE', form: ['W', 'D', 'W', 'W', 'L'], strength: 1.25, logo: 'https://media.api-sports.io/football/teams/191.png' },
      { id: 'eng-felixstowe', name: 'Felixstowe & Walton United', shortName: 'FEL', form: ['D', 'W', 'W', 'D', 'W'], strength: 1.20, logo: 'https://media.api-sports.io/football/teams/192.png' },
      { id: 'eng-maldon', name: 'Maldon & Tiptree', shortName: 'MAL', form: ['L', 'W', 'D', 'W', 'L'], strength: 1.05, logo: 'https://media.api-sports.io/football/teams/193.png' },
      { id: 'eng-heybridge', name: 'Heybridge Swifts', shortName: 'HEY', form: ['W', 'L', 'L', 'D', 'W'], strength: 1.00, logo: 'https://media.api-sports.io/football/teams/194.png' },
      { id: 'eng-waltham-abbey', name: 'Waltham Abbey', shortName: 'WAL', form: ['D', 'D', 'W', 'L', 'D'], strength: 0.95, logo: 'https://media.api-sports.io/football/teams/195.png' },
      { id: 'eng-witham', name: 'Witham Town', shortName: 'WIT', form: ['L', 'L', 'W', 'D', 'L'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/196.png' },
      { id: 'eng-gorleston', name: 'Gorleston FC', shortName: 'GOR', form: ['L', 'L', 'L', 'D', 'L'], strength: 0.75, logo: 'https://media.api-sports.io/football/teams/197.png' }
    ],
    matches: [
      {
        id: 'match-isthmian-north-801',
        leagueId: 'england-isthmian-north',
        homeTeam: { id: 'eng-bury-town', name: 'Bury Town', shortName: 'BUR', form: ['W', 'W', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/190.png' },
        awayTeam: { id: 'eng-maldon', name: 'Maldon & Tiptree', shortName: 'MAL', form: ['L', 'W', 'D', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/193.png' },
        status: 'LIVE',
        minute: 44,
        score: { home: 2, away: 0 },
        period: '1H',
        odds: {
          homeWin: 1.14,
          draw: 6.80,
          awayWin: 16.00,
          over25: 1.25,
          under25: 3.75,
          bttsYes: 2.10,
          bttsNo: 1.68
        },
        oddsSuspended: false,
        events: [
          { minute: 12, type: 'goal', team: 'home', teamName: 'Bury Town', player: 'Cemil Cemal', score: { home: 1, away: 0 } },
          { minute: 36, type: 'goal', team: 'home', teamName: 'Bury Town', player: 'Ethan Mayhew', score: { home: 2, away: 0 } }
        ],
        stats: {
          possession: { home: 61, away: 39 },
          shotsOnTarget: { home: 6, away: 1 },
          corners: { home: 5, away: 2 },
          yellowCards: { home: 1, away: 1 }
        },
        startTime: new Date(Date.now() - 46 * 60 * 1000).toISOString()
      },
      {
        id: 'match-isthmian-north-802',
        leagueId: 'england-isthmian-north',
        homeTeam: { id: 'eng-brentwood', name: 'Brentwood Town', shortName: 'BRE', form: ['W', 'D', 'W', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/191.png' },
        awayTeam: { id: 'eng-felixstowe', name: 'Felixstowe & Walton United', shortName: 'FEL', form: ['D', 'W', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/192.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.15,
          draw: 3.45,
          awayWin: 2.95,
          over25: 1.68,
          under25: 2.15,
          bttsYes: 1.58,
          bttsNo: 2.25
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 50 * 60 * 1000).toISOString()
      },
      {
        id: 'match-isthmian-north-803',
        leagueId: 'england-isthmian-north',
        homeTeam: { id: 'eng-heybridge', name: 'Heybridge Swifts', shortName: 'HEY', form: ['W', 'L', 'L', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/194.png' },
        awayTeam: { id: 'eng-waltham-abbey', name: 'Waltham Abbey', shortName: 'WAL', form: ['D', 'D', 'W', 'L', 'D'], logo: 'https://media.api-sports.io/football/teams/195.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.25,
          draw: 3.30,
          awayWin: 2.85,
          over25: 1.72,
          under25: 2.05,
          bttsYes: 1.62,
          bttsNo: 2.18
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 170 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'england-isthmian-south-central',
    name: 'Isthmian League South Central',
    country: 'England',
    countryCode: 'GB-ENG',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    categoryId: 'england',
    season: '2025/2026',
    tier: 'Step 4 (Tier 8)',
    apiFootballId: 61,
    teams: [
      { id: 'eng-farnham', name: 'Farnham Town', shortName: 'FAR', form: ['W', 'W', 'W', 'W', 'D'], strength: 1.40, logo: 'https://media.api-sports.io/football/teams/200.png' },
      { id: 'eng-leatherhead', name: 'Leatherhead', shortName: 'LEA', form: ['W', 'W', 'D', 'L', 'W'], strength: 1.25, logo: 'https://media.api-sports.io/football/teams/201.png' },
      { id: 'eng-kingstonian', name: 'Kingstonian', shortName: 'KIN', form: ['D', 'W', 'L', 'W', 'D'], strength: 1.10, logo: 'https://media.api-sports.io/football/teams/202.png' },
      { id: 'eng-southall', name: 'Southall FC', shortName: 'SOU', form: ['W', 'L', 'W', 'D', 'L'], strength: 1.05, logo: 'https://media.api-sports.io/football/teams/203.png' },
      { id: 'eng-westfield', name: 'Westfield FC', shortName: 'WES', form: ['D', 'D', 'L', 'W', 'W'], strength: 1.00, logo: 'https://media.api-sports.io/football/teams/204.png' },
      { id: 'eng-ascot', name: 'Ascot United', shortName: 'ASC', form: ['L', 'W', 'D', 'L', 'D'], strength: 0.90, logo: 'https://media.api-sports.io/football/teams/205.png' },
      { id: 'eng-raynes-park', name: 'Raynes Park Vale', shortName: 'RPV', form: ['L', 'L', 'W', 'D', 'L'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/206.png' },
      { id: 'eng-badshot-lea', name: 'Badshot Lea', shortName: 'BAD', form: ['L', 'L', 'L', 'L', 'D'], strength: 0.70, logo: 'https://media.api-sports.io/football/teams/207.png' }
    ],
    matches: [
      {
        id: 'match-isthmian-south-901',
        leagueId: 'england-isthmian-south-central',
        homeTeam: { id: 'eng-farnham', name: 'Farnham Town', shortName: 'FAR', form: ['W', 'W', 'W', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/200.png' },
        awayTeam: { id: 'eng-leatherhead', name: 'Leatherhead', shortName: 'LEA', form: ['W', 'W', 'D', 'L', 'W'], logo: 'https://media.api-sports.io/football/teams/201.png' },
        status: 'LIVE',
        minute: 12,
        score: { home: 0, away: 0 },
        period: '1H',
        odds: {
          homeWin: 1.85,
          draw: 3.50,
          awayWin: 3.80,
          over25: 1.75,
          under25: 2.05,
          bttsYes: 1.65,
          bttsNo: 2.15
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 55, away: 45 },
          shotsOnTarget: { home: 1, away: 0 },
          corners: { home: 2, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() - 13 * 60 * 1000).toISOString()
      },
      {
        id: 'match-isthmian-south-902',
        leagueId: 'england-isthmian-south-central',
        homeTeam: { id: 'eng-kingstonian', name: 'Kingstonian', shortName: 'KIN', form: ['D', 'W', 'L', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/202.png' },
        awayTeam: { id: 'eng-southall', name: 'Southall FC', shortName: 'SOU', form: ['W', 'L', 'W', 'D', 'L'], logo: 'https://media.api-sports.io/football/teams/203.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.20,
          draw: 3.40,
          awayWin: 2.90,
          over25: 1.70,
          under25: 2.10,
          bttsYes: 1.60,
          bttsNo: 2.20
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 105 * 60 * 1000).toISOString()
      },
      {
        id: 'match-isthmian-south-903',
        leagueId: 'england-isthmian-south-central',
        homeTeam: { id: 'eng-westfield', name: 'Westfield FC', shortName: 'WES', form: ['D', 'D', 'L', 'W', 'W'], logo: 'https://media.api-sports.io/football/teams/204.png' },
        awayTeam: { id: 'eng-badshot-lea', name: 'Badshot Lea', shortName: 'BAD', form: ['L', 'L', 'L', 'L', 'D'], logo: 'https://media.api-sports.io/football/teams/207.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 1.45,
          draw: 4.40,
          awayWin: 5.80,
          over25: 1.55,
          under25: 2.35,
          bttsYes: 1.72,
          bttsNo: 2.05
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 215 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'england-northern-midlands',
    name: 'Northern Midlands League',
    country: 'England',
    countryCode: 'GB-ENG',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    categoryId: 'england',
    season: '2025/2026',
    tier: 'Step 4 (Tier 8)',
    apiFootballId: 62,
    teams: [
      { id: 'eng-quorn', name: 'Quorn FC', shortName: 'QUO', form: ['W', 'W', 'W', 'D', 'W'], strength: 1.30, logo: 'https://media.api-sports.io/football/teams/210.png' },
      { id: 'eng-corby', name: 'Corby Town', shortName: 'COR', form: ['W', 'D', 'W', 'W', 'L'], strength: 1.25, logo: 'https://media.api-sports.io/football/teams/211.png' },
      { id: 'eng-loughborough', name: 'Loughborough Dynamo', shortName: 'LOU', form: ['D', 'W', 'L', 'W', 'D'], strength: 1.10, logo: 'https://media.api-sports.io/football/teams/212.png' },
      { id: 'eng-sporting-khalsa', name: 'Sporting Khalsa', shortName: 'SPO', form: ['W', 'L', 'W', 'D', 'W'], strength: 1.15, logo: 'https://media.api-sports.io/football/teams/213.png' },
      { id: 'eng-anstey', name: 'Anstey Nomads', shortName: 'ANS', form: ['D', 'D', 'W', 'L', 'D'], strength: 1.00, logo: 'https://media.api-sports.io/football/teams/214.png' },
      { id: 'eng-coleshill', name: 'Coleshill Town', shortName: 'COL', form: ['L', 'W', 'L', 'D', 'L'], strength: 0.90, logo: 'https://media.api-sports.io/football/teams/215.png' },
      { id: 'eng-bedworth', name: 'Bedworth United', shortName: 'BED', form: ['L', 'L', 'D', 'W', 'L'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/216.png' },
      { id: 'eng-shepshed', name: 'Shepshed Dynamo', shortName: 'SHE', form: ['L', 'L', 'L', 'D', 'L'], strength: 0.75, logo: 'https://media.api-sports.io/football/teams/217.png' }
    ],
    matches: [
      {
        id: 'match-midlands-1001',
        leagueId: 'england-northern-midlands',
        homeTeam: { id: 'eng-quorn', name: 'Quorn FC', shortName: 'QUO', form: ['W', 'W', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/210.png' },
        awayTeam: { id: 'eng-corby', name: 'Corby Town', shortName: 'COR', form: ['W', 'D', 'W', 'W', 'L'], logo: 'https://media.api-sports.io/football/teams/211.png' },
        status: 'LIVE',
        minute: 68,
        score: { home: 2, away: 2 },
        period: '2H',
        odds: {
          homeWin: 2.85,
          draw: 2.50,
          awayWin: 2.95,
          over25: 1.01,
          under25: 25.00,
          bttsYes: 1.01,
          bttsNo: 30.00
        },
        oddsSuspended: false,
        events: [
          { minute: 15, type: 'goal', team: 'home', teamName: 'Quorn FC', player: 'Tyrell Shannon', score: { home: 1, away: 0 } },
          { minute: 28, type: 'goal', team: 'away', teamName: 'Corby Town', player: 'Fletcher Toll', score: { home: 1, away: 1 } },
          { minute: 51, type: 'goal', team: 'away', teamName: 'Corby Town', player: 'Reuben Marshall', score: { home: 1, away: 2 } },
          { minute: 64, type: 'goal', team: 'home', teamName: 'Quorn FC', player: 'Jack Sambrook', score: { home: 2, away: 2 } }
        ],
        stats: {
          possession: { home: 53, away: 47 },
          shotsOnTarget: { home: 5, away: 6 },
          corners: { home: 6, away: 4 },
          yellowCards: { home: 2, away: 3 }
        },
        startTime: new Date(Date.now() - 70 * 60 * 1000).toISOString()
      },
      {
        id: 'match-midlands-1002',
        leagueId: 'england-northern-midlands',
        homeTeam: { id: 'eng-sporting-khalsa', name: 'Sporting Khalsa', shortName: 'SPO', form: ['W', 'L', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/213.png' },
        awayTeam: { id: 'eng-loughborough', name: 'Loughborough Dynamo', shortName: 'LOU', form: ['D', 'W', 'L', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/212.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 1.95,
          draw: 3.50,
          awayWin: 3.40,
          over25: 1.68,
          under25: 2.15,
          bttsYes: 1.60,
          bttsNo: 2.22
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 95 * 60 * 1000).toISOString()
      },
      {
        id: 'match-midlands-1003',
        leagueId: 'england-northern-midlands',
        homeTeam: { id: 'eng-anstey', name: 'Anstey Nomads', shortName: 'ANS', form: ['D', 'D', 'W', 'L', 'D'], logo: 'https://media.api-sports.io/football/teams/214.png' },
        awayTeam: { id: 'eng-coleshill', name: 'Coleshill Town', shortName: 'COL', form: ['L', 'W', 'L', 'D', 'L'], logo: 'https://media.api-sports.io/football/teams/215.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.10,
          draw: 3.35,
          awayWin: 3.15,
          over25: 1.72,
          under25: 2.05,
          bttsYes: 1.62,
          bttsNo: 2.18
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 210 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'japan-jfl',
    name: 'Japan Football League (JFL)',
    country: 'Japan',
    countryCode: 'JP',
    flag: '🇯🇵',
    categoryId: 'japan',
    season: '2026',
    tier: 'Tier 4 (JFL)',
    apiFootballId: 298,
    teams: [
      { id: 'jp-honda', name: 'Honda FC', shortName: 'HON', form: ['W', 'W', 'W', 'D', 'W'], strength: 1.35, logo: 'https://media.api-sports.io/football/teams/220.png' },
      { id: 'jp-briobecca', name: 'Briobecca Urayasu', shortName: 'URA', form: ['W', 'D', 'W', 'W', 'D'], strength: 1.25, logo: 'https://media.api-sports.io/football/teams/221.png' },
      { id: 'jp-reinmeer', name: 'ReinMeer Aomori', shortName: 'AOM', form: ['D', 'W', 'L', 'W', 'W'], strength: 1.15, logo: 'https://media.api-sports.io/football/teams/222.png' },
      { id: 'jp-veertien', name: 'Veertien Mie', shortName: 'MIE', form: ['W', 'L', 'W', 'D', 'L'], strength: 1.05, logo: 'https://media.api-sports.io/football/teams/223.png' },
      { id: 'jp-sony-sendai', name: 'Sony Sendai FC', shortName: 'SEN', form: ['D', 'D', 'W', 'L', 'D'], strength: 1.00, logo: 'https://media.api-sports.io/football/teams/224.png' },
      { id: 'jp-maruyasu', name: 'Maruyasu Okazaki', shortName: 'OKA', form: ['L', 'W', 'L', 'D', 'W'], strength: 0.95, logo: 'https://media.api-sports.io/football/teams/225.png' },
      { id: 'jp-atletico-suzuka', name: 'Atlético Suzuka', shortName: 'SUZ', form: ['L', 'L', 'W', 'D', 'L'], strength: 0.85, logo: 'https://media.api-sports.io/football/teams/226.png' },
      { id: 'jp-verspah', name: 'Verspah Oita', shortName: 'OIT', form: ['L', 'D', 'L', 'L', 'D'], strength: 0.80, logo: 'https://media.api-sports.io/football/teams/227.png' }
    ],
    matches: [
      {
        id: 'match-jfl-1101',
        leagueId: 'japan-jfl',
        homeTeam: { id: 'jp-honda', name: 'Honda FC', shortName: 'HON', form: ['W', 'W', 'W', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/220.png' },
        awayTeam: { id: 'jp-briobecca', name: 'Briobecca Urayasu', shortName: 'URA', form: ['W', 'D', 'W', 'W', 'D'], logo: 'https://media.api-sports.io/football/teams/221.png' },
        status: 'LIVE',
        minute: 57,
        score: { home: 1, away: 0 },
        period: '2H',
        odds: {
          homeWin: 1.45,
          draw: 3.80,
          awayWin: 7.50,
          over25: 2.10,
          under25: 1.70,
          bttsYes: 2.20,
          bttsNo: 1.62
        },
        oddsSuspended: false,
        events: [
          { minute: 34, type: 'goal', team: 'home', teamName: 'Honda FC', player: 'Koki Matsumura', score: { home: 1, away: 0 } }
        ],
        stats: {
          possession: { home: 58, away: 42 },
          shotsOnTarget: { home: 5, away: 2 },
          corners: { home: 4, away: 2 },
          yellowCards: { home: 1, away: 1 }
        },
        startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      },
      {
        id: 'match-jfl-1102',
        leagueId: 'japan-jfl',
        homeTeam: { id: 'jp-reinmeer', name: 'ReinMeer Aomori', shortName: 'AOM', form: ['D', 'W', 'L', 'W', 'W'], logo: 'https://media.api-sports.io/football/teams/222.png' },
        awayTeam: { id: 'jp-veertien', name: 'Veertien Mie', shortName: 'MIE', form: ['W', 'L', 'W', 'D', 'L'], logo: 'https://media.api-sports.io/football/teams/223.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.05,
          draw: 3.30,
          awayWin: 3.35,
          over25: 1.95,
          under25: 1.82,
          bttsYes: 1.75,
          bttsNo: 2.00
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 40 * 60 * 1000).toISOString()
      },
      {
        id: 'match-jfl-1103',
        leagueId: 'japan-jfl',
        homeTeam: { id: 'jp-sony-sendai', name: 'Sony Sendai FC', shortName: 'SEN', form: ['D', 'D', 'W', 'L', 'D'], logo: 'https://media.api-sports.io/football/teams/224.png' },
        awayTeam: { id: 'jp-maruyasu', name: 'Maruyasu Okazaki', shortName: 'OKA', form: ['L', 'W', 'L', 'D', 'W'], logo: 'https://media.api-sports.io/football/teams/225.png' },
        status: 'SCHEDULED',
        minute: 0,
        score: { home: 0, away: 0 },
        period: 'PRE',
        odds: {
          homeWin: 2.20,
          draw: 3.20,
          awayWin: 3.10,
          over25: 1.88,
          under25: 1.88,
          bttsYes: 1.72,
          bttsNo: 2.05
        },
        oddsSuspended: false,
        events: [],
        stats: {
          possession: { home: 50, away: 50 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 }
        },
        startTime: new Date(Date.now() + 160 * 60 * 1000).toISOString()
      }
    ]
  }
];

module.exports = {
  LEAGUES
};
