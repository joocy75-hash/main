import { create } from 'zustand';
import { api } from '@/lib/api-client';

// Sports event types
export interface SportEvent {
  id: number;
  sport: string;
  sportKo: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
  period?: string;
  minute?: number;
  startTime: string;
  odds?: {
    home: number;
    draw?: number;
    away: number;
  };
}

export interface EsportsEvent {
  id: number;
  game: string;
  gameIcon: string;
  tournament: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
  bestOf?: number;
  mapScores?: { home: number; away: number }[];
  startTime: string;
  odds?: {
    home: number;
    away: number;
  };
}

export interface SportCategory {
  code: string;
  name: string;
  icon: string;
  count: number;
}

export interface EsportsCategory {
  code: string;
  name: string;
  icon: string;
}

// Mock data for development
const MOCK_SPORT_CATEGORIES: SportCategory[] = [
  { code: 'all', name: '전체', icon: '🏆', count: 0 },
  { code: 'football', name: '축구', icon: '⚽', count: 12 },
  { code: 'basketball', name: '농구', icon: '🏀', count: 8 },
  { code: 'baseball', name: '야구', icon: '⚾', count: 5 },
  { code: 'tennis', name: '테니스', icon: '🎾', count: 6 },
  { code: 'volleyball', name: '배구', icon: '🏐', count: 3 },
  { code: 'hockey', name: '아이스하키', icon: '🏒', count: 4 },
  { code: 'mma', name: '격투기', icon: '🥊', count: 2 },
  { code: 'table_tennis', name: '탁구', icon: '🏓', count: 3 },
];

const MOCK_ESPORTS_CATEGORIES: EsportsCategory[] = [
  { code: 'cs2', name: 'CS2', icon: '🔫' },
  { code: 'lol', name: 'LoL', icon: '⚔️' },
  { code: 'dota2', name: 'Dota 2', icon: '🛡️' },
  { code: 'valorant', name: '발로란트', icon: '🎯' },
];

const MOCK_LIVE_EVENTS: SportEvent[] = [
  {
    id: 1,
    sport: 'football',
    sportKo: '축구',
    league: 'EPL',
    homeTeam: '맨체스터 유나이티드',
    awayTeam: '리버풀',
    homeScore: 2,
    awayScore: 1,
    status: 'LIVE',
    period: '후반전',
    minute: 67,
    startTime: '2026-02-24T14:00:00Z',
    odds: { home: 1.85, draw: 3.5, away: 4.2 },
  },
  {
    id: 2,
    sport: 'basketball',
    sportKo: '농구',
    league: 'NBA',
    homeTeam: 'LA 레이커스',
    awayTeam: '골든스테이트',
    homeScore: 98,
    awayScore: 92,
    status: 'LIVE',
    period: '3Q',
    minute: 7,
    startTime: '2026-02-24T15:00:00Z',
    odds: { home: 1.4, away: 2.8 },
  },
  {
    id: 3,
    sport: 'football',
    sportKo: '축구',
    league: 'La Liga',
    homeTeam: '레알 마드리드',
    awayTeam: 'FC 바르셀로나',
    homeScore: 0,
    awayScore: 0,
    status: 'LIVE',
    period: '전반전',
    minute: 23,
    startTime: '2026-02-24T16:00:00Z',
    odds: { home: 2.1, draw: 3.2, away: 3.4 },
  },
  {
    id: 4,
    sport: 'baseball',
    sportKo: '야구',
    league: 'KBO',
    homeTeam: 'LG 트윈스',
    awayTeam: '삼성 라이온즈',
    homeScore: 5,
    awayScore: 3,
    status: 'LIVE',
    period: '7회초',
    startTime: '2026-02-24T13:00:00Z',
    odds: { home: 1.3, away: 3.5 },
  },
  {
    id: 5,
    sport: 'tennis',
    sportKo: '테니스',
    league: 'ATP',
    homeTeam: '정현',
    awayTeam: '나달',
    homeScore: 1,
    awayScore: 0,
    status: 'LIVE',
    period: '2세트',
    startTime: '2026-02-24T11:00:00Z',
    odds: { home: 3.2, away: 1.35 },
  },
];

