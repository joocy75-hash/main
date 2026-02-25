// Sports service: fetches real data from PandaScore (esports) and API-Football (football).
// Falls back to mock data when APIs are unavailable.

import { config } from '../config.js';

interface SportCategory {
  code: string;
  name: string;
  nameKo: string;
  icon: string;
  eventCount: number;
}

interface Team {
  name: string;
  nameKo: string;
  logo?: string;
  score?: number;
}

interface SportEvent {
  id: number;
  sport: string;
  sportKo: string;
  league: string;
  leagueKo: string;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  elapsed?: string;
  period?: string;
}

interface BookmakerOdds {
  bookmaker: string;
  bookmakerKo: string;
  markets: {
    type: string;
    outcomes: { name: string; odds: number }[];
  }[];
  updatedAt: string;
}

interface EventOdds {
  eventId: number;
  bookmakers: BookmakerOdds[];
}

interface EsportsCategory {
  code: string;
  name: string;
  nameKo: string;
  icon: string;
}

// ─── Cache ───────────────────────────────────────────
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Constants ───────────────────────────────────────
const SPORT_CATEGORIES: SportCategory[] = [
  { code: 'football', name: 'Football', nameKo: '축구', icon: '⚽', eventCount: 0 },
  { code: 'basketball', name: 'Basketball', nameKo: '농구', icon: '🏀', eventCount: 0 },
  { code: 'baseball', name: 'Baseball', nameKo: '야구', icon: '⚾', eventCount: 0 },
  { code: 'tennis', name: 'Tennis', nameKo: '테니스', icon: '🎾', eventCount: 0 },
  { code: 'volleyball', name: 'Volleyball', nameKo: '배구', icon: '🏐', eventCount: 0 },
  { code: 'ice_hockey', name: 'Ice Hockey', nameKo: '아이스하키', icon: '🏒', eventCount: 0 },
  { code: 'mma', name: 'MMA', nameKo: '격투기', icon: '🥊', eventCount: 0 },
  { code: 'table_tennis', name: 'Table Tennis', nameKo: '탁구', icon: '🏓', eventCount: 0 },
];

const ESPORTS_CATEGORIES: EsportsCategory[] = [
  { code: 'lol', name: 'League of Legends', nameKo: 'LoL', icon: '⚔️' },
  { code: 'cs2', name: 'Counter-Strike', nameKo: 'CS2', icon: '🔫' },
  { code: 'valorant', name: 'Valorant', nameKo: '발로란트', icon: '🎯' },
  { code: 'dota2', name: 'Dota 2', nameKo: '도타2', icon: '🛡️' },
  { code: 'overwatch', name: 'Overwatch', nameKo: '오버워치', icon: '🎮' },
  { code: 'pubg', name: 'PUBG', nameKo: 'PUBG', icon: '🔫' },
  { code: 'starcraft', name: 'StarCraft', nameKo: '스타크래프트', icon: '🌌' },
  { code: 'r6siege', name: 'Rainbow Six Siege', nameKo: 'R6 시즈', icon: '🛡️' },
];

const PANDASCORE_GAME_NAME_KO: Record<string, string> = {
  'League of Legends': 'LoL',
  'Counter-Strike': 'CS2',
  'CS:GO': 'CS2',
  'Dota 2': '도타2',
  'Valorant': '발로란트',
  'Overwatch': '오버워치',
  'PUBG': 'PUBG',
  'Rainbow Six Siege': 'R6 시즈',
  'Rocket League': '로켓 리그',
  'StarCraft 2': '스타2',
  'StarCraft Brood War': '스타1',
  'LoL Wild Rift': '와일드 리프트',
  'Call of Duty': 'CoD',
  'EA Sports FC': 'EA FC',
  'King of Glory': '왕자영요',
  'Mobile Legends: Bang Bang': 'MLBB',
};

