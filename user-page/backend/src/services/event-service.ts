import { PrismaClient, Prisma, RewardType, MissionStatus, PointLogType } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { Redis } from 'ioredis';

// ===== Types =====

interface AttendanceResult {
  dayNumber: number;
  rewardType: RewardType;
  rewardAmount: string;
  isBonus: boolean;
  consecutiveDays: number;
}

interface AttendanceStatus {
  checkIns: { date: string; dayNumber: number; rewardAmount: string; rewardType: RewardType }[];
  consecutiveDays: number;
  checkedToday: boolean;
  nextReward: { day: number; rewardType: RewardType; amount: string; isBonus: boolean } | null;
}

interface MissionWithProgress {
  id: number;
  name: string;
  description: string;
  type: string;
  rewardType: RewardType;
  rewardAmount: string;
  targetValue: number;
  progress: number;
  status: MissionStatus;
  completedAt: Date | null;
  claimedAt: Date | null;
}

interface ClaimResult {
  rewardType: RewardType;
  rewardAmount: string;
  message: string;
}

interface SpinResult {
  prizeName: string;
  rewardType: RewardType;
  amount: string;
  remainingSpins: number;
}

interface SpinStatus {
  todayCount: number;
  maxCount: number;
  prizes: { prizeName: string; rewardType: RewardType; amount: string }[];
}

interface VipInfo {
  currentLevel: number;
  name: string;
  nameKo: string;
  cashbackRate: string;
  benefits: string | null;
  nextLevel: { level: number; name: string; nameKo: string; requiredBet: string } | null;
  totalBet: string;
  progressPercent: number;
}

interface ConversionResult {
  pointsUsed: string;
  cashReceived: string;
  pointsAfter: string;
  balanceAfter: string;
}

interface PaginatedResult<T = any> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== Constants =====

const MAX_DAILY_SPINS = 3;
const POINTS_TO_CASH_RATIO = 100; // 100 points = 1 cash
const MIN_CONVERT_POINTS = 100;
const SPIN_REDIS_PREFIX = 'spin:daily';

// ===== Helper =====

const getToday = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

const getWeekStart = (): Date => {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  const monday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - diff));
  return monday;
};

const formatDateKey = (d: Date): string => {
  return d.toISOString().split('T')[0];
};

export class EventService {
  // ===== REWARD GRANTING HELPER =====

