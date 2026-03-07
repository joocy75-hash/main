import { create } from 'zustand';
import { api } from '@/lib/api-client';

export interface GameCategory {
  id: string;
  name: string;
  icon: string;
}

export interface GameProvider {
  code: string;
  name: string;
  ko: boolean;
  total: number;
  categories: Record<string, number>;
  image?: string;
}

export interface Game {
  uid: string;
  name: string;
  provider: string;
  providerName: string;
  type: string;
  category: string;
  image?: string;
  ko: boolean;
  status: number;
}

interface GameState {
  categories: GameCategory[];
  providers: GameProvider[];
  games: Game[];
  totalGames: number;
  selectedCategory: string;
  selectedProvider: string;
  searchQuery: string;
  isLoading: boolean;
  isLaunching: boolean;
  hasFetchedProviders: boolean;
  hasFetchedAll: boolean;

  fetchCategories: () => Promise<void>;
  fetchProvidersOnly: () => Promise<void>;
  fetchAllGames: () => Promise<void>;
  searchGames: (q?: string, category?: string, provider?: string) => Promise<Game[]>;
  launchGame: (gameUid: string, platform?: 1 | 2) => Promise<string>;
  launchDemo: (gameUid: string, platform?: 1 | 2) => Promise<string>;
  setSelectedCategory: (category: string) => void;
  setSelectedProvider: (provider: string) => void;
  setSearchQuery: (query: string) => void;

  // Computed getters
  filteredGames: () => Game[];
}

export const useGameStore = create<GameState>((set, get) => ({
  categories: [],
  providers: [],
  games: [],
  totalGames: 0,
  selectedCategory: 'all',
  selectedProvider: '',
  searchQuery: '',
  isLoading: false,
  isLaunching: false,
  hasFetchedProviders: false,
  hasFetchedAll: false,

  fetchCategories: async () => {
    try {
      const data = await api.get<GameCategory[]>('/api/games/categories');
      set({ categories: data });
    } catch {
      // ignore
    }
  },

  fetchProvidersOnly: async () => {
    if (get().hasFetchedProviders) return;
    set({ isLoading: true });
    try {
      const data = await api.get<{ providers: GameProvider[] }>('/api/games/providers-stats');
      set({
        providers: data.providers,
        hasFetchedProviders: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchAllGames: async () => {
    if (get().hasFetchedAll) return;
    set({ isLoading: true });
    try {
      const data = await api.get<{
        totalProviders: number;
        totalGames: number;
        providers: GameProvider[];
        games: Game[];
      }>('/api/games/all');
      set({
        providers: data.providers,
        games: data.games,
        totalGames: data.totalGames,
        hasFetchedProviders: true,
        hasFetchedAll: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  searchGames: async (q, category, provider) => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (category && category !== 'all') params.category = category;
    if (provider) params.provider = provider;
    try {
      return await api.get<Game[]>('/api/games/search', params);
    } catch {
      return [];
    }
  },

  launchGame: async (gameUid, platform = 1) => {
    set({ isLaunching: true });
    try {
      const data = await api.post<{ gameUrl: string; balance?: number }>(
        '/api/games/launch',
        { gameUid, platform }
      );
      set({ isLaunching: false });
      return data.gameUrl;
    } catch (err) {
      set({ isLaunching: false });
      throw err;
    }
  },

  launchDemo: async (gameUid, platform = 1) => {
    set({ isLaunching: true });
    try {
      const data = await api.post<{ gameUrl: string }>(
        '/api/games/demo',
        { gameUid, platform }
      );
      set({ isLaunching: false });
      return data.gameUrl;
    } catch (err) {
      set({ isLaunching: false });
      throw err;
    }
  },

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  filteredGames: () => {
    const { games, selectedCategory, selectedProvider, searchQuery } = get();
    let filtered = games;

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((g) => g.category === selectedCategory);
    }
    if (selectedProvider) {
      filtered = filtered.filter((g) => g.provider === selectedProvider);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (g) => g.name.toLowerCase().includes(q) || g.providerName.toLowerCase().includes(q)
      );
    }
    return filtered;
  },
}));
