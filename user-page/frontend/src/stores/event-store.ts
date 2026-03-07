import { create } from 'zustand';
import { api } from '@/lib/api-client';
import type {
  AttendanceLog,
  AttendanceConfig,
  Mission,
  SpinResult,
  VipLevel,
  Promotion,
} from '../../../shared/types/promotion';

interface AttendanceStatus {
  consecutiveDays: number;
  checkedToday: boolean;
  monthLogs: AttendanceLog[];
  nextReward: { amount: string; rewardType: string };
}

interface SpinStatus {
  todayCount: number;
  maxCount: number;
  prizes: { name: string; amount: string; rewardType: string; color: string }[];
}

interface VipInfo {
  currentLevel: number;
  name: string;
  nextLevel: number;
  progress: number;
  benefits: string[];
}

interface PointHistory {
  items: {
    id: number;
    type: string;
    amount: string;
    balance: string;
    description: string;
    createdAt: string;
  }[];
  total: number;
  page: number;
}

interface EventState {
  // Attendance
  attendanceStatus: AttendanceStatus | null;
  attendanceConfigs: AttendanceConfig[];
  isCheckingIn: boolean;

  // Missions
  missions: Mission[];
  missionTab: 'daily' | 'weekly';
  claimingMissionId: number | null;

  // Spin
  spinStatus: SpinStatus | null;
  lastSpinResult: SpinResult | null;
  isSpinning: boolean;

  // Promotions
  promotions: Promotion[];
  promotionCategory: string;

  // VIP
  vipInfo: VipInfo | null;
  vipLevels: VipLevel[];

  // Points
  pointBalance: string;
  pointHistory: PointHistory | null;
  isConvertingPoints: boolean;

  // Loading
  isLoading: boolean;

  // Attendance actions
  fetchAttendanceStatus: () => Promise<void>;
  checkIn: () => Promise<{ dayNumber: number; reward: string }>;

  // Mission actions
  fetchMissions: () => Promise<void>;
  claimMission: (missionId: number) => Promise<void>;
  setMissionTab: (tab: 'daily' | 'weekly') => void;

  // Spin actions
  fetchSpinStatus: () => Promise<void>;
  executeSpin: () => Promise<SpinResult>;

  // Promotion actions
  fetchPromotions: () => Promise<void>;
  claimPromotion: (id: number) => Promise<void>;
  setPromotionCategory: (category: string) => void;

  // VIP actions
  fetchVipInfo: () => Promise<void>;
  fetchVipLevels: () => Promise<void>;

  // Point actions
  fetchPointHistory: (page?: number) => Promise<void>;
  convertPoints: (amount: number) => Promise<{ pointsUsed: number; cashReceived: number }>;
}

export const useEventStore = create<EventState>((set, get) => ({
  // Initial state
  attendanceStatus: null,
  attendanceConfigs: [],
  isCheckingIn: false,
  missions: [],
  missionTab: 'daily',
  claimingMissionId: null,
  spinStatus: null,
  lastSpinResult: null,
  isSpinning: false,
  promotions: [],
  promotionCategory: 'all',
  vipInfo: null,
  vipLevels: [],
  pointBalance: '0',
  pointHistory: null,
  isConvertingPoints: false,
  isLoading: false,

  // Attendance
  fetchAttendanceStatus: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<AttendanceStatus>('/api/attendance/status');
      set({ attendanceStatus: data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  checkIn: async () => {
    set({ isCheckingIn: true });
    try {
      const result = await api.post<{ checked: boolean; dayNumber: number; reward: string }>(
        '/api/attendance/check-in'
      );
      await get().fetchAttendanceStatus();
      set({ isCheckingIn: false });
      return { dayNumber: result.dayNumber, reward: result.reward };
    } catch (err) {
      set({ isCheckingIn: false });
      throw err;
    }
  },

  // Missions
  fetchMissions: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<Mission[]>('/api/missions');
      set({ missions: data, isLoading: false });
    } catch {
      set({ missions: [], isLoading: false });
    }
  },

  claimMission: async (missionId: number) => {
    set({ claimingMissionId: missionId });
    try {
      await api.post(`/api/missions/${missionId}/claim`);
      await get().fetchMissions();
      set({ claimingMissionId: null });
    } catch (err) {
      set({ claimingMissionId: null });
      throw err;
    }
  },

  setMissionTab: (tab) => {
    set({ missionTab: tab });
  },

  // Spin
  fetchSpinStatus: async () => {
    try {
      const data = await api.get<SpinStatus>('/api/spin/status');
      set({ spinStatus: data });
    } catch {
      // Ignore fetch errors
    }
  },

  executeSpin: async () => {
    set({ isSpinning: true });
    try {
      const result = await api.post<SpinResult>('/api/spin/execute');
      set({ lastSpinResult: result, isSpinning: false });
      await get().fetchSpinStatus();
      return result;
    } catch (err) {
      set({ isSpinning: false });
      throw err;
    }
  },

  // Promotions
  fetchPromotions: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<Promotion[]>('/api/promotions');
      set({ promotions: data, isLoading: false });
    } catch {
      set({ promotions: [], isLoading: false });
    }
  },

  claimPromotion: async (id: number) => {
    await api.post(`/api/promotions/${id}/claim`);
    await get().fetchPromotions();
  },

  setPromotionCategory: (category) => {
    set({ promotionCategory: category });
  },

  // VIP
  fetchVipInfo: async () => {
    try {
      const data = await api.get<VipInfo>('/api/vip/info');
      set({ vipInfo: data });
    } catch {
      // Ignore VIP fetch errors
    }
  },

  fetchVipLevels: async () => {
    try {
      const data = await api.get<VipLevel[]>('/api/vip/levels');
      set({ vipLevels: data });
    } catch {
      set({ vipLevels: [] });
    }
  },

  // Points
  fetchPointHistory: async (page = 1) => {
    try {
      const data = await api.get<PointHistory>('/api/points/history', {
        page: String(page),
      });
      set({ pointHistory: data, pointBalance: data.items?.[0]?.balance || get().pointBalance });
    } catch {
      // Ignore point history errors
    }
  },

  convertPoints: async (amount: number) => {
    set({ isConvertingPoints: true });
    try {
      const result = await api.post<{ converted: boolean; pointsUsed: number; cashReceived: number }>(
        '/api/points/convert',
        { amount }
      );
      await get().fetchPointHistory();
      set({ isConvertingPoints: false });
      return { pointsUsed: result.pointsUsed, cashReceived: result.cashReceived };
    } catch (err) {
      set({ isConvertingPoints: false });
      throw err;
    }
  },
}));