  private async grantReward(
    tx: Prisma.TransactionClient,
    userId: number,
    rewardType: RewardType,
    amount: Prisma.Decimal,
    source: PointLogType,
    description: string,
  ) {
    // Lock user row to prevent concurrent balance corruption
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;

    if (rewardType === 'point') {
      const user = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: amount } },
        select: { points: true },
      });

      await tx.pointLog.create({
        data: {
          userId,
          type: source,
          amount,
          pointsAfter: user.points,
          description,
          referenceId: `${source}_${userId}_${randomUUID()}`,
        },
      });
    } else if (rewardType === 'cash') {
      const user = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
        select: { balance: true },
      });

      await tx.moneyLog.create({
        data: {
          userId,
          type: 'bonus',
          amount,
          balanceAfter: user.balance,
          description,
          referenceId: `${source}_${userId}_${randomUUID()}`,
        },
      });
    } else if (rewardType === 'bonus') {
      const user = await tx.user.update({
        where: { id: userId },
        data: { bonusBalance: { increment: amount } },
        select: { bonusBalance: true },
      });

      await tx.moneyLog.create({
        data: {
          userId,
          type: 'bonus',
          amount,
          balanceAfter: user.bonusBalance,
          description,
          referenceId: `${source}_${userId}_${randomUUID()}`,
        },
      });
    }
  }

  // ===== ATTENDANCE =====

  async checkIn(prisma: PrismaClient, redis: Redis, userId: number): Promise<AttendanceResult> {
    const today = getToday();

    return await prisma.$transaction(async (tx) => {
      // Check duplicate today
      const existing = await tx.attendanceLog.findUnique({
        where: { userId_checkInDate: { userId, checkInDate: today } },
      });
      if (existing) {
        throw { statusCode: 400, message: '오늘 이미 출석체크를 완료했습니다' };
      }

      // Calculate consecutive day number
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      const lastLog = await tx.attendanceLog.findFirst({
        where: { userId },
        orderBy: { checkInDate: 'desc' },
      });

      let dayNumber = 1;
      if (lastLog) {
        const lastDate = new Date(lastLog.checkInDate);
        const lastDateStr = formatDateKey(lastDate);
        const yesterdayStr = formatDateKey(yesterday);
        const todayStr = formatDateKey(today);

        if (lastDateStr === todayStr) {
          throw { statusCode: 400, message: '오늘 이미 출석체크를 완료했습니다' };
        } else if (lastDateStr === yesterdayStr) {
          dayNumber = lastLog.dayNumber + 1;
          if (dayNumber > 30) dayNumber = 1;
        }
        // else streak broken, dayNumber = 1
      }

      // Look up reward config for this day
      const config = await tx.attendanceConfig.findUnique({
        where: { day: dayNumber },
      });

      if (!config) {
        throw { statusCode: 500, message: '출석 보상 설정을 찾을 수 없습니다' };
      }

      // Create attendance log
      await tx.attendanceLog.create({
        data: {
          userId,
          checkInDate: today,
          dayNumber,
          rewardAmount: config.amount,
          rewardType: config.rewardType,
        },
      });

      // Grant reward
      await this.grantReward(
        tx,
        userId,
        config.rewardType,
        config.amount,
        'attendance',
        `출석체크 ${dayNumber}일차 보상`,
      );

      return {
        dayNumber,
        rewardType: config.rewardType,
        rewardAmount: config.amount.toString(),
        isBonus: config.isBonus,
        consecutiveDays: dayNumber,
      };
    });
  }

  async getAttendanceStatus(prisma: PrismaClient, userId: number): Promise<AttendanceStatus> {
    const today = getToday();
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));

    // This month's check-ins
    const checkIns = await prisma.attendanceLog.findMany({
      where: {
        userId,
        checkInDate: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { checkInDate: 'asc' },
    });

    // Calculate consecutive days
    const lastLog = await prisma.attendanceLog.findFirst({
      where: { userId },
      orderBy: { checkInDate: 'desc' },
    });

    let consecutiveDays = 0;
    let checkedToday = false;

    if (lastLog) {
      const lastDate = formatDateKey(new Date(lastLog.checkInDate));
      const todayStr = formatDateKey(today);
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = formatDateKey(yesterday);

      if (lastDate === todayStr) {
        checkedToday = true;
        consecutiveDays = lastLog.dayNumber;
      } else if (lastDate === yesterdayStr) {
        consecutiveDays = lastLog.dayNumber;
      }
    }

    // Next reward
    const nextDay = checkedToday ? consecutiveDays + 1 : (consecutiveDays > 0 ? consecutiveDays + 1 : 1);
    const nextDayWrapped = nextDay > 30 ? 1 : nextDay;
    const nextConfig = await prisma.attendanceConfig.findUnique({
      where: { day: nextDayWrapped },
    });

    return {
      checkIns: checkIns.map((c) => ({
        date: formatDateKey(new Date(c.checkInDate)),
        dayNumber: c.dayNumber,
        rewardAmount: c.rewardAmount.toString(),
        rewardType: c.rewardType,
      })),
      consecutiveDays,
      checkedToday,
      nextReward: nextConfig
        ? {
            day: nextConfig.day,
            rewardType: nextConfig.rewardType,
            amount: nextConfig.amount.toString(),
            isBonus: nextConfig.isBonus,
          }
        : null,
    };
  }

  // ===== MISSIONS =====

  async getMissions(prisma: PrismaClient, userId: number): Promise<MissionWithProgress[]> {
    const today = getToday();
    const weekStart = getWeekStart();

    const missions = await prisma.missionConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (missions.length === 0) return [];

    const missionIds = missions.map(m => m.id);

    // Batch fetch all existing progress records
    const existingProgress = await prisma.missionProgress.findMany({
      where: {
        userId,
        missionId: { in: missionIds },
        resetDate: { in: [today, weekStart] },
      },
    });

    // Index by missionId+resetDate for O(1) lookup
    const progressMap = new Map<string, typeof existingProgress[0]>();
    for (const p of existingProgress) {
      progressMap.set(`${p.missionId}_${p.resetDate.toISOString()}`, p);
    }

    // Collect missing progress entries for batch creation
    const missingEntries: { userId: number; missionId: number; progress: number; status: MissionStatus; resetDate: Date }[] = [];
    for (const mission of missions) {
      const resetDate = mission.type === 'daily' ? today : weekStart;
      const key = `${mission.id}_${resetDate.toISOString()}`;
      if (!progressMap.has(key)) {
        missingEntries.push({ userId, missionId: mission.id, progress: 0, status: 'active', resetDate });
      }
    }

    if (missingEntries.length > 0) {
      await prisma.missionProgress.createMany({ data: missingEntries, skipDuplicates: true });

      // Re-fetch only newly created records
      const newProgress = await prisma.missionProgress.findMany({
        where: {
          userId,
          missionId: { in: missingEntries.map(e => e.missionId) },
          resetDate: { in: [today, weekStart] },
        },
      });
      for (const p of newProgress) {
        progressMap.set(`${p.missionId}_${p.resetDate.toISOString()}`, p);
      }
    }

    return missions.map(mission => {
      const resetDate = mission.type === 'daily' ? today : weekStart;
      const progress = progressMap.get(`${mission.id}_${resetDate.toISOString()}`);
      return {
        id: mission.id,
        name: mission.name,
        description: mission.description,
        type: mission.type,
        rewardType: mission.rewardType,
        rewardAmount: mission.rewardAmount.toString(),
        targetValue: mission.targetValue,
        progress: progress?.progress ?? 0,
        status: progress?.status ?? 'active',
        completedAt: progress?.completedAt ?? null,
        claimedAt: progress?.claimedAt ?? null,
      };
    });
  }

  async claimMission(prisma: PrismaClient, userId: number, missionId: number): Promise<ClaimResult> {
    const today = getToday();
    const weekStart = getWeekStart();

    return await prisma.$transaction(async (tx) => {
      // Find mission config
      const mission = await tx.missionConfig.findUnique({
        where: { id: missionId },
      });
      if (!mission) {
        throw { statusCode: 404, message: '미션을 찾을 수 없습니다' };
      }

      const resetDate = mission.type === 'daily' ? today : weekStart;

      // Find progress
      const progress = await tx.missionProgress.findUnique({
        where: {
          userId_missionId_resetDate: { userId, missionId, resetDate },
        },
      });

      if (!progress) {
        throw { statusCode: 400, message: '미션 진행 기록이 없습니다' };
      }

      if (progress.status === 'active') {
        throw { statusCode: 400, message: '미션이 아직 완료되지 않았습니다' };
      }

      if (progress.status === 'claimed') {
        throw { statusCode: 400, message: '이미 보상을 수령했습니다' };
      }

      // Atomic CAS: only update if status is still 'completed' (prevents double-claim race condition)
      const updated = await tx.missionProgress.updateMany({
        where: { id: progress.id, status: 'completed' },
        data: {
          status: 'claimed',
          claimedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw { statusCode: 400, message: '이미 보상을 수령했습니다' };
      }

      // Grant reward
      await this.grantReward(
        tx,
        userId,
        mission.rewardType,
        mission.rewardAmount,
        'mission',
        `미션 완료 보상: ${mission.name}`,
      );

      return {
        rewardType: mission.rewardType,
        rewardAmount: mission.rewardAmount.toString(),
        message: `${mission.name} 보상이 지급되었습니다`,
      };
    });
  }

  // ===== SPIN =====

  private selectPrize(configs: { id: number; prizeName: string; rewardType: RewardType; amount: Prisma.Decimal; weight: number; sortOrder: number }[]) {
    const totalWeight = configs.reduce((sum, c) => sum + c.weight, 0);
    let random = Math.random() * totalWeight;
    for (const config of configs) {
      random -= config.weight;
      if (random <= 0) return config;
    }
    return configs[configs.length - 1];
  }

  async executeSpin(prisma: PrismaClient, redis: Redis, userId: number): Promise<SpinResult> {
    const today = getToday();
    const dateKey = formatDateKey(today);
    const redisKey = `${SPIN_REDIS_PREFIX}:${userId}:${dateKey}`;

    // Atomic increment first to prevent race condition
    const newCount = await redis.incr(redisKey);
    if (newCount === 1) await redis.expire(redisKey, 86400);
    if (newCount > MAX_DAILY_SPINS) {
      await redis.decr(redisKey);
      throw { statusCode: 400, message: `일일 스핀 횟수(${MAX_DAILY_SPINS}회)를 모두 사용했습니다` };
    }

    // Get spin configs
    const configs = await prisma.spinConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    if (configs.length === 0) {
      await redis.decr(redisKey);
      throw { statusCode: 500, message: '스핀 설정을 찾을 수 없습니다' };
    }

    // Select prize
    const prize = this.selectPrize(configs);

    try {
      // Execute in transaction with DB-level count revalidation
      await prisma.$transaction(async (tx) => {
        // DB-level revalidation: count today's spins inside transaction
        const dbCount = await tx.spinLog.count({
          where: { userId, spinDate: today },
        });
        if (dbCount >= MAX_DAILY_SPINS) {
          throw { statusCode: 400, message: `일일 스핀 횟수(${MAX_DAILY_SPINS}회)를 모두 사용했습니다` };
        }

        // Create spin log
        await tx.spinLog.create({
          data: {
            userId,
            spinDate: today,
            prizeName: prize.prizeName,
            amount: prize.amount,
            rewardType: prize.rewardType,
          },
        });

        // Grant reward (skip if amount is 0 - "miss" prize)
        const amountNum = parseFloat(prize.amount.toString());
        if (amountNum > 0) {
          await this.grantReward(
            tx,
            userId,
            prize.rewardType,
            prize.amount,
            'spin',
            `럭키스핀 보상: ${prize.prizeName}`,
          );
        }
      });
    } catch (err) {
      // Rollback Redis counter if DB transaction failed
      await redis.decr(redisKey);
      throw err;
    }

    return {
      prizeName: prize.prizeName,
      rewardType: prize.rewardType,
      amount: prize.amount.toString(),
      remainingSpins: MAX_DAILY_SPINS - newCount,
    };
  }

  async getSpinStatus(prisma: PrismaClient, redis: Redis, userId: number): Promise<SpinStatus> {
    const today = getToday();
    const dateKey = formatDateKey(today);
    const redisKey = `${SPIN_REDIS_PREFIX}:${userId}:${dateKey}`;

    const countStr = await redis.get(redisKey);
    const todayCount = countStr ? parseInt(countStr, 10) : 0;

    const prizes = await prisma.spinConfig.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { prizeName: true, rewardType: true, amount: true },
    });

    return {
      todayCount,
      maxCount: MAX_DAILY_SPINS,
      prizes: prizes.map((p) => ({
        prizeName: p.prizeName,
        rewardType: p.rewardType,
        amount: p.amount.toString(),
      })),
    };
  }

  // ===== PROMOTIONS =====

  async getPromotions(prisma: PrismaClient, category?: string) {
    const now = new Date();
    const where: any = {
      isActive: true,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    };

    if (category) {
      where.category = category;
    }

    const promotions = await prisma.promotionConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return promotions.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      bannerUrl: p.bannerUrl,
      category: p.category,
      bonusRate: p.bonusRate?.toString() ?? null,
      maxBonus: p.maxBonus?.toString() ?? null,
      minDeposit: p.minDeposit?.toString() ?? null,
      wagering: p.wagering,
      startDate: p.startDate,
      endDate: p.endDate,
    }));
  }

  async claimPromotion(prisma: PrismaClient, userId: number, promotionId: number): Promise<ClaimResult> {
    return await prisma.$transaction(async (tx) => {
      // Find promotion
      const promo = await tx.promotionConfig.findUnique({
        where: { id: promotionId },
      });

      if (!promo || !promo.isActive) {
        throw { statusCode: 404, message: '프로모션을 찾을 수 없습니다' };
      }

      const now = new Date();
      if (promo.startDate > now) {
        throw { statusCode: 400, message: '프로모션이 아직 시작되지 않았습니다' };
      }
      if (promo.endDate && promo.endDate < now) {
        throw { statusCode: 400, message: '프로모션이 종료되었습니다' };
      }

      // Check if already claimed
      const existingClaim = await tx.userPromotion.findFirst({
        where: { userId, promotionId },
      });
      if (existingClaim) {
        throw { statusCode: 400, message: '이미 참여한 프로모션입니다' };
      }

      // Calculate bonus based on recent deposit
      let bonusAmount = new Prisma.Decimal(0);
      let usedDepositId: number | null = null;
      if (promo.bonusRate && promo.maxBonus) {
        const recentDeposit = await tx.deposit.findFirst({
          where: { userId, status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true },
        });

        // Validate minimum deposit requirement
        if (promo.minDeposit) {
          if (!recentDeposit || recentDeposit.amount.lt(promo.minDeposit)) {
            throw {
              statusCode: 400,
              message: `최소 입금액 ${promo.minDeposit} USDT 이상이 필요합니다`,
            };
          }
        }

        if (recentDeposit) {
          // Prevent using same deposit for multiple promotions
          const alreadyUsed = await tx.userPromotion.findFirst({
            where: { userId, depositId: recentDeposit.id },
          });
          if (alreadyUsed) {
            throw {
              statusCode: 400,
              message: '이 입금건은 이미 다른 프로모션에 사용되었습니다',
            };
          }

          usedDepositId = recentDeposit.id;
          const calculated = recentDeposit.amount.mul(promo.bonusRate).div(100);
          bonusAmount = calculated.gt(promo.maxBonus) ? promo.maxBonus : calculated;
        }
      }

      // Create UserPromotion with deposit link
      await tx.userPromotion.create({
        data: {
          userId,
          promotionId,
          depositId: usedDepositId,
          bonusAmount,
          status: 'active',
        },
      });

      // Grant bonus if amount > 0
      const amountNum = parseFloat(bonusAmount.toString());
      if (amountNum > 0) {
        await this.grantReward(
          tx,
          userId,
          'bonus',
          bonusAmount,
          'event',
          `프로모션 보너스: ${promo.title}`,
        );
      }

      return {
        rewardType: 'bonus' as RewardType,
        rewardAmount: bonusAmount.toString(),
        message: `프로모션 "${promo.title}"에 참여했습니다`,
      };
    });
  }

  // ===== VIP =====

  async getVipInfo(prisma: PrismaClient, userId: number): Promise<VipInfo> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vipLevel: true },
    });

    if (!user) {
      throw { statusCode: 404, message: '사용자를 찾을 수 없습니다' };
    }

    const currentVip = await prisma.vipLevel.findUnique({
      where: { level: user.vipLevel },
    });

    if (!currentVip) {
      throw { statusCode: 500, message: 'VIP 레벨 설정을 찾을 수 없습니다' };
    }

    // Get next level
    const nextVip = await prisma.vipLevel.findFirst({
      where: { level: user.vipLevel + 1 },
    });

    // Calculate total bet from bet_records
    const betAggregate = await prisma.betRecord.aggregate({
      where: { userId },
      _sum: { betAmount: true },
    });
    const totalBet = betAggregate._sum.betAmount ?? new Prisma.Decimal(0);

    // Calculate progress
    let progressPercent = 100;
    if (nextVip) {
      const currentReq = parseFloat(currentVip.requiredBet.toString());
      const nextReq = parseFloat(nextVip.requiredBet.toString());
      const bet = parseFloat(totalBet.toString());
      const range = nextReq - currentReq;
      if (range > 0) {
        progressPercent = Math.min(100, Math.round(((bet - currentReq) / range) * 100));
        if (progressPercent < 0) progressPercent = 0;
      }
    }

    return {
      currentLevel: currentVip.level,
      name: currentVip.name,
      nameKo: currentVip.nameKo,
      cashbackRate: currentVip.cashbackRate.toString(),
      benefits: currentVip.benefits,
      nextLevel: nextVip
        ? {
            level: nextVip.level,
            name: nextVip.name,
            nameKo: nextVip.nameKo,
            requiredBet: nextVip.requiredBet.toString(),
          }
        : null,
      totalBet: totalBet.toString(),
      progressPercent,
    };
  }

  async getVipLevels(prisma: PrismaClient) {
    const levels = await prisma.vipLevel.findMany({
      orderBy: { level: 'asc' },
    });

    return levels.map((l) => ({
      id: l.id,
      level: l.level,
      name: l.name,
      nameKo: l.nameKo,
      requiredBet: l.requiredBet.toString(),
      cashbackRate: l.cashbackRate.toString(),
      benefits: l.benefits,
    }));
  }

  // ===== POINT CONVERSION =====

  async convertPoints(prisma: PrismaClient, userId: number, pointAmount: number): Promise<ConversionResult> {
    if (pointAmount < MIN_CONVERT_POINTS) {
      throw { statusCode: 400, message: `최소 ${MIN_CONVERT_POINTS} 포인트 이상부터 전환 가능합니다` };
    }

    if (pointAmount % POINTS_TO_CASH_RATIO !== 0) {
      throw { statusCode: 400, message: `포인트는 ${POINTS_TO_CASH_RATIO} 단위로 전환 가능합니다` };
    }

    const cashAmount = new Prisma.Decimal(pointAmount / POINTS_TO_CASH_RATIO);
    const pointDecimal = new Prisma.Decimal(pointAmount);

    return await prisma.$transaction(async (tx) => {
      // Lock user row
      const users = await tx.$queryRaw<Array<{ id: number; points: Prisma.Decimal; balance: Prisma.Decimal }>>`
        SELECT id, points, balance FROM users WHERE id = ${userId} FOR UPDATE
      `;

      if (!users || users.length === 0) {
        throw { statusCode: 404, message: '사용자를 찾을 수 없습니다' };
      }

      const currentPoints = parseFloat(users[0].points.toString());
      if (currentPoints < pointAmount) {
        throw { statusCode: 400, message: '포인트가 부족합니다' };
      }

      // Decrement points
      const userAfterPoints = await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: pointDecimal } },
        select: { points: true },
      });

      // Increment balance
      const userAfterBalance = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: cashAmount } },
        select: { balance: true },
      });

      // Create PointLog (deduction)
      const conversionRef = `conversion_${userId}_${randomUUID()}`;
      await tx.pointLog.create({
        data: {
          userId,
          type: 'conversion',
          amount: new Prisma.Decimal(-pointAmount),
          pointsAfter: userAfterPoints.points,
          description: `포인트 전환: ${pointAmount}P → ${cashAmount}원`,
          referenceId: conversionRef,
        },
      });

      // Create MoneyLog (addition)
      await tx.moneyLog.create({
        data: {
          userId,
          type: 'point_conversion',
          amount: cashAmount,
          balanceAfter: userAfterBalance.balance,
          description: `포인트 전환: ${pointAmount}P → ${cashAmount}원`,
          referenceId: conversionRef,
        },
      });

      return {
        pointsUsed: pointDecimal.toString(),
        cashReceived: cashAmount.toString(),
        pointsAfter: userAfterPoints.points.toString(),
        balanceAfter: userAfterBalance.balance.toString(),
      };
    });
  }

  async getPointHistory(
    prisma: PrismaClient,
    userId: number,
    page: number,
    limit: number,
  ): Promise<PaginatedResult> {
    const [items, total] = await Promise.all([
      prisma.pointLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pointLog.count({ where: { userId } }),
    ]);

    return {
      items: items.map((i) => ({
        id: i.id,
        type: i.type,
        amount: i.amount.toString(),
        pointsAfter: i.pointsAfter.toString(),
        description: i.description,
        referenceId: i.referenceId,
        createdAt: i.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
