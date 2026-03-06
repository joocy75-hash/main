import { create } from 'zustand';
import { api } from '@/lib/api-client';
import type {
  GameCategory,
  GameProvider,
  Game,
  GameLaunchResponse,
} from '../../../shared/types/game';

interface BackendPaginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface GameState {
  categories: { code: GameCategory; name: string; icon: string }[];
  providers: GameProvider[];
  games: Game[];
  popularGames: Game[];
  recentGames: Game[];
  selectedCategory: GameCategory | null;
  selectedProvider: string | null;
  searchQuery: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  currentPage: number;
  hasMore: boolean;
  totalGames: number;

  fetchProviders: (category?: GameCategory) => Promise<void>;
  fetchGames: (providerCode?: string, page?: number, limit?: number) => Promise<void>;
  loadMoreGames: () => Promise<void>;
  searchGames: (query: string, category?: GameCategory) => Promise<void>;
  fetchPopularGames: () => Promise<void>;
  fetchRecentGames: () => Promise<void>;
  launchGame: (gameId: string, platform: 1 | 2) => Promise<GameLaunchResponse>;
  launchDemoGame: (gameId: string, platform: 1 | 2) => Promise<GameLaunchResponse>;
  setSelectedCategory: (category: GameCategory | null) => void;
  setSelectedProvider: (providerCode: string | null) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

const PAGE_SIZE = 20;

export const useGameStore = create<GameState>((set, get) => ({
  categories: [],
  providers: [],
  games: [],
  popularGames: [],
  recentGames: [],
  selectedCategory: null,
  selectedProvider: null,
  searchQuery: '',
  isLoading: false,
  isLoadingMore: false,
  currentPage: 1,
  hasMore: true,
  totalGames: 0,

  fetchProviders: async (category?) => {
    try {
      const params: Record<string, string> = {};
      if (category) params.category = category;
      const providers = await api.get<GameProvider[]>('/api/games/providers', params);
      set({ providers: Array.isArray(providers) ? providers : [] });
    } catch {
      set({ providers: [] });
    }
  },

  fetchGames: async (providerCode?, page = 1, limit = PAGE_SIZE) => {
    set({ isLoading: true });
    try {
      const { selectedCategory, searchQuery } = get();
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (providerCode) params.provider = providerCode;
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.q = searchQuery;

      const paginated = await api.get<BackendPaginated<Game>>('/api/games/search', params);
      set({
        games: paginated.items,
        currentPage: paginated.page,
        hasMore: paginated.page < paginated.totalPages,
        totalGames: paginated.total,
        isLoading: false,
      });
    } catch {
      set({ games: [], isLoading: false, hasMore: false });
    }
  },

  loadMoreGames: async () => {
    const { isLoadingMore, hasMore, currentPage, selectedProvider, selectedCategory, searchQuery, games } = get();
    if (isLoadingMore || !hasMore) return;

    set({ isLoadingMore: true });
    try {
      const nextPage = currentPage + 1;
      const params: Record<string, string> = {
        page: String(nextPage),
        limit: String(PAGE_SIZE),
      };
      if (selectedProvider) params.provider = selectedProvider;
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.q = searchQuery;

      const paginated = await api.get<BackendPaginated<Game>>('/api/games/search', params);
      set({
        games: [...games, ...paginated.items],
        currentPage: paginated.page,
        hasMore: paginated.page < paginated.totalPages,
        isLoadingMore: false,
      });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  searchGames: async (query, category?) => {
    set({ searchQuery: query, isLoading: true });
    try {
      const params: Record<string, string> = {
        q: query,
        page: '1',
        limit: String(PAGE_SIZE),
      };
      if (category) params.category = category;

      const paginated = await api.get<BackendPaginated<Game>>('/api/games/search', params);
      set({
        games: paginated.items,
        currentPage: 1,
        hasMore: paginated.page < paginated.totalPages,
        totalGames: paginated.total,
        isLoading: false,
      });
    } catch {
      set({ games: [], isLoading: false, hasMore: false });
    }
  },

  fetchPopularGames: async () => {
    try {
      const res = await api.get<Game[]>('/api/games/popular');
      set({ popularGames: Array.isArray(res) ? res : [] });
    } catch {
      set({ popularGames: [] });
    }
  },

  fetchRecentGames: async () => {
    try {
      const res = await api.get<Game[]>('/api/games/recent');
      set({ recentGames: Array.isArray(res) ? res : [] });
    } catch {
      set({ recentGames: [] });
    }
  },

  launchGame: async (gameId, platform) => {
    return await api.post<GameLaunchResponse>('/api/games/launch', {
      gameId,
      platform,
    });
  },

  launchDemoGame: async (gameId, platform) => {
    return await api.post<GameLaunchResponse>('/api/games/demo', {
      gameId,
      platform,
    });
  },

  setSelectedCategory: (category) => {
    set({
      selectedCategory: category,
      selectedProvider: null,
      games: [],
      currentPage: 1,
      hasMore: true,
    });
  },

  setSelectedProvider: (providerCode) => {
    set({
      selectedProvider: providerCode,
      games: [],
      currentPage: 1,
      hasMore: true,
    });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  reset: () => {
    set({
      providers: [],
      games: [],
      selectedCategory: null,
      selectedProvider: null,
      searchQuery: '',
      isLoading: false,
      isLoadingMore: false,
      currentPage: 1,
      hasMore: true,
      totalGames: 0,
    });
  },
}));
