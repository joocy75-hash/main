import { create } from 'zustand';
import { api } from '@/lib/api-client';
import type { BepickRound, MinigameType } from '../../../shared/types/minigame';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface MinigameState {
  rounds: BepickRound[];
  currentRound: BepickRound | null;
  gameTypes: MinigameType[];
  selectedGame: string;
  isLoading: boolean;

  fetchRounds: () => Promise<void>;
  fetchCurrentRound: () => Promise<void>;
  fetchGameTypes: () => Promise<void>;
  setSelectedGame: (game: string) => void;
}

export const useMinigameStore = create<MinigameState>((set, get) => ({
  rounds: [],
  currentRound: null,
  gameTypes: [],
  selectedGame: 'powerball',
  isLoading: false,

  fetchRounds: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<ApiResponse<BepickRound[]>>('/api/minigame/rounds', {
        game: get().selectedGame,
        limit: '30',
      });
      set({ rounds: res.data, isLoading: false });
    } catch {
      set({ rounds: [], isLoading: false });
    }
  },

  fetchCurrentRound: async () => {
    try {
      const res = await api.get<ApiResponse<BepickRound>>('/api/minigame/current', {
        game: get().selectedGame,
      });
      set({ currentRound: res.data });
    } catch {
      // keep previous state on fetch error
    }
  },

  fetchGameTypes: async () => {
    try {
      const res = await api.get<ApiResponse<MinigameType[]>>('/api/minigame/types');
      set({ gameTypes: res.data });
    } catch {
      set({ gameTypes: [] });
    }
  },

  setSelectedGame: (game) => {
    set({ selectedGame: game, rounds: [], currentRound: null });
  },
}));
