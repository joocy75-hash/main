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
  user: User;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  updateBalance: (balance: string) => void;
  initialize: () => void;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username: string, password: string) => {
    // HttpOnly cookies are set by the backend automatically
    const data = await api.post<AuthResponse>('/api/auth/login', {
      username,
      password,
    });

    set({
      user: data.user,
      isAuthenticated: true,
    });
  },

  register: async (data: RegisterData) => {
    // HttpOnly cookies are set by the backend automatically
    const res = await api.post<AuthResponse>('/api/auth/register', data);

    set({
      user: res.user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      // Backend clears HttpOnly cookies in the response
      await api.post('/api/auth/logout');
    } catch {
      // Ignore logout API errors
    }

    set({
      user: null,
      isAuthenticated: false,
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
    if (initialized) {
      set({ isLoading: false });
      return;
    }
    initialized = true;

    // With HttpOnly cookies, check auth by calling /api/profile
    // Cookies are sent automatically via credentials: 'include'
    set({ isLoading: true });
    api.get<User>('/api/profile').then((user) => {
      set({ user, isAuthenticated: true, isLoading: false });
    }).catch(() => {
      set({ user: null, isAuthenticated: false, isLoading: false });
    });

    // Register api-client auth sync callback
    setAuthCallbacks({
      onCleared: () => {
        set({ user: null, isAuthenticated: false });
      },
    });
  },
}));
