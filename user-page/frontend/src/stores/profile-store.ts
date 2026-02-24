import { create } from 'zustand';
import { api } from '@/lib/api-client';

// Profile types
export interface Profile {
  id: number;
  username: string;
  nickname: string;
  phone: string;
  status: string;
  balance: string;
  points: string;
  bonusBalance: string;
  vipLevel: number;
  myReferralCode: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface BetRecord {
  id: number;
  gameCategory: string;
  gameName: string;
  betAmount: string;
  winAmount: string;
  result: 'win' | 'lose' | 'draw' | 'pending';
  createdAt: string;
}

export interface MoneyLog {
  id: number;
  type: string;
  amount: string;
  balanceAfter: string;
  description: string;
  createdAt: string;
}

export interface PointLog {
  id: number;
  type: string;
  amount: string;
  pointsAfter: string;
  description: string;
  createdAt: string;
}

export interface LoginHistory {
  id: number;
  ip: string;
  device: string;
  os: string;
  browser: string;
  createdAt: string;
}

export interface AffiliateDashboard {
  totalReferrals: number;
  thisMonthCommission: string;
  totalCommission: string;
  rollingRates: { category: string; rate: string }[];
}

export interface AffiliateMember {
  id: number;
  username: string;
  nickname: string;
  joinedAt: string;
  totalBet: string;
  commission: string;
}

export interface CommissionRecord {
  id: number;
  type: 'rolling' | 'losing';
  gameCategory: string;
  amount: string;
  fromUser: string;
  createdAt: string;
}

export interface Message {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Inquiry {
  id: number;
  title: string;
  content: string;
  status: 'pending' | 'answered';
  createdAt: string;
  replies?: InquiryReply[];
}

export interface InquiryReply {
  id: number;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface ProfileState {
  // Profile
  profile: Profile | null;
  isLoading: boolean;

  // Bets
  bets: BetRecord[];
  betsTotal: number;
  betsPage: number;
  betsHasMore: boolean;

  // Money logs
  moneyLogs: MoneyLog[];
  moneyLogsTotal: number;

  // Point logs
  pointLogs: PointLog[];
  pointLogsTotal: number;

  // Login history
  loginHistory: LoginHistory[];

  // Affiliate
  affiliateDashboard: AffiliateDashboard | null;
  affiliateMembers: AffiliateMember[];
  commissionRecords: CommissionRecord[];

  // Messages
  messages: Message[];
  messagesTotal: number;
  unreadCount: number;

  // Inquiries
  inquiries: Inquiry[];
  selectedInquiry: Inquiry | null;

  // Profile actions
  fetchProfile: () => Promise<void>;
  updateProfile: (nickname: string, phone: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  // Bet actions
  fetchBets: (filters?: { category?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) => Promise<void>;

  // Money log actions
  fetchMoneyLogs: (filters?: { type?: string; page?: number; limit?: number }) => Promise<void>;

  // Point log actions
  fetchPointLogs: (filters?: { type?: string; page?: number; limit?: number }) => Promise<void>;

  // Login history actions
  fetchLoginHistory: () => Promise<void>;

  // Affiliate actions
  fetchAffiliateDashboard: () => Promise<void>;
  fetchAffiliateMembers: (page?: number) => Promise<void>;
  fetchCommissionRecords: (page?: number) => Promise<void>;

  // Message actions
  fetchMessages: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  readMessage: (id: number) => Promise<Message | null>;
  deleteMessage: (id: number) => Promise<void>;

  // Inquiry actions
  fetchInquiries: () => Promise<void>;
  fetchInquiryDetail: (id: number) => Promise<void>;
  createInquiry: (title: string, content: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,

  bets: [],
  betsTotal: 0,
  betsPage: 1,
  betsHasMore: false,

  moneyLogs: [],
  moneyLogsTotal: 0,

  pointLogs: [],
  pointLogsTotal: 0,

  loginHistory: [],

  affiliateDashboard: null,
  affiliateMembers: [],
  commissionRecords: [],

  messages: [],
  messagesTotal: 0,
  unreadCount: 0,

  inquiries: [],
  selectedInquiry: null,

  // Profile
  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<Profile>('/api/profile');
      set({ profile: data, isLoading: false });
    } catch {
      set({ profile: null, isLoading: false });
    }
  },

  updateProfile: async (nickname, phone) => {
    try {
      const data = await api.put<Profile>('/api/profile', { nickname, phone });
      set({ profile: data });
    } catch {
      const { profile } = get();
      if (profile) {
        set({ profile: { ...profile, nickname, phone } });
      }
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    await api.post('/api/profile/password', { currentPassword, newPassword });
  },

  // Bets
  fetchBets: async (filters) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string> = {};
      if (filters?.category) params.category = filters.category;
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.limit) params.limit = String(filters.limit);

      const data = await api.get<PaginatedResponse<BetRecord>>('/api/profile/bets', params);
      set({
        bets: data.data,
        betsTotal: data.total,
        betsPage: data.page,
        betsHasMore: data.hasMore,
        isLoading: false,
      });
    } catch {
      set({ bets: [], betsTotal: 0, isLoading: false });
    }
  },

