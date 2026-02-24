// Sports service providing mock data that mimics real RapidAPI responses.

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

const SPORT_CATEGORIES: SportCategory[] = [
  { code: 'football', name: 'Football', nameKo: '축구', icon: '⚽', eventCount: 12 },
  { code: 'basketball', name: 'Basketball', nameKo: '농구', icon: '🏀', eventCount: 6 },
  { code: 'baseball', name: 'Baseball', nameKo: '야구', icon: '⚾', eventCount: 4 },
  { code: 'tennis', name: 'Tennis', nameKo: '테니스', icon: '🎾', eventCount: 5 },
  { code: 'volleyball', name: 'Volleyball', nameKo: '배구', icon: '🏐', eventCount: 3 },
  { code: 'ice_hockey', name: 'Ice Hockey', nameKo: '아이스하키', icon: '🏒', eventCount: 2 },
  { code: 'esports', name: 'Esports', nameKo: 'e스포츠', icon: '🎮', eventCount: 4 },
  { code: 'mma', name: 'MMA', nameKo: '격투기', icon: '🥊', eventCount: 2 },
  { code: 'table_tennis', name: 'Table Tennis', nameKo: '탁구', icon: '🏓', eventCount: 3 },
];

const ESPORTS_CATEGORIES: EsportsCategory[] = [
  { code: 'lol', name: 'League of Legends', nameKo: 'LoL', icon: '⚔️' },
  { code: 'cs2', name: 'Counter-Strike 2', nameKo: 'CS2', icon: '🔫' },
  { code: 'valorant', name: 'Valorant', nameKo: '발로란트', icon: '🎯' },
  { code: 'dota2', name: 'Dota 2', nameKo: '도타2', icon: '🛡️' },
];

const MOCK_LIVE_EVENTS: SportEvent[] = [
  {
    id: 1001,
    sport: 'football',
    sportKo: '축구',
    league: 'Premier League',
    leagueKo: '프리미어리그',
    status: 'LIVE',
    homeTeam: { name: 'Manchester United', nameKo: '맨유', score: 2 },
    awayTeam: { name: 'Liverpool', nameKo: '리버풀', score: 1 },
    startTime: new Date(Date.now() - 67 * 60 * 1000).toISOString(),
    elapsed: '67\'',
    period: '2nd Half',
  },
  {
    id: 1002,
    sport: 'football',
    sportKo: '축구',
    league: 'La Liga',
    leagueKo: '라리가',
    status: 'LIVE',
    homeTeam: { name: 'Real Madrid', nameKo: '레알 마드리드', score: 0 },
    awayTeam: { name: 'FC Barcelona', nameKo: '바르셀로나', score: 0 },
    startTime: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    elapsed: '23\'',
    period: '1st Half',
  },
  {
    id: 1003,
    sport: 'basketball',
    sportKo: '농구',
    league: 'NBA',
    leagueKo: 'NBA',
    status: 'LIVE',
    homeTeam: { name: 'LA Lakers', nameKo: 'LA 레이커스', score: 87 },
    awayTeam: { name: 'Golden State Warriors', nameKo: '골든 스테이트', score: 92 },
    startTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    elapsed: 'Q3 4:22',
    period: '3rd Quarter',
  },
  {
    id: 1004,
    sport: 'baseball',
    sportKo: '야구',
    league: 'KBO',
    leagueKo: 'KBO 리그',
    status: 'LIVE',
    homeTeam: { name: 'Doosan Bears', nameKo: '두산 베어스', score: 3 },
    awayTeam: { name: 'Kiwoom Heroes', nameKo: '키움 히어로즈', score: 5 },
    startTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    elapsed: '6회 초',
    period: '6th Inning',
  },
  {
    id: 1005,
    sport: 'tennis',
    sportKo: '테니스',
    league: 'ATP Tour',
    leagueKo: 'ATP 투어',
    status: 'LIVE',
    homeTeam: { name: 'Hyeon Chung', nameKo: '정현', score: 1 },
    awayTeam: { name: 'Rafael Nadal', nameKo: '나달', score: 1 },
    startTime: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    elapsed: '2세트 4-3',
    period: '2nd Set',
  },
  {
    id: 1006,
    sport: 'football',
    sportKo: '축구',
    league: 'K League 1',
    leagueKo: 'K리그 1',
    status: 'LIVE',
    homeTeam: { name: 'Jeonbuk Hyundai', nameKo: '전북 현대', score: 1 },
    awayTeam: { name: 'Ulsan HD', nameKo: '울산 HD', score: 2 },
    startTime: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    elapsed: '55\'',
    period: '2nd Half',
  },
  {
    id: 1007,
    sport: 'basketball',
    sportKo: '농구',
    league: 'KBL',
    leagueKo: 'KBL',
    status: 'LIVE',
    homeTeam: { name: 'Seoul Samsung', nameKo: '서울 삼성', score: 45 },
    awayTeam: { name: 'Anyang KGC', nameKo: '안양 KGC', score: 51 },
    startTime: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    elapsed: 'Q2 8:10',
    period: '2nd Quarter',
  },
  {
    id: 1008,
    sport: 'volleyball',
    sportKo: '배구',
    league: 'V-League',
    leagueKo: 'V-리그',
    status: 'LIVE',
    homeTeam: { name: 'Samsung Bluefangs', nameKo: '삼성 블루팡스', score: 2 },
    awayTeam: { name: 'Korean Air Jumbos', nameKo: '대한항공 점보스', score: 1 },
    startTime: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    elapsed: '4세트 15-12',
    period: '4th Set',
  },
];