const FOOTBALL_STATUS_MAP: Record<string, { period: string; isLive: boolean }> = {
  '1H': { period: '전반전', isLive: true },
  '2H': { period: '후반전', isLive: true },
  'HT': { period: '하프타임', isLive: true },
  'ET': { period: '연장전', isLive: true },
  'BT': { period: '연장 하프타임', isLive: true },
  'P': { period: '승부차기', isLive: true },
  'SUSP': { period: '중단', isLive: true },
  'INT': { period: '중단', isLive: true },
  'LIVE': { period: '진행중', isLive: true },
  'FT': { period: '경기 종료', isLive: false },
  'AET': { period: '연장 종료', isLive: false },
  'PEN': { period: '승부차기 종료', isLive: false },
  'NS': { period: '', isLive: false },
  'TBD': { period: '', isLive: false },
  'PST': { period: '연기', isLive: false },
  'CANC': { period: '취소', isLive: false },
  'ABD': { period: '중단', isLive: false },
  'WO': { period: '부전승', isLive: false },
};

const LEAGUE_NAME_KO: Record<string, string> = {
  'Premier League': '프리미어리그',
  'La Liga': '라리가',
  'Bundesliga': '분데스리가',
  'Serie A': '세리에A',
  'Ligue 1': '리그앙',
  'Champions League': '챔피언스리그',
  'Europa League': '유로파리그',
  'K League 1': 'K리그1',
  'K League 2': 'K리그2',
  'J1 League': 'J리그',
  'Chinese Super League': '중국 슈퍼리그',
  'MLS': 'MLS',
  'Eredivisie': '에레디비시',
  'Primeira Liga': '프리메이라리가',
  'Super Lig': '쉬페르리그',
  'Saudi Pro League': '사우디 프로리그',
  'World Cup': '월드컵',
  'Euro Championship': '유로',
  'AFC Champions League': 'AFC 챔피언스리그',
  'Copa Libertadores': '코파 리베르타도레스',
  'FIFA Club World Cup': 'FIFA 클럽 월드컵',
};

// ─── Mock Data (fallback) ────────────────────────────
const MOCK_LIVE_EVENTS: SportEvent[] = [
  {
    id: 1001, sport: 'football', sportKo: '축구',
    league: 'Premier League', leagueKo: '프리미어리그', status: 'LIVE',
    homeTeam: { name: 'Manchester United', nameKo: '맨유', score: 2 },
    awayTeam: { name: 'Liverpool', nameKo: '리버풀', score: 1 },
    startTime: new Date(Date.now() - 67 * 60000).toISOString(),
    elapsed: "67'", period: '2nd Half',
  },
  {
    id: 1002, sport: 'football', sportKo: '축구',
    league: 'La Liga', leagueKo: '라리가', status: 'LIVE',
    homeTeam: { name: 'Real Madrid', nameKo: '레알 마드리드', score: 0 },
    awayTeam: { name: 'FC Barcelona', nameKo: '바르셀로나', score: 0 },
    startTime: new Date(Date.now() - 23 * 60000).toISOString(),
    elapsed: "23'", period: '1st Half',
  },
];

const MOCK_SCHEDULED_EVENTS: SportEvent[] = [
  {
    id: 2001, sport: 'football', sportKo: '축구',
    league: 'Champions League', leagueKo: '챔피언스리그', status: 'SCHEDULED',
    homeTeam: { name: 'Bayern Munich', nameKo: '바이에른 뮌헨' },
    awayTeam: { name: 'PSG', nameKo: '파리 생제르맹' },
    startTime: new Date(Date.now() + 3 * 3600000).toISOString(),
  },
];

const MOCK_ESPORTS_LIVE: SportEvent[] = [
  {
    id: 3001, sport: 'esports', sportKo: 'e스포츠',
    league: 'LCK', leagueKo: 'LCK', status: 'LIVE',
    homeTeam: { name: 'T1', nameKo: 'T1', score: 1 },
    awayTeam: { name: 'Gen.G', nameKo: 'Gen.G', score: 1 },
    startTime: new Date(Date.now() - 90 * 60000).toISOString(),
    elapsed: 'Game 3 - 25분', period: 'Bo3 Game 3',
  },
  {
    id: 3002, sport: 'esports', sportKo: 'e스포츠',
    league: 'BLAST Premier', leagueKo: 'BLAST 프리미어', status: 'LIVE',
    homeTeam: { name: 'NAVI', nameKo: 'NAVI', score: 1 },
    awayTeam: { name: 'FaZe Clan', nameKo: 'FaZe', score: 0 },
    startTime: new Date(Date.now() - 60 * 60000).toISOString(),
    elapsed: 'Map 2 - 14:10', period: 'Bo3 Map 2',
  },
];

