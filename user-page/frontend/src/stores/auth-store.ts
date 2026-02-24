import { create } from 'zustand';
import { api } from '@/lib/api-client';
import { setAuthCallbacks } from '@/lib/api-client';

interface User {
  id: number;
  username: string;
  nickname: string;
  status: string;
  balance: string;
  points: string;
  bonusBalance?: string;
  myReferralCode: string;
  vipLevel: number;
}

interface RegisterData {
  username: string;
  nickname: string;
  password: string;
  phone: string;
  referrerCode: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  updateBalance: (balance: string) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username: string, password: string) => {
    const data = await api.post<AuthResponse>('/api/auth/login', {
      username,
      password,
    });

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    set({
      user: data.user,
      isAuthenticated: true,
    });
  },

  register: async (data: RegisterData) => {
    const res = await api.post<AuthResponse>('/api/auth/register', data);

    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);

    set({
      user: res.user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      await api.post('/api/auth/logout', { refreshToken });
    } catch {
      // Ignore logout API errors
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    set({
      user: null,
      isAuthenticated: false,
    });
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다');
    }

    const data = await api.post<AuthResponse>('/api/auth/refresh', {
      refreshToken,
    });

    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }

    set({
      user: data.user,
      isAuthenticated: true,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },

  updateBalance: (balance: string) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, balance } });
    }
  },

  initialize: () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Check if token is expired by decoding JWT payload
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          // Token expired - attempt refresh
          const refresh = localStorage.getItem('refreshToken');
          if (refresh) {
            set({ isAuthenticated: false, isLoading: true });
            get().refreshToken().then(() => {
              set({ isLoading: false });
            }).catch(() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              set({ user: null, isAuthenticated: false, isLoading: false });
            });
            return;
          }
          localStorage.removeItem('accessToken');
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
      } catch {
        // Invalid token format - clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      set({ isAuthenticated: true, isLoading: false });
    } else {
      set({ isAuthenticated: false, isLoading: false });
    }

    // Register api-client auth sync callbacks
    setAuthCallbacks({
      onRefreshed: (accessToken, refreshToken) => {
        // Sync Zustand store when api-client auto-refreshes
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          if (payload.userId) {
            set({ isAuthenticated: true });
          }
        } catch {
          // Token parse failed, but localStorage is already updated
          set({ isAuthenticated: true });
        }
      },
      onCleared: () => {
        set({ user: null, isAuthenticated: false });
      },
    });
  },
}));
