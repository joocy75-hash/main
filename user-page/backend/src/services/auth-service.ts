import { FastifyInstance } from 'fastify';
import bcryptjs from 'bcryptjs';
const { hash, compare } = bcryptjs;
import { GameCategory } from '@prisma/client';
import { randomBytes } from 'crypto';
import { config } from '../config.js';
import { hashToken, generateReferralCode, JwtPayload } from '../utils/jwt.js';
import { UAParser } from 'ua-parser-js';

const BCRYPT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const DEFAULT_ROLLING_RATES: { category: GameCategory; rate: number }[] = [
  { category: 'casino', rate: 1.5 },
  { category: 'slot', rate: 5 },
  { category: 'holdem', rate: 5 },
  { category: 'sports', rate: 5 },
  { category: 'shooting', rate: 5 },
  { category: 'coin', rate: 5 },
  { category: 'mini_game', rate: 3 },
];

interface RegisterInput {
  username: string;
  nickname: string;
  password: string;
  phone: string;
  referrerCode: string;
}

interface LoginInput {
  username: string;
  password: string;
  ip: string;
  userAgent: string;
}

export class AuthService {
  constructor(private readonly fastify: FastifyInstance) {}

  async register(input: RegisterInput) {
    const { prisma, redis } = this.fastify;

    // 1. Hash password (no DB dependency - safe outside transaction)
    const passwordHash = await hash(input.password, BCRYPT_ROUNDS);

    // 2. Generate unique referral code (no DB consistency requirement)
    const MAX_REFERRAL_CODE_ATTEMPTS = 10;
    let myReferralCode = generateReferralCode();
    let codeExists = await prisma.user.findUnique({
      where: { myReferralCode },
    });
    let attempts = 0;
    while (codeExists) {
      attempts++;
      if (attempts >= MAX_REFERRAL_CODE_ATTEMPTS) {
        throw { statusCode: 500, message: '추천코드 생성에 실패했습니다. 다시 시도해주세요' };
      }
      myReferralCode = generateReferralCode();
      codeExists = await prisma.user.findUnique({
        where: { myReferralCode },
      });
    }

    // 3. Create user with transaction (validation INSIDE for consistency)
    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        // Validate referrer code inside transaction
        const referrer = await tx.user.findFirst({
          where: { myReferralCode: input.referrerCode },
        });
        if (!referrer) {
          throw { statusCode: 400, message: '추천코드가 유효하지 않습니다' };
        }

        // Check username uniqueness inside transaction
        const existing = await tx.user.findUnique({
          where: { username: input.username },
        });
        if (existing) {
          throw { statusCode: 409, message: '이미 사용 중인 아이디입니다' };
        }

        const newUser = await tx.user.create({
          data: {
            username: input.username,
            nickname: input.nickname,
            passwordHash,
            phone: input.phone,
            referrerCode: input.referrerCode,
            myReferralCode,
            referrerId: referrer.id,
            status: 'ACTIVE',
          },
        });

        // 4. Create 7 GameRollingRate entries
        await tx.gameRollingRate.createMany({
          data: DEFAULT_ROLLING_RATES.map((r) => ({
            userId: newUser.id,
            category: r.category,
            rate: r.rate,
          })),
        });

        // 5. Welcome message
        await tx.message.create({
          data: {
            userId: newUser.id,
            type: 'system',
            title: '회원가입을 환영합니다!',
            content: `${newUser.nickname}님, 가입을 환영합니다. 즐거운 시간 보내세요!`,
          },
        });

        // 6. Referral notification to referrer
        await tx.message.create({
          data: {
            userId: referrer.id,
            type: 'referral',
            title: '새로운 추천 회원 가입',
            content: `새로운 추천 회원 ${newUser.nickname}(${newUser.username})님이 가입했습니다.`,
          },
        });

        return newUser;
      });
    } catch (err: any) {
      // Handle Prisma unique constraint violation (race condition fallback)
      if (err?.code === 'P2002') {
        throw { statusCode: 409, message: '이미 사용 중인 아이디입니다' };
      }
      throw err;
    }

    // 9. Generate tokens
    const tokens = await this.generateTokenPair(user.id, user.username);

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        status: user.status,
        balance: user.balance,
        points: user.points,
        myReferralCode: user.myReferralCode,
        vipLevel: user.vipLevel,
        createdAt: user.createdAt,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(input: LoginInput) {
    const { prisma, redis } = this.fastify;

    // Check lockout
    const lockoutKey = `lockout:${input.username}`;
    const lockoutUntil = await redis.get(lockoutKey);
    if (lockoutUntil) {
      const remaining = Math.ceil((parseInt(lockoutUntil, 10) - Date.now()) / 60000);
      throw {
        statusCode: 423,
        message: `계정이 잠금되었습니다. ${remaining}분 후 다시 시도해주세요`,
      };
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: input.username },
    });

    if (!user) {
      await this.incrementFailedAttempts(input.username);
      throw { statusCode: 401, message: '아이디 또는 비밀번호가 일치하지 않습니다' };
    }

    // Check status
    if (user.status === 'SUSPENDED') {
      throw { statusCode: 403, message: '정지된 계정입니다. 관리자에게 문의하세요' };
    }
    if (user.status === 'BANNED') {
      throw { statusCode: 403, message: '차단된 계정입니다' };
    }

    // Verify password
    const valid = await compare(input.password, user.passwordHash);
    if (!valid) {
      await this.incrementFailedAttempts(input.username);
      throw { statusCode: 401, message: '아이디 또는 비밀번호가 일치하지 않습니다' };
    }

    // Clear failed attempts
    await redis.del(`fail:${input.username}`);

    // Parse user agent
    const parser = new UAParser(input.userAgent);
    const result = parser.getResult();

    // Record login history
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ip: input.ip,
        userAgent: input.userAgent,
        device: result.device.type || 'desktop',
        os: result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : null,
        browser: result.browser.name ? `${result.browser.name} ${result.browser.version || ''}`.trim() : null,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: input.ip,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(user.id, user.username);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        status: user.status,
        balance: user.balance,
        points: user.points,
        bonusBalance: user.bonusBalance,
        myReferralCode: user.myReferralCode,
        vipLevel: user.vipLevel,
        lastLoginAt: user.lastLoginAt,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const { prisma, redis } = this.fastify;

    // Verify the refresh token JWT
    let payload: JwtPayload;
    try {
      payload = this.fastify.jwt.verify<JwtPayload>(refreshToken);
    } catch {
      throw { statusCode: 401, message: '유효하지 않은 리프레시 토큰입니다' };
    }

    if (payload.type !== 'refresh') {
      throw { statusCode: 401, message: '유효하지 않은 리프레시 토큰입니다' };
    }

    // Check blacklist
    const tokenHash = hashToken(refreshToken);
    const isBlacklisted = await redis.get(`bl:${tokenHash}`);
    if (isBlacklisted) {
      throw { statusCode: 401, message: '만료된 리프레시 토큰입니다' };
    }

    // Check if token exists in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });
    if (!storedToken) {
      throw { statusCode: 401, message: '유효하지 않은 리프레시 토큰입니다' };
    }

    // Check user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw { statusCode: 401, message: '유효하지 않은 사용자입니다' };
    }

    // Blacklist old refresh token (Refresh Token Rotation)
    await redis.set(`bl:${tokenHash}`, '1', 'EX', 7 * 24 * 60 * 60);

    // Delete old refresh token from DB
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new token pair
    const tokens = await this.generateTokenPair(user.id, user.username);

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashToken(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(accessToken: string, refreshToken: string) {
    const { prisma, redis } = this.fastify;

    // Blacklist access token
    if (accessToken) {
      const accessHash = hashToken(accessToken);
      await redis.set(`bl:${accessHash}`, '1', 'EX', 15 * 60);
    }

    // Blacklist refresh token
    if (refreshToken) {
      const refreshHash = hashToken(refreshToken);
      await redis.set(`bl:${refreshHash}`, '1', 'EX', 7 * 24 * 60 * 60);

      // Delete refresh token from DB
      await prisma.refreshToken.deleteMany({
        where: { token: refreshHash },
      });
    }
  }

  private async generateTokenPair(userId: number, username: string) {
    const jti = randomBytes(16).toString('hex');
    const accessToken = this.fastify.jwt.sign(
      { userId, username, type: 'access', jti: `a_${jti}` } as JwtPayload & { jti: string },
      { expiresIn: config.jwt.accessExpiresIn },
    );

    const refreshToken = this.fastify.jwt.sign(
      { userId, username, type: 'refresh', jti: `r_${jti}` } as JwtPayload & { jti: string },
      { expiresIn: config.jwt.refreshExpiresIn },
    );

    return { accessToken, refreshToken };
  }

  private async incrementFailedAttempts(username: string) {
    const { redis } = this.fastify;
    const failKey = `fail:${username}`;

    const attempts = await redis.incr(failKey);
    await redis.expire(failKey, LOCKOUT_MINUTES * 60);

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutKey = `lockout:${username}`;
      const lockoutUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      await redis.set(lockoutKey, String(lockoutUntil), 'EX', LOCKOUT_MINUTES * 60);
      await redis.del(failKey);
    }
  }
}
