import { create } from 'zustand';
import { api } from '@/lib/api-client';

// Backend wraps all responses in { success, data }
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface Team {
  name: string;
  nameKo: string;
  logo?: string;
  score?: number;
}

export interface SportEvent {
  id: number;
  sport: string;
  sportKo: string;
  league: string;
  leagueKo: string;
  homeTeam: Team;
  awayTeam: Team;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
  period?: string;
  elapsed?: string;
  startTime: string;
  leagueLogo?: string;
  countryFlag?: string;
  countryName?: string;
  odds?: {
    h: string;
    d: string;
    a: string;
  };
}

export interface SportCategory {
  code: string;
  name: string;
  nameKo: string;
  icon: string;
  eventCount: number;
}

export interface EsportsCategory {
  code: string;
  name: string;
  nameKo: string;
  icon: string;
}

// Mock data for fallback
const MOCK_SPORT_CATEGORIES: SportCategory[] = [
  { code: 'all', name: 'All', nameKo: '전체', icon: '🏆', eventCount: 40 },
  { code: 'football', name: 'Football', nameKo: '축구', icon: '⚽', eventCount: 12 },
  { code: 'basketball', name: 'Basketball', nameKo: '농구', icon: '🏀', eventCount: 10 },
  { code: 'baseball', name: 'Baseball', nameKo: '야구', icon: '⚾', eventCount: 6 },
  { code: 'tennis', name: 'Tennis', nameKo: '테니스', icon: '🎾', eventCount: 6 },
  { code: 'hockey', name: 'Hockey', nameKo: '하키', icon: '🏒', eventCount: 9 },
];

const MOCK_ESPORTS_CATEGORIES: EsportsCategory[] = [
  { code: 'lol', name: 'League of Legends', nameKo: 'LoL', icon: '⚔️' },
  { code: 'cs2', name: 'Counter-Strike', nameKo: 'CS2', icon: '🔫' },
  { code: 'dota2', name: 'Dota 2', nameKo: '도타2', icon: '🛡️' },
  { code: 'valorant', name: 'Valorant', nameKo: '발로란트', icon: '🎯' },
];

const MOCK_LIVE_EVENTS: SportEvent[] = [
  {
    id: 1, sport: 'football', sportKo: '축구',
    league: 'Premier League', leagueKo: '프리미어리그', status: 'LIVE',
    countryName: '잉글랜드', countryFlag: 'https://media.api-sports.io/flags/gb.svg',
    leagueLogo: 'https://media.api-sports.io/football/leagues/39.png',
    homeTeam: { name: 'Manchester United', nameKo: '맨유', score: 2, logo: 'https://media.api-sports.io/football/teams/33.png' },
    awayTeam: { name: 'Liverpool', nameKo: '리버풀', score: 1, logo: 'https://media.api-sports.io/football/teams/40.png' },
    startTime: new Date(Date.now() - 67 * 60000).toISOString(),
    elapsed: "67'", period: '후반전',
    odds: { h: '2.23', d: '2.86', a: '3.30' }
  },
  {
    id: 2, sport: 'football', sportKo: '축구',
    league: 'La Liga', leagueKo: '라리가', status: 'LIVE',
    countryName: '스페인', countryFlag: 'https://media.api-sports.io/flags/es.svg',
    leagueLogo: 'https://media.api-sports.io/football/leagues/140.png',
    homeTeam: { name: 'Real Madrid', nameKo: '레알 마드리드', score: 0, logo: 'https://media.api-sports.io/football/teams/541.png' },
    awayTeam: { name: 'FC Barcelona', nameKo: '바르셀로나', score: 0, logo: 'https://media.api-sports.io/football/teams/529.png' },
    startTime: new Date(Date.now() - 23 * 60000).toISOString(),
    elapsed: "23'", period: '전반전',
    odds: { h: '1.55', d: '3.80', a: '5.20' }
  },
  {
    id: 3, sport: 'basketball', sportKo: '농구',
    league: 'NBA', leagueKo: 'NBA', status: 'LIVE',
    countryName: '미국',
    homeTeam: { name: 'Los Angeles Lakers', nameKo: 'LA 레이커스', score: 87 },
    awayTeam: { name: 'Golden State Warriors', nameKo: 'GS 워리어스', score: 92 },
    startTime: new Date(Date.now() - 120 * 60000).toISOString(),
    elapsed: '3Q 8:45', period: '3쿼터',
    odds: { h: '1.65', d: 'VS', a: '2.15' }
  },
  {
    id: 4, sport: 'hockey', sportKo: '하키',
    league: 'NHL', leagueKo: 'NHL', status: 'LIVE',
    countryName: '미국',
    homeTeam: { name: 'Edmonton Oilers', nameKo: '에드먼턴 오일러스', score: 3 },
    awayTeam: { name: 'Florida Panthers', nameKo: '플로리다 팬서스', score: 2 },
    startTime: new Date(Date.now() - 100 * 60000).toISOString(),
    elapsed: '2P 14:22', period: '2피리어드',
    odds: { h: '1.80', d: 'VS', a: '1.95' }
  }
];