const MOCK_SCHEDULED_EVENTS: SportEvent[] = [
  {
    id: 2001,
    sport: 'football',
    sportKo: '축구',
    league: 'Champions League',
    leagueKo: '챔피언스리그',
    status: 'SCHEDULED',
    homeTeam: { name: 'Bayern Munich', nameKo: '바이에른 뮌헨' },
    awayTeam: { name: 'PSG', nameKo: '파리 생제르맹' },
    startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2002,
    sport: 'football',
    sportKo: '축구',
    league: 'Premier League',
    leagueKo: '프리미어리그',
    status: 'SCHEDULED',
    homeTeam: { name: 'Arsenal', nameKo: '아스널' },
    awayTeam: { name: 'Chelsea', nameKo: '첼시' },
    startTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2003,
    sport: 'basketball',
    sportKo: '농구',
    league: 'NBA',
    leagueKo: 'NBA',
    status: 'SCHEDULED',
    homeTeam: { name: 'Boston Celtics', nameKo: '보스턴 셀틱스' },
    awayTeam: { name: 'Miami Heat', nameKo: '마이애미 히트' },
    startTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2004,
    sport: 'baseball',
    sportKo: '야구',
    league: 'KBO',
    leagueKo: 'KBO 리그',
    status: 'SCHEDULED',
    homeTeam: { name: 'LG Twins', nameKo: 'LG 트윈스' },
    awayTeam: { name: 'SSG Landers', nameKo: 'SSG 랜더스' },
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2005,
    sport: 'tennis',
    sportKo: '테니스',
    league: 'Wimbledon',
    leagueKo: '윔블던',
    status: 'SCHEDULED',
    homeTeam: { name: 'Novak Djokovic', nameKo: '조코비치' },
    awayTeam: { name: 'Carlos Alcaraz', nameKo: '알카라스' },
    startTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_ESPORTS_LIVE: SportEvent[] = [
  {
    id: 3001,
    sport: 'esports',
    sportKo: 'e스포츠',
    league: 'LCK',
    leagueKo: 'LCK',
    status: 'LIVE',
    homeTeam: { name: 'T1', nameKo: 'T1', score: 1 },
    awayTeam: { name: 'Gen.G', nameKo: 'Gen.G', score: 1 },
    startTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    elapsed: 'Game 3 - 25분',
    period: 'Bo3 Game 3',
  },
  {
    id: 3002,
    sport: 'esports',
    sportKo: 'e스포츠',
    league: 'BLAST Premier',
    leagueKo: 'BLAST 프리미어',
    status: 'LIVE',
    homeTeam: { name: 'NAVI', nameKo: 'NAVI', score: 1 },
    awayTeam: { name: 'FaZe Clan', nameKo: 'FaZe', score: 0 },
    startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    elapsed: 'Map 2 - 14:10',
    period: 'Bo3 Map 2',
  },
  {
    id: 3003,
    sport: 'esports',
    sportKo: 'e스포츠',
    league: 'VCT Pacific',
    leagueKo: 'VCT 퍼시픽',
    status: 'LIVE',
    homeTeam: { name: 'DRX', nameKo: 'DRX', score: 0 },
    awayTeam: { name: 'Paper Rex', nameKo: '페이퍼 렉스', score: 1 },
    startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    elapsed: 'Map 2 - 8:6',
    period: 'Bo3 Map 2',
  },
  {
    id: 3004,
    sport: 'esports',
    sportKo: 'e스포츠',
    league: 'DPC',
    leagueKo: 'DPC',
    status: 'LIVE',
    homeTeam: { name: 'Team Spirit', nameKo: '팀 스피릿', score: 1 },
    awayTeam: { name: 'Tundra', nameKo: '툰드라', score: 0 },
    startTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    elapsed: 'Game 2 - 32분',
    period: 'Bo3 Game 2',
  },
];

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
        {
          type: 'BTTS',
          outcomes: [
            { name: '양팀 득점', odds: parseFloat((1.8 + variance * 0.5).toFixed(2)) },
            { name: '양팀 미득점', odds: parseFloat((1.95 - variance * 0.5).toFixed(2)) },
          ],
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  });

  return { eventId, bookmakers };
};

export class SportsService {
  async getLiveEvents(sport?: string): Promise<SportEvent[]> {
    let events = [...MOCK_LIVE_EVENTS];
    if (sport) {
      events = events.filter((e) => e.sport === sport);
    }
    return events;
  }

  async getScheduledEvents(sport?: string): Promise<SportEvent[]> {
    let events = [...MOCK_SCHEDULED_EVENTS];
    if (sport) {
      events = events.filter((e) => e.sport === sport);
    }
    return events;
  }

  async getEventOdds(eventId: number): Promise<EventOdds> {
    return generateOdds(eventId);
  }

  getSportCategories(): SportCategory[] {
    return SPORT_CATEGORIES;
  }

  getEsportsCategories(): EsportsCategory[] {
    return ESPORTS_CATEGORIES;
  }

  async getEsportsLive(): Promise<SportEvent[]> {
    return [...MOCK_ESPORTS_LIVE];
  }
}
