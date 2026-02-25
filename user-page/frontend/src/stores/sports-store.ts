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
  { code: 'all', name: 'All', nameKo: '전체', icon: '🏆', eventCount: 0 },
  { code: 'football', name: 'Football', nameKo: '축구', icon: '⚽', eventCount: 12 },
  { code: 'basketball', name: 'Basketball', nameKo: '농구', icon: '🏀', eventCount: 8 },
  { code: 'baseball', name: 'Baseball', nameKo: '야구', icon: '⚾', eventCount: 5 },
  { code: 'tennis', name: 'Tennis', nameKo: '테니스', icon: '🎾', eventCount: 6 },
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
    homeTeam: { name: 'Manchester United', nameKo: '맨유', score: 2 },
    awayTeam: { name: 'Liverpool', nameKo: '리버풀', score: 1 },
    startTime: new Date(Date.now() - 67 * 60000).toISOString(),
    elapsed: "67'", period: '후반전',
  },
  {
    id: 2, sport: 'football', sportKo: '축구',
    league: 'La Liga', leagueKo: '라리가', status: 'LIVE',
    homeTeam: { name: 'Real Madrid', nameKo: '레알 마드리드', score: 0 },
    awayTeam: { name: 'FC Barcelona', nameKo: '바르셀로나', score: 0 },
    startTime: new Date(Date.now() - 23 * 60000).toISOString(),
    elapsed: "23'", period: '전반전',
  },
];

const MOCK_SCHEDULED_EVENTS: SportEvent[] = [
  {
    id: 101, sport: 'football', sportKo: '축구',
    league: 'Champions League', leagueKo: '챔피언스리그', status: 'SCHEDULED',
    homeTeam: { name: 'Bayern Munich', nameKo: '바이에른 뮌헨' },
    awayTeam: { name: 'PSG', nameKo: '파리 생제르맹' },
    startTime: new Date(Date.now() + 3 * 3600000).toISOString(),
  },
];

const MOCK_ESPORTS_EVENTS: SportEvent[] = [
  {
    id: 201, sport: 'esports', sportKo: 'e스포츠',
    league: 'LCK', leagueKo: 'LCK Spring 2026', status: 'LIVE',
    homeTeam: { name: 'T1', nameKo: 'T1', score: 1 },
    awayTeam: { name: 'Gen.G', nameKo: 'Gen.G', score: 1 },
    startTime: new Date(Date.now() - 90 * 60000).toISOString(),
    elapsed: 'LoL - Bo3 (2/3)', period: 'Bo3 Game 3',
  },
  {
    id: 202, sport: 'esports', sportKo: 'e스포츠',
    league: 'BLAST Premier', leagueKo: 'CS2 - BLAST 프리미어', status: 'LIVE',
    homeTeam: { name: 'NAVI', nameKo: 'NAVI', score: 1 },
    awayTeam: { name: 'FaZe Clan', nameKo: 'FaZe', score: 0 },
    startTime: new Date(Date.now() - 60 * 60000).toISOString(),
    elapsed: 'CS2 - Bo3 (1/3)', period: 'Bo3 Map 2',
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