const MOCK_SCHEDULED_EVENTS: SportEvent[] = [
  {
    id: 101, sport: 'football', sportKo: '축구',
    league: 'Champions League', leagueKo: '챔피언스리그', status: 'SCHEDULED',
    countryName: '유럽',
    leagueLogo: 'https://media.api-sports.io/football/leagues/2.png',
    homeTeam: { name: 'Bayern Munich', nameKo: '바이에른 뮌헨', logo: 'https://media.api-sports.io/football/teams/157.png' },
    awayTeam: { name: 'PSG', nameKo: '파리 생제르맹', logo: 'https://media.api-sports.io/football/teams/85.png' },
    startTime: new Date(Date.now() + 3 * 3600000).toISOString(),
    odds: { h: '2.10', d: '3.10', a: '3.50' }
  },
  {
    id: 102, sport: 'football', sportKo: '축구',
    league: 'Serie A', leagueKo: '세리에A', status: 'SCHEDULED',
    countryName: '이탈리아', countryFlag: 'https://media.api-sports.io/flags/it.svg',
    leagueLogo: 'https://media.api-sports.io/football/leagues/135.png',
    homeTeam: { name: 'Inter Milan', nameKo: '인테르', logo: 'https://media.api-sports.io/football/teams/505.png' },
    awayTeam: { name: 'AC Milan', nameKo: 'AC밀란', logo: 'https://media.api-sports.io/football/teams/489.png' },
    startTime: new Date(Date.now() + 5 * 3600000).toISOString(),
    odds: { h: '1.75', d: '3.40', a: '4.80' }
  },
  {
    id: 103, sport: 'football', sportKo: '축구',
    league: 'K League 1', leagueKo: 'K리그1', status: 'SCHEDULED',
    countryName: '한국', countryFlag: 'https://media.api-sports.io/flags/kr.svg',
    homeTeam: { name: 'Ulsan HD', nameKo: '울산 HD' },
    awayTeam: { name: 'FC Seoul', nameKo: 'FC 서울' },
    startTime: new Date(Date.now() + 8 * 3600000).toISOString(),
    odds: { h: '1.90', d: '3.20', a: '3.90' }
  },
];

const MOCK_ESPORTS_EVENTS: SportEvent[] = [
  {
    id: 201, sport: 'esports', sportKo: 'e스포츠',
    league: 'LCK', leagueKo: 'LCK Spring 2026', status: 'LIVE',
    leagueLogo: 'https://cdn.pandascore.co/images/league/image/4302/lck-logo.png',
    homeTeam: { name: 'T1', nameKo: 'T1', score: 1, logo: 'https://cdn.pandascore.co/images/team/image/126321/t1.png' },
    awayTeam: { name: 'Gen.G', nameKo: 'Gen.G', score: 1, logo: 'https://cdn.pandascore.co/images/team/image/131953/geng.png' },
    startTime: new Date(Date.now() - 90 * 60000).toISOString(),
    elapsed: 'LoL - Bo3 (2/3)', period: 'Bo3 Game 3',
    odds: { h: '1.80', d: 'VS', a: '1.95' }
  },
  {
    id: 202, sport: 'esports', sportKo: 'e스포츠',
    league: 'BLAST Premier', leagueKo: 'CS2 - BLAST 프리미어', status: 'LIVE',
    leagueLogo: 'https://cdn.pandascore.co/images/league/image/4759/blast-premier.png',
    homeTeam: { name: 'NAVI', nameKo: 'NAVI', score: 1, logo: 'https://cdn.pandascore.co/images/team/image/125533/navi.png' },
    awayTeam: { name: 'FaZe Clan', nameKo: 'FaZe', score: 0, logo: 'https://cdn.pandascore.co/images/team/image/126282/faze.png' },
    startTime: new Date(Date.now() - 60 * 60000).toISOString(),
    elapsed: 'CS2 - Bo3 (1/3)', period: 'Bo3 Map 2',
    odds: { h: '2.10', d: 'VS', a: '1.70' }
  },
];

