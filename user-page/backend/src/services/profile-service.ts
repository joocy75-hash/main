import { PrismaClient, GameCategory, Prisma, MoneyLogType, PointLogType } from '@prisma/client';
import bcryptjs from 'bcryptjs';
const { hash, compare } = bcryptjs;

const VALID_MONEY_LOG_TYPES = new Set(Object.values(MoneyLogType));
const VALID_POINT_LOG_TYPES = new Set(Object.values(PointLogType));

const BCRYPT_ROUNDS = 10;

interface PaginationResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BetFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

interface MoneyFilters {
  type?: string;
  page: number;
  limit: number;
}

interface PointFilters {
  type?: string;
  page: number;
  limit: number;
}

interface CommissionFilters {
  type?: string;
  category?: string;
  page: number;
  limit: number;
}

const buildDateFilter = (startDate?: string, endDate?: string) => {
  const filter: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (startDate) {
    filter.createdAt = { ...filter.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.createdAt = { ...filter.createdAt, lte: end };
  }
  return filter;
};

export class ProfileService {
  // ===== PROFILE =====

  async getProfile(prisma: PrismaClient, userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        phone: true,
        status: true,
        balance: true,
        points: true,
        bonusBalance: true,
        vipLevel: true,
        myReferralCode: true,
        referrerCode: true,
        commissionType: true,
        commissionEnabled: true,
        losingRate: true,
        lastLoginAt: true,
        createdAt: true,
        withdrawPin: true,
      },
    });

    if (!user) {
      throw { statusCode: 404, message: '사용자를 찾을 수 없습니다' };
    }

    const { withdrawPin, ...rest } = user;
    return { ...rest, hasWithdrawPin: !!withdrawPin };
  }

  async updateProfile(
    prisma: PrismaClient,
    userId: number,
    data: { nickname?: string; phone?: string },
  ) {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.nickname !== undefined) {
      updateData.nickname = data.nickname;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        nickname: true,
        phone: true,
      },
    });

    return user;
  }

  async changePassword(
    prisma: PrismaClient,
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw { statusCode: 404, message: '사용자를 찾을 수 없습니다' };
    }

    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw { statusCode: 401, message: '현재 비밀번호가 일치하지 않습니다' };
    }

    const newHash = await hash(newPassword, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: '비밀번호가 변경되었습니다' };
  }

  async setWithdrawPin(
    prisma: PrismaClient,
    userId: number,
    password: string,
    pin: string,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, withdrawPin: true },
    });

    if (!user) {
      throw { statusCode: 404, message: '사용자를 찾을 수 없습니다' };
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw { statusCode: 401, message: '비밀번호가 일치하지 않습니다' };
    }

    if (user.withdrawPin) {
      throw { statusCode: 409, message: '이미 출금 PIN이 설정되어 있습니다. 변경을 원하시면 PIN 변경을 이용해주세요' };
    }

    const pinHash = await hash(pin, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { withdrawPin: pinHash },
    });

    return { message: '출금 PIN이 설정되었습니다' };
  }

  async changeWithdrawPin(
    prisma: PrismaClient,
    userId: number,
    password: string,
    currentPin: string,
    newPin: string,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, withdrawPin: true },
    });

    if (!user) {
      throw { statusCode: 404, message: '사용자를 찾을 수 없습니다' };
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw { statusCode: 401, message: '비밀번호가 일치하지 않습니다' };
    }

    if (!user.withdrawPin) {
      throw { statusCode: 400, message: '출금 PIN이 설정되어 있지 않습니다. 먼저 PIN을 설정해주세요' };
    }

    const pinValid = await compare(currentPin, user.withdrawPin);
    if (!pinValid) {
      throw { statusCode: 401, message: '현재 출금 PIN이 일치하지 않습니다' };
    }

    const pinHash = await hash(newPin, BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { withdrawPin: pinHash },
    });

    return { message: '출금 PIN이 변경되었습니다' };
  }

  // ===== BET HISTORY =====

  async getBetHistory(
    prisma: PrismaClient,
    userId: number,
    filters: BetFilters,
  ): Promise<PaginationResult<any>> {
    const { category, startDate, endDate, page, limit } = filters;
    const dateFilter = buildDateFilter(startDate, endDate);

    const where: Prisma.BetRecordWhereInput = {
      userId,
      ...dateFilter,
    };

    if (category) {
      where.category = category as GameCategory;
    }

    const [items, total] = await Promise.all([
      prisma.betRecord.findMany({
        where,
        include: {
          game: { select: { name: true, thumbnail: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.betRecord.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===== MONEY HISTORY =====

  async getMoneyHistory(
    prisma: PrismaClient,
    userId: number,
    filters: MoneyFilters,
  ): Promise<PaginationResult<any>> {
    const { type, page, limit } = filters;

    const where: Prisma.MoneyLogWhereInput = { userId };
    if (type) {
      if (!VALID_MONEY_LOG_TYPES.has(type as MoneyLogType)) {
        throw { statusCode: 400, message: `유효하지 않은 거래 유형입니다: ${type}` };
      }
      where.type = type as MoneyLogType;
    }

    const [items, total] = await Promise.all([
      prisma.moneyLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.moneyLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===== POINT HISTORY =====

  async getPointHistory(
    prisma: PrismaClient,
    userId: number,
    filters: PointFilters,
  ): Promise<PaginationResult<any>> {
    const { type, page, limit } = filters;

    const where: Prisma.PointLogWhereInput = { userId };
    if (type) {
      if (!VALID_POINT_LOG_TYPES.has(type as PointLogType)) {
        throw { statusCode: 400, message: `유효하지 않은 포인트 유형입니다: ${type}` };
      }
      where.type = type as PointLogType;
    }

    const [items, total] = await Promise.all([
      prisma.pointLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pointLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===== LOGIN HISTORY =====

  async getLoginHistory(
    prisma: PrismaClient,
    userId: number,
    page: number,
    limit: number,
  ): Promise<PaginationResult<any>> {
    const where = { userId };

    const [items, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loginHistory.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ===== REFERRAL / AFFILIATE =====

  async getReferralDashboard(prisma: PrismaClient, userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        myReferralCode: true,
        commissionType: true,
        commissionEnabled: true,
        losingRate: true,
      },
    });

    if (!user) {
      throw { statusCode: 404, message: '사용자를 찾을 수 없습니다' };
    }

    const totalReferrals = await prisma.user.count({
      where: { referrerId: userId },
    });

    // Aggregate commission records
    const commissionAgg = await prisma.commissionRecord.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true,
    });

    // This month's commission
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCommission = await prisma.commissionRecord.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    return {
      referralCode: user.myReferralCode,
      commissionType: user.commissionType,
      commissionEnabled: user.commissionEnabled,
      losingRate: user.losingRate,
      totalReferrals,
      totalCommission: commissionAgg._sum.amount || 0,
      totalCommissionCount: commissionAgg._count,
      monthlyCommission: monthlyCommission._sum.amount || 0,
    };
  }

  async getReferralMembers(
    prisma: PrismaClient,
    userId: number,
    page: number,
    limit: number,
  ): Promise<PaginationResult<any>> {
    const where = { referrerId: userId };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          nickname: true,
          status: true,
          vipLevel: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCommissionHistory(
    prisma: PrismaClient,
    userId: number,
    filters: CommissionFilters,
  ): Promise<PaginationResult<any>> {
    const { type, category, page, limit } = filters;

    const where: Prisma.CommissionRecordWhereInput = { userId };
    if (type) {
      where.type = type as any;
    }
    if (category) {
      where.category = category as GameCategory;
    }

    const [items, total] = await Promise.all([
      prisma.commissionRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.commissionRecord.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRollingRates(prisma: PrismaClient, userId: number) {
    const rates = await prisma.gameRollingRate.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });

    return rates;
  }

  // ===== MESSAGES =====

  async getMessages(
    prisma: PrismaClient,
    userId: number,
    page: number,
    limit: number,
  ): Promise<PaginationResult<any>> {
    const where = { userId };

    const [items, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMessage(prisma: PrismaClient, userId: number, messageId: number) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.userId !== userId) {
      throw { statusCode: 404, message: '쪽지를 찾을 수 없습니다' };
    }

    // Mark as read
    if (!message.isRead) {
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return {
      ...message,
      isRead: true,
      readAt: message.readAt || new Date(),
    };
  }

  async getUnreadCount(prisma: PrismaClient, userId: number) {
    const count = await prisma.message.count({
      where: { userId, isRead: false },
    });

    return { unreadCount: count };
  }

  async deleteMessage(prisma: PrismaClient, userId: number, messageId: number) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.userId !== userId) {
      throw { statusCode: 404, message: '쪽지를 찾을 수 없습니다' };
    }

    await prisma.message.delete({ where: { id: messageId } });

    return { message: '쪽지가 삭제되었습니다' };
  }

  // ===== INQUIRIES =====

  async getInquiries(
    prisma: PrismaClient,
    userId: number,
    page: number,
    limit: number,
    status?: string,
  ): Promise<PaginationResult<any>> {
    const where: Prisma.InquiryWhereInput = { userId };
    if (status) {
      where.status = status as any;
    }

    const [items, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inquiry.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createInquiry(
    prisma: PrismaClient,
    userId: number,
    title: string,
    content: string,
  ) {
    const inquiry = await prisma.inquiry.create({
      data: {
        userId,
        title,
        content,
        status: 'pending',
      },
    });

    return inquiry;
  }

  async getInquiry(prisma: PrismaClient, userId: number, inquiryId: number) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!inquiry || inquiry.userId !== userId) {
      throw { statusCode: 404, message: '문의를 찾을 수 없습니다' };
    }

    return inquiry;
  }
}