  // Money logs
  fetchMoneyLogs: async (filters) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string> = {};
      if (filters?.type) params.type = filters.type;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.limit) params.limit = String(filters.limit);

      const data = await api.get<PaginatedResponse<MoneyLog>>('/api/profile/money-logs', params);
      set({
        moneyLogs: data.data,
        moneyLogsTotal: data.total,
        isLoading: false,
      });
    } catch {
      set({ moneyLogs: [], moneyLogsTotal: 0, isLoading: false });
    }
  },

  // Point logs
  fetchPointLogs: async (filters) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string> = {};
      if (filters?.type) params.type = filters.type;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.limit) params.limit = String(filters.limit);

      const data = await api.get<PaginatedResponse<PointLog>>('/api/profile/point-logs', params);
      set({
        pointLogs: data.data,
        pointLogsTotal: data.total,
        isLoading: false,
      });
    } catch {
      set({ pointLogs: [], pointLogsTotal: 0, isLoading: false });
    }
  },

  // Login history
  fetchLoginHistory: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<LoginHistory[]>('/api/profile/login-history');
      set({ loginHistory: data, isLoading: false });
    } catch {
      set({ loginHistory: [], isLoading: false });
    }
  },

  // Affiliate
  fetchAffiliateDashboard: async () => {
    try {
      const data = await api.get<AffiliateDashboard>('/api/affiliate/dashboard');
      set({ affiliateDashboard: data });
    } catch {
      set({ affiliateDashboard: null });
    }
  },

  fetchAffiliateMembers: async (page = 1) => {
    try {
      const data = await api.get<PaginatedResponse<AffiliateMember>>('/api/affiliate/members', { page: String(page) });
      set({ affiliateMembers: data.data });
    } catch {
      set({ affiliateMembers: [] });
    }
  },

  fetchCommissionRecords: async (page = 1) => {
    try {
      const data = await api.get<PaginatedResponse<CommissionRecord>>('/api/affiliate/commissions', { page: String(page) });
      set({ commissionRecords: data.data });
    } catch {
      set({ commissionRecords: [] });
    }
  },

  // Messages
  fetchMessages: async (page = 1) => {
    set({ isLoading: true });
    try {
      const data = await api.get<PaginatedResponse<Message>>('/api/messages', { page: String(page) });
      set({
        messages: data.data,
        messagesTotal: data.total,
        isLoading: false,
      });
    } catch {
      set({ messages: [], messagesTotal: 0, isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await api.get<{ count: number }>('/api/messages/unread-count');
      set({ unreadCount: data.count });
    } catch {
      set({ unreadCount: 0 });
    }
  },

  readMessage: async (id) => {
    try {
      const data = await api.get<Message>(`/api/messages/${id}`);
      set((state) => ({
        messages: state.messages.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
        unreadCount: Math.max(0, state.unreadCount - (state.messages.find((m) => m.id === id && !m.isRead) ? 1 : 0)),
      }));
      return data;
    } catch {
      const msg = get().messages.find((m) => m.id === id) || null;
      if (msg) {
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
          unreadCount: Math.max(0, state.unreadCount - (!msg.isRead ? 1 : 0)),
        }));
      }
      return msg;
    }
  },

  deleteMessage: async (id) => {
    try {
      await api.delete(`/api/messages/${id}`);
    } catch {
      // Continue with local deletion
    }
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
      messagesTotal: Math.max(0, state.messagesTotal - 1),
    }));
  },

  // Inquiries
  fetchInquiries: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<Inquiry[]>('/api/inquiries');
      set({ inquiries: data, isLoading: false });
    } catch {
      set({ inquiries: [], isLoading: false });
    }
  },

  fetchInquiryDetail: async (id) => {
    try {
      const data = await api.get<Inquiry>(`/api/inquiries/${id}`);
      set({ selectedInquiry: data });
    } catch {
      const inquiry = get().inquiries.find((i) => i.id === id) || null;
      set({ selectedInquiry: inquiry });
    }
  },

  createInquiry: async (title, content) => {
    try {
      await api.post('/api/inquiries', { title, content });
      get().fetchInquiries();
    } catch {
      // Optimistic add for mock
      const newInquiry: Inquiry = {
        id: Date.now(),
        title,
        content,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ inquiries: [newInquiry, ...state.inquiries] }));
    }
  },
}));
