export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type CommissionType = 'ROLLING' | 'LOSING';

export interface User {
  id: number;
  username: string;
  nickname: string;
  phone?: string;
  status: UserStatus;
  balance: string;
  points: string;
  bonusBalance: string;
  myReferralCode: string;
  vipLevel: number;
  commissionType: CommissionType;
  lastLoginAt?: string;
  createdAt: string;
}

export interface RegisterRequest {
  username: string;
  nickname: string;
  password: string;
  phone: string;
  referrerCode: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