const MOCK_SCHEDULED_EVENTS: SportEvent[] = [
  {
    id: 101,
    sport: 'football',
    sportKo: '축구',
    league: 'EPL',
    homeTeam: '아스널',
    awayTeam: '첼시',
    status: 'SCHEDULED',
    startTime: '2026-02-25T14:00:00Z',
    odds: { home: 2.1, draw: 3.3, away: 3.4 },
  },
  {
    id: 102,
    sport: 'basketball',
    sportKo: '농구',
    league: 'NBA',
    homeTeam: '보스턴 셀틱스',
    awayTeam: '밀워키 벅스',
    status: 'SCHEDULED',
    startTime: '2026-02-25T10:00:00Z',
    odds: { home: 1.75, away: 2.05 },
  },
  {
    id: 103,
    sport: 'football',
    sportKo: '축구',
    league: 'K리그',
    homeTeam: '전북 현대',
    awayTeam: '울산 현대',
    status: 'SCHEDULED',
    startTime: '2026-02-26T13:00:00Z',
    odds: { home: 2.5, draw: 3.0, away: 2.8 },
  },
  {
    id: 104,
    sport: 'baseball',
    sportKo: '야구',
    league: 'KBO',
    homeTeam: '두산 베어스',
    awayTeam: '키움 히어로즈',
    status: 'SCHEDULED',
    startTime: '2026-02-26T14:00:00Z',
    odds: { home: 1.9, away: 1.9 },
  },
];

const MOCK_ESPORTS_EVENTS: EsportsEvent[] = [
  {
    id: 201,
    game: 'cs2',
    gameIcon: '🔫',
    tournament: 'IEM Katowice 2026',
    homeTeam: 'Natus Vincere',
    awayTeam: 'FaZe Clan',
    homeScore: 1,
    awayScore: 0,
    status: 'LIVE',
    bestOf: 3,
    mapScores: [
      { home: 16, away: 12 },
      { home: 8, away: 10 },
    ],
    startTime: '2026-02-24T15:00:00Z',
    odds: { home: 1.65, away: 2.2 },
  },
  {
    id: 202,
    game: 'lol',
    gameIcon: '⚔️',
    tournament: 'LCK Spring 2026',
    homeTeam: 'T1',
    awayTeam: 'Gen.G',
    homeScore: 1,
    awayScore: 1,
    status: 'LIVE',
    bestOf: 5,
    mapScores: [
      { home: 1, away: 0 },
      { home: 0, away: 1 },
      { home: 0, away: 0 },
    ],
    startTime: '2026-02-24T17:00:00Z',
    odds: { home: 1.9, away: 1.9 },
  },
  {
    id: 203,
    game: 'valorant',
    gameIcon: '🎯',
    tournament: 'VCT Pacific 2026',
    homeTeam: 'DRX',
    awayTeam: 'Paper Rex',
    status: 'SCHEDULED',
    bestOf: 3,
    startTime: '2026-02-25T14:00:00Z',
    odds: { home: 2.1, away: 1.72 },
  },
  {
    id: 204,
    game: 'dota2',
    gameIcon: '🛡️',
    tournament: 'DPC 2026',
    homeTeam: 'Team Spirit',
    awayTeam: 'Team Liquid',
    status: 'SCHEDULED',
    bestOf: 3,
    startTime: '2026-02-25T18:00:00Z',
    odds: { home: 1.55, away: 2.4 },
  },
];

interface SportsState {
  // Sports
  sportEvents: SportEvent[];
  sportCategories: SportCategory[];
  selectedStatus: 'LIVE' | 'SCHEDULED';
  selectedSport: string;
  isLoading: boolean;

  // Esports
  esportsEvents: EsportsEvent[];
  esportsCategories: EsportsCategory[];
  selectedEsportGame: string;

  // Actions
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

      const data = await api.get<SportEvent[]>('/api/sports/events', params);
      set({ sportEvents: data, isLoading: false });
    } catch {
      // Fallback to mock data
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
      const data = await api.get<SportCategory[]>('/api/sports/categories');
      set({ sportCategories: data });
    } catch {
      set({ sportCategories: MOCK_SPORT_CATEGORIES });
    }
  },

  fetchEsportsEvents: async (game) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string> = {};
      if (game && game !== 'all') params.game = game;
      const data = await api.get<EsportsEvent[]>('/api/esports/live', params);
      set({ esportsEvents: data, isLoading: false });
    } catch {
      const currentGame = game || get().selectedEsportGame;
      const filtered = currentGame === 'all'
        ? MOCK_ESPORTS_EVENTS
        : MOCK_ESPORTS_EVENTS.filter((e) => e.game === currentGame);
      set({ esportsEvents: filtered, isLoading: false });
    }
  },

  fetchEsportsCategories: async () => {
    try {
      const data = await api.get<EsportsCategory[]>('/api/esports/categories');
      set({ esportsCategories: data });
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