// ─── API Helpers ─────────────────────────────────────
async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── PandaScore API ──────────────────────────────────
async function fetchPandaScoreRunning(): Promise<SportEvent[]> {
  const key = config.pandaScore.apiKey;
  if (!key) return [];

  const cached = cacheGet<SportEvent[]>('pandascore:running');
  if (cached) return cached;

  const res = await fetchWithTimeout(
    `${config.pandaScore.baseUrl}/matches/running?per_page=50`,
    { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' },
  );
  if (!res.ok) throw new Error(`PandaScore ${res.status}`);
  const matches: any[] = await res.json();

  const events: SportEvent[] = matches.map((m: any) => {
    const opponents = m.opponents || [];
    const home = opponents[0]?.opponent || {};
    const away = opponents[1]?.opponent || {};
    const results = m.results || [];
    const homeScore = results.find((r: any) => r.team_id === home.id)?.score;
    const awayScore = results.find((r: any) => r.team_id === away.id)?.score;
    const gameName = m.videogame?.name || 'Esports';
    const gameNameKo = PANDASCORE_GAME_NAME_KO[gameName] || gameName;
    const leagueName = m.league?.name || '';
    const serieName = m.serie?.full_name || m.serie?.name || '';
    const numberOfGames = m.number_of_games || 1;
    const gamesPlayed = (m.games || []).filter((g: any) => g.status === 'finished').length;

    return {
      id: m.id,
      sport: 'esports',
      sportKo: 'e스포츠',
      league: leagueName,
      leagueKo: serieName || leagueName,
      status: 'LIVE' as const,
      homeTeam: {
        name: home.name || 'TBD',
        nameKo: home.acronym || home.name || 'TBD',
        logo: home.image_url || undefined,
        score: homeScore ?? 0,
      },
      awayTeam: {
        name: away.name || 'TBD',
        nameKo: away.acronym || away.name || 'TBD',
        logo: away.image_url || undefined,
        score: awayScore ?? 0,
      },
      startTime: m.begin_at || new Date().toISOString(),
      elapsed: `${gameNameKo} - Bo${numberOfGames} (${gamesPlayed}/${numberOfGames})`,
      period: `Bo${numberOfGames} Game ${gamesPlayed + 1}`,
    };
  });

  cacheSet('pandascore:running', events, 30_000);
  return events;
}

async function fetchPandaScoreUpcoming(): Promise<SportEvent[]> {
  const key = config.pandaScore.apiKey;
  if (!key) return [];

  const cached = cacheGet<SportEvent[]>('pandascore:upcoming');
  if (cached) return cached;

  const res = await fetchWithTimeout(
    `${config.pandaScore.baseUrl}/matches/upcoming?per_page=20&sort=begin_at`,
    { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' },
  );
  if (!res.ok) throw new Error(`PandaScore ${res.status}`);
  const matches: any[] = await res.json();

  const events: SportEvent[] = matches.map((m: any) => {
    const opponents = m.opponents || [];
    const home = opponents[0]?.opponent || {};
    const away = opponents[1]?.opponent || {};
    const gameName = m.videogame?.name || 'Esports';
    const gameNameKo = PANDASCORE_GAME_NAME_KO[gameName] || gameName;
    const leagueName = m.league?.name || '';
    const serieName = m.serie?.full_name || m.serie?.name || '';
    const numberOfGames = m.number_of_games || 1;

    return {
      id: m.id,
      sport: 'esports',
      sportKo: 'e스포츠',
      league: leagueName,
      leagueKo: `${gameNameKo} - ${serieName || leagueName}`,
      status: 'SCHEDULED' as const,
      homeTeam: {
        name: home.name || 'TBD',
        nameKo: home.acronym || home.name || 'TBD',
        logo: home.image_url || undefined,
      },
      awayTeam: {
        name: away.name || 'TBD',
        nameKo: away.acronym || away.name || 'TBD',
        logo: away.image_url || undefined,
      },
      startTime: m.begin_at || new Date().toISOString(),
      period: `Bo${numberOfGames}`,
    };
  });

  cacheSet('pandascore:upcoming', events, 120_000);
  return events;
}

// ─── API-Football ────────────────────────────────────
async function fetchFootballLive(): Promise<SportEvent[]> {
  const key = config.apiFootball.apiKey;
  if (!key) return [];

  const cached = cacheGet<SportEvent[]>('apifootball:live');
  if (cached) return cached;

  const res = await fetchWithTimeout(
    `${config.apiFootball.baseUrl}/fixtures?live=all`,
    { 'x-apisports-key': key },
  );
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  const data: any = await res.json();
  const fixtures: any[] = data.response || [];

  const events: SportEvent[] = fixtures.map((f: any) => {
    const statusShort = f.fixture?.status?.short || '';
    const statusInfo = FOOTBALL_STATUS_MAP[statusShort] || { period: statusShort, isLive: true };
    const elapsed = f.fixture?.status?.elapsed;
    const leagueName = f.league?.name || '';
    const leagueCountry = f.league?.country || '';

    return {
      id: f.fixture?.id || 0,
      sport: 'football',
      sportKo: '축구',
      league: leagueName,
      leagueKo: LEAGUE_NAME_KO[leagueName] || `${leagueName} (${leagueCountry})`,
      status: 'LIVE' as const,
      homeTeam: {
        name: f.teams?.home?.name || 'TBD',
        nameKo: f.teams?.home?.name || 'TBD',
        logo: f.teams?.home?.logo || undefined,
        score: f.goals?.home ?? 0,
      },
      awayTeam: {
        name: f.teams?.away?.name || 'TBD',
        nameKo: f.teams?.away?.name || 'TBD',
        logo: f.teams?.away?.logo || undefined,
        score: f.goals?.away ?? 0,
      },
      startTime: f.fixture?.date || new Date().toISOString(),
      elapsed: elapsed ? `${elapsed}'` : statusInfo.period,
      period: statusInfo.period,
    };
  });

  // API-Football free plan: 100 req/day → cache 5 min
  cacheSet('apifootball:live', events, 300_000);
  return events;
}

async function fetchFootballScheduled(): Promise<SportEvent[]> {
  const key = config.apiFootball.apiKey;
  if (!key) return [];

  const cached = cacheGet<SportEvent[]>('apifootball:scheduled');
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];
  const res = await fetchWithTimeout(
    `${config.apiFootball.baseUrl}/fixtures?date=${today}&status=NS-TBD`,
    { 'x-apisports-key': key },
  );
  if (!res.ok) throw new Error(`API-Football ${res.status}`);
  const data: any = await res.json();
  const fixtures: any[] = data.response || [];

  const events: SportEvent[] = fixtures.slice(0, 30).map((f: any) => {
    const leagueName = f.league?.name || '';
    const leagueCountry = f.league?.country || '';

    return {
      id: f.fixture?.id || 0,
      sport: 'football',
      sportKo: '축구',
      league: leagueName,
      leagueKo: LEAGUE_NAME_KO[leagueName] || `${leagueName} (${leagueCountry})`,
      status: 'SCHEDULED' as const,
      homeTeam: {
        name: f.teams?.home?.name || 'TBD',
        nameKo: f.teams?.home?.name || 'TBD',
        logo: f.teams?.home?.logo || undefined,
      },
      awayTeam: {
        name: f.teams?.away?.name || 'TBD',
        nameKo: f.teams?.away?.name || 'TBD',
        logo: f.teams?.away?.logo || undefined,
      },
      startTime: f.fixture?.date || new Date().toISOString(),
    };
  });

  // Scheduled fixtures: cache 30 min (changes rarely)
  cacheSet('apifootball:scheduled', events, 1_800_000);
  return events;
}

// ─── Odds (mock-based, no live odds API available) ───
const BOOKMAKER_NAMES: Record<string, string> = {
  bet365: '벳365',
  pinnacle: '피나클',
  '1xbet': '원엑스벳',
  stake: '스테이크',
  betfair: '베트페어',
  bwin: '비윈',
  unibet: '유니벳',
};

const generateOdds = (eventId: number): EventOdds => {
  const seed = eventId * 7;
  const homeBase = 1.5 + ((seed % 30) / 10);
  const drawBase = 2.8 + ((seed % 15) / 10);
  const awayBase = 2.0 + ((seed % 25) / 10);
  const bookmakerKeys = Object.keys(BOOKMAKER_NAMES);

  const bookmakers: BookmakerOdds[] = bookmakerKeys.map((key, idx) => {
    const variance = ((idx * 3 + seed) % 20 - 10) / 100;
    return {
      bookmaker: key,
      bookmakerKo: BOOKMAKER_NAMES[key],
      markets: [
        {
          type: '1X2',
          outcomes: [
            { name: '홈 승', odds: parseFloat((homeBase + variance).toFixed(2)) },
            { name: '무승부', odds: parseFloat((drawBase + variance * 0.5).toFixed(2)) },
            { name: '원정 승', odds: parseFloat((awayBase - variance).toFixed(2)) },
          ],
        },
        {
          type: 'Over/Under 2.5',
          outcomes: [
            { name: '오버 2.5', odds: parseFloat((1.7 + variance * 0.8).toFixed(2)) },
            { name: '언더 2.5', odds: parseFloat((2.1 - variance * 0.8).toFixed(2)) },
          ],
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  });

  return { eventId, bookmakers };
};

// ─── Service ─────────────────────────────────────────
export class SportsService {
  async getLiveEvents(sport?: string): Promise<SportEvent[]> {
    const results: SportEvent[] = [];

    // Fetch football live from API-Football
    if (!sport || sport === 'football') {
      try {
        const footballEvents = await fetchFootballLive();
        results.push(...footballEvents);
      } catch {
        if (!sport || sport === 'football') {
          results.push(...MOCK_LIVE_EVENTS.filter((e) => e.sport === 'football'));
        }
      }
    }

    // Fetch esports live from PandaScore
    if (!sport || sport === 'esports') {
      try {
        const esportsEvents = await fetchPandaScoreRunning();
        results.push(...esportsEvents);
      } catch {
        results.push(...MOCK_ESPORTS_LIVE);
      }
    }

    // For other sports, use mock data if no specific sport filter or matching sport
    if (!sport) {
      // No real API for basketball/baseball/etc yet - omit mock for cleaner UX
    } else if (sport !== 'football' && sport !== 'esports') {
      // No real data for this sport
      return MOCK_LIVE_EVENTS.filter((e) => e.sport === sport);
    }

    return results;
  }

  async getScheduledEvents(sport?: string): Promise<SportEvent[]> {
    const results: SportEvent[] = [];

    if (!sport || sport === 'football') {
      try {
        const footballEvents = await fetchFootballScheduled();
        results.push(...footballEvents);
      } catch {
        if (!sport || sport === 'football') {
          results.push(...MOCK_SCHEDULED_EVENTS.filter((e) => e.sport === 'football'));
        }
      }
    }

    if (!sport || sport === 'esports') {
      try {
        const esportsEvents = await fetchPandaScoreUpcoming();
        results.push(...esportsEvents);
      } catch {
        // No mock scheduled esports
      }
    }

    if (sport && sport !== 'football' && sport !== 'esports') {
      return MOCK_SCHEDULED_EVENTS.filter((e) => e.sport === sport);
    }

    return results;
  }

  async getEventOdds(eventId: number): Promise<EventOdds> {
    // No live odds API available - use generated odds
    return generateOdds(eventId);
  }

  getSportCategories(): SportCategory[] {
    return SPORT_CATEGORIES;
  }

  getEsportsCategories(): EsportsCategory[] {
    return ESPORTS_CATEGORIES;
  }

  async getEsportsLive(): Promise<SportEvent[]> {
    try {
      const events = await fetchPandaScoreRunning();
      if (events.length > 0) return events;
    } catch {
      // Fall back to mock
    }
    return [...MOCK_ESPORTS_LIVE];
  }
}
