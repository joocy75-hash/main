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

// Mock data
const MOCK_PROFILE: Profile = {
  id: 1,
  username: 'testuser',
  nickname: '테스트유저',
  phone: '01012345678',
  status: 'active',
  balance: '999949',
  points: '50900',
  bonusBalance: '0',
  vipLevel: 1,
  myReferralCode: 'TESTCODE',
  createdAt: '2026-02-24T00:00:00Z',
  lastLoginAt: '2026-02-24T14:30:00Z',
};

const MOCK_BETS: BetRecord[] = [
  { id: 1, gameCategory: 'slot', gameName: 'Sweet Bonanza', betAmount: '50000', winAmount: '120000', result: 'win', createdAt: '2026-02-24T14:00:00Z' },
  { id: 2, gameCategory: 'casino', gameName: 'Baccarat Live', betAmount: '100000', winAmount: '0', result: 'lose', createdAt: '2026-02-24T13:30:00Z' },
  { id: 3, gameCategory: 'sports', gameName: '맨유 vs 리버풀', betAmount: '30000', winAmount: '0', result: 'pending', createdAt: '2026-02-24T13:00:00Z' },
  { id: 4, gameCategory: 'holdem', gameName: 'Texas Holdem', betAmount: '200000', winAmount: '380000', result: 'win', createdAt: '2026-02-23T22:00:00Z' },
  { id: 5, gameCategory: 'mini_game', gameName: 'Aviator', betAmount: '10000', winAmount: '25000', result: 'win', createdAt: '2026-02-23T21:00:00Z' },
];

const MOCK_MONEY_LOGS: MoneyLog[] = [
  { id: 1, type: 'deposit', amount: '500000', balanceAfter: '999949', description: '입금 승인', createdAt: '2026-02-24T10:00:00Z' },
  { id: 2, type: 'bet', amount: '-50000', balanceAfter: '499949', description: 'Sweet Bonanza 베팅', createdAt: '2026-02-24T14:00:00Z' },
  { id: 3, type: 'win', amount: '120000', balanceAfter: '619949', description: 'Sweet Bonanza 당첨', createdAt: '2026-02-24T14:00:00Z' },
  { id: 4, type: 'withdrawal', amount: '-200000', balanceAfter: '419949', description: '출금 신청', createdAt: '2026-02-23T18:00:00Z' },
  { id: 5, type: 'bonus', amount: '50000', balanceAfter: '469949', description: '첫 입금 보너스', createdAt: '2026-02-23T10:00:00Z' },
];

const MOCK_LOGIN_HISTORY: LoginHistory[] = [
  { id: 1, ip: '123.456.78.90', device: 'Desktop', os: 'macOS', browser: 'Chrome 120', createdAt: '2026-02-24T14:30:00Z' },
  { id: 2, ip: '123.456.78.90', device: 'Mobile', os: 'iOS 18', browser: 'Safari', createdAt: '2026-02-24T09:15:00Z' },
  { id: 3, ip: '111.222.33.44', device: 'Desktop', os: 'Windows 11', browser: 'Edge', createdAt: '2026-02-23T22:00:00Z' },
  { id: 4, ip: '123.456.78.90', device: 'Desktop', os: 'macOS', browser: 'Chrome 120', createdAt: '2026-02-23T10:30:00Z' },
];

const MOCK_AFFILIATE: AffiliateDashboard = {
  totalReferrals: 12,
  thisMonthCommission: '5000',
  totalCommission: '50000',
  rollingRates: [
    { category: '카지노', rate: '1.5' },
    { category: '슬롯', rate: '5.0' },
    { category: '홀덤', rate: '5.0' },
    { category: '스포츠', rate: '5.0' },
    { category: '슈팅', rate: '5.0' },
    { category: '코인', rate: '5.0' },
    { category: '미니게임', rate: '3.0' },
  ],
};

const MOCK_MEMBERS: AffiliateMember[] = [
  { id: 1, username: 'user001', nickname: '유저1', joinedAt: '2026-02-20T00:00:00Z', totalBet: '1000000', commission: '15000' },
  { id: 2, username: 'user002', nickname: '유저2', joinedAt: '2026-02-21T00:00:00Z', totalBet: '500000', commission: '7500' },
  { id: 3, username: 'user003', nickname: '유저3', joinedAt: '2026-02-22T00:00:00Z', totalBet: '300000', commission: '4500' },
];

