import { createHash, randomBytes } from 'crypto';

export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

export const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
};

export interface JwtPayload {
  userId: number;
  username: string;
  type: 'access' | 'refresh';
}
