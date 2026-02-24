export interface AttendanceConfig {
  day: number;
  rewardType: 'point' | 'cash';
  amount: string;
  isBonus: boolean;
}

export interface AttendanceLog {
  date: string;
  dayNumber: number;
  rewardAmount: string;
  rewardType: string;
}

export interface Mission {
  id: number;
  name: string;
  description: string;
  type: 'daily' | 'weekly';
  rewardType: 'point' | 'cash';
  rewardAmount: string;
  targetValue: number;
  progress: number;
  status: 'active' | 'completed' | 'claimed';
}

export interface SpinResult {
  prizeName: string;
  amount: string;
  rewardType: 'point' | 'cash' | 'none';
}

export interface VipLevel {
  level: number;
  name: string;
  requiredBet: string;
  cashbackRate: string;
  benefits: string[];
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  bannerUrl?: string;
  category: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}