const MOCK_COMMISSIONS: CommissionRecord[] = [
  { id: 1, type: 'rolling', gameCategory: '슬롯', amount: '2500', fromUser: 'user001', createdAt: '2026-02-24T12:00:00Z' },
  { id: 2, type: 'rolling', gameCategory: '카지노', amount: '1500', fromUser: 'user002', createdAt: '2026-02-24T11:00:00Z' },
  { id: 3, type: 'rolling', gameCategory: '슬롯', amount: '1000', fromUser: 'user001', createdAt: '2026-02-23T15:00:00Z' },
];

const MOCK_MESSAGES: Message[] = [
  { id: 1, title: '입금 승인 알림', content: '500,000원 입금이 승인되었습니다.', isRead: false, createdAt: '2026-02-24T14:30:00Z' },
  { id: 2, title: '출석체크 보상 지급', content: '출석체크 보상 1,000P가 지급되었습니다.', isRead: false, createdAt: '2026-02-24T13:00:00Z' },
  { id: 3, title: '스핀 보상 지급', content: '럭키스핀 보상 5,000P가 지급되었습니다.', isRead: true, createdAt: '2026-02-23T20:00:00Z' },
  { id: 4, title: '환영합니다!', content: 'Game Platform에 가입하신 것을 환영합니다. 다양한 게임과 이벤트를 즐겨보세요!', isRead: true, createdAt: '2026-02-22T12:00:00Z' },
];

const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: 1,
    title: '입금 지연 문의',
    content: '입금한지 30분이 지났는데 아직 반영이 안 됩니다.',
    status: 'answered',
    createdAt: '2026-02-24T10:00:00Z',
    replies: [
      { id: 1, content: '입금한지 30분이 지났는데 아직 반영이 안 됩니다.', isAdmin: false, createdAt: '2026-02-24T10:00:00Z' },
      { id: 2, content: '안녕하세요. 확인 결과 네트워크 지연으로 인해 입금이 늦어지고 있습니다. 현재 처리 완료되었으니 확인 부탁드립니다.', isAdmin: true, createdAt: '2026-02-24T10:30:00Z' },
    ],
  },
  {
    id: 2,
    title: '게임 오류 신고',
    content: 'Sweet Bonanza 게임 중 화면이 멈추는 현상이 발생합니다.',
    status: 'pending',
    createdAt: '2026-02-23T18:00:00Z',
  },
];

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
      set({ profile: MOCK_PROFILE, isLoading: false });
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
      set({ bets: MOCK_BETS, betsTotal: MOCK_BETS.length, isLoading: false });
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
      set({ moneyLogs: MOCK_MONEY_LOGS, moneyLogsTotal: MOCK_MONEY_LOGS.length, isLoading: false });
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
      set({ loginHistory: MOCK_LOGIN_HISTORY, isLoading: false });
    }
  },

  // Affiliate
  fetchAffiliateDashboard: async () => {
    try {
      const data = await api.get<AffiliateDashboard>('/api/affiliate/dashboard');
      set({ affiliateDashboard: data });
    } catch {
      set({ affiliateDashboard: MOCK_AFFILIATE });
    }
  },

  fetchAffiliateMembers: async (page = 1) => {
    try {
      const data = await api.get<PaginatedResponse<AffiliateMember>>('/api/affiliate/members', { page: String(page) });
      set({ affiliateMembers: data.data });
    } catch {
      set({ affiliateMembers: MOCK_MEMBERS });
    }
  },

  fetchCommissionRecords: async (page = 1) => {
    try {
      const data = await api.get<PaginatedResponse<CommissionRecord>>('/api/affiliate/commissions', { page: String(page) });
      set({ commissionRecords: data.data });
    } catch {
      set({ commissionRecords: MOCK_COMMISSIONS });
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
      set({ messages: MOCK_MESSAGES, messagesTotal: MOCK_MESSAGES.length, isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const data = await api.get<{ count: number }>('/api/messages/unread-count');
      set({ unreadCount: data.count });
    } catch {
      const { messages } = get();
      const mockCount = messages.length > 0
        ? messages.filter((m) => !m.isRead).length
        : MOCK_MESSAGES.filter((m) => !m.isRead).length;
      set({ unreadCount: mockCount });
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
      // Fallback: use local data
      const msg = get().messages.find((m) => m.id === id) || MOCK_MESSAGES.find((m) => m.id === id) || null;
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
      set({ inquiries: MOCK_INQUIRIES, isLoading: false });
    }
  },

  fetchInquiryDetail: async (id) => {
    try {
      const data = await api.get<Inquiry>(`/api/inquiries/${id}`);
      set({ selectedInquiry: data });
    } catch {
      const inquiry = get().inquiries.find((i) => i.id === id) || MOCK_INQUIRIES.find((i) => i.id === id) || null;
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