interface SportsState {
  sportEvents: SportEvent[];
  sportCategories: SportCategory[];
  selectedStatus: 'LIVE' | 'SCHEDULED';
  selectedSport: string;
  isLoading: boolean;

  esportsEvents: SportEvent[];
  esportsCategories: EsportsCategory[];
  selectedEsportGame: string;

  fetchSportEvents: (status?: 'LIVE' | 'SCHEDULED', sport?: string) => Promise<void>;
  fetchSportCategories: () => Promise<void>;
  fetchEsportsEvents: (game?: string) => Promise<void>;
  fetchEsportsCategories: () => Promise<void>;
  setSelectedStatus: (status: 'LIVE' | 'SCHEDULED') => void;
  setSelectedSport: (sport: string) => void;
  setSelectedEsportGame: (game: string) => void;
}

export const useSportsStore = create<SportsState>((set, get) => ({
  sportEvents: [],
  sportCategories: [],
  selectedStatus: 'LIVE',
  selectedSport: 'all',
  isLoading: false,

  esportsEvents: [],
  esportsCategories: [],
  selectedEsportGame: 'all',

  fetchSportEvents: async (status, sport) => {
    set({ isLoading: true });
    try {
      const currentStatus = status || get().selectedStatus;
      const currentSport = sport || get().selectedSport;
      const params: Record<string, string> = { status: currentStatus };
      if (currentSport && currentSport !== 'all') params.sport = currentSport;

      const res = await api.get<ApiResponse<SportEvent[]>>('/api/sports/events', params);
      set({ sportEvents: res.data, isLoading: false });
    } catch {
      const { selectedStatus, selectedSport } = get();
      const st = status || selectedStatus;
      const sp = sport || selectedSport;
      const mockData = st === 'LIVE' ? MOCK_LIVE_EVENTS : MOCK_SCHEDULED_EVENTS;
      const filtered = sp === 'all' ? mockData : mockData.filter((e) => e.sport === sp);
      set({ sportEvents: filtered, isLoading: false });
    }
  },

  fetchSportCategories: async () => {
    try {
      const res = await api.get<ApiResponse<SportCategory[]>>('/api/sports/categories');
      const categories = res.data;
      // Prepend "all" category if not present
      const hasAll = categories.some((c) => c.code === 'all');
      const withAll = hasAll
        ? categories
        : [{ code: 'all', name: 'All', nameKo: '전체', icon: '🏆', eventCount: 0 }, ...categories];
      set({ sportCategories: withAll });
    } catch {
      set({ sportCategories: MOCK_SPORT_CATEGORIES });
    }
  },

  fetchEsportsEvents: async (game) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string> = {};
      if (game && game !== 'all') params.game = game;
      const res = await api.get<ApiResponse<SportEvent[]>>('/api/esports/live', params);
      set({ esportsEvents: res.data, isLoading: false });
    } catch {
      const currentGame = game || get().selectedEsportGame;
      const filtered = currentGame === 'all'
        ? MOCK_ESPORTS_EVENTS
        : MOCK_ESPORTS_EVENTS.filter((e) => e.league.toLowerCase().includes(currentGame));
      set({ esportsEvents: filtered, isLoading: false });
    }
  },

  fetchEsportsCategories: async () => {
    try {
      const res = await api.get<ApiResponse<EsportsCategory[]>>('/api/esports/categories');
      set({ esportsCategories: res.data });
    } catch {
      set({ esportsCategories: MOCK_ESPORTS_CATEGORIES });
    }
  },

  setSelectedStatus: (status) => {
    set({ selectedStatus: status, sportEvents: [] });
  },

  setSelectedSport: (sport) => {
    set({ selectedSport: sport, sportEvents: [] });
  },

  setSelectedEsportGame: (game) => {
    set({ selectedEsportGame: game, esportsEvents: [] });
  },
}));
