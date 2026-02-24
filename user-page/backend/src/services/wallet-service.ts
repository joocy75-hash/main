import { PrismaClient, CoinType, NetworkType, TransactionStatus, Prisma } from '@prisma/client';
import bcryptjs from 'bcryptjs';
const { compare } = bcryptjs;
import { randomBytes } from 'crypto';

// Withdrawal fee table: coinType_network -> fee amount
const WITHDRAWAL_FEES: Record<string, number> = {
  'USDT_TRC20': 1,
  'USDT_ERC20': 5,
  'TRX_TRC20': 0,
  'ETH_ERC20': 0.001,
  'BTC_BTC': 0.0001,
  'BNB_BEP20': 0.005,
};

// Minimum deposit amounts per coinType
const MIN_DEPOSIT_AMOUNTS: Record<string, number> = {
  'USDT': 10,
  'TRX': 100,
  'ETH': 0.01,
  'BTC': 0.001,
  'BNB': 0.1,
};

// Max addresses per user
const MAX_ADDRESSES_PER_USER = 10;

// Withdrawal password brute-force protection
const WITHDRAWAL_PW_MAX_ATTEMPTS = 5;
const WITHDRAWAL_PW_LOCKOUT_SECONDS = 900; // 15 minutes

// Minimal Redis interface for withdrawal brute-force protection
interface RedisLike {
  get(key: string): Promise<string | null>;
  set(...args: unknown[]): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  del(...keys: string[]): Promise<number>;
  ttl(key: string): Promise<number>;
}

// Address prefix by network for mock deposit address generation
const ADDRESS_PREFIX: Record<string, { prefix: string; length: number }> = {
  'TRC20': { prefix: 'T', length: 34 },
  'ERC20': { prefix: '0x', length: 42 },
  'BEP20': { prefix: '0x', length: 42 },
  'BTC': { prefix: 'bc1q', length: 42 },
};

const generateMockAddress = (network: NetworkType): string => {
  const config = ADDRESS_PREFIX[network];
  if (!config) return '0x' + randomBytes(20).toString('hex');
  const remaining = config.length - config.prefix.length;
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let addr = config.prefix;
  const bytes = randomBytes(remaining);
  for (let i = 0; i < remaining; i++) {
    addr += chars[bytes[i] % chars.length];
  }
  return addr;
};

interface TransactionFilters {
  type?: 'all' | 'deposit' | 'withdrawal';
  status?: 'all' | TransactionStatus;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

// Normalize deposit record to unified transaction shape
const normalizeDeposit = (d: any) => ({
  id: d.id,
  type: 'deposit' as const,
  coinType: d.coinType,
  network: d.network,
  amount: d.amount,
  fee: null,
  address: d.depositAddress,
  txHash: d.txHash,
  status: d.status,
  processedAt: d.processedAt,
  createdAt: d.createdAt,
});

// Normalize withdrawal record to unified transaction shape
const normalizeWithdrawal = (w: any) => ({
  id: w.id,
  type: 'withdrawal' as const,
  coinType: w.coinType,
  network: w.network,
  amount: w.amount,
  fee: w.fee,
  address: w.address,
  txHash: w.txHash,
  status: w.status,
  processedAt: w.processedAt,
  createdAt: w.createdAt,
});

export class WalletService {
  async getBalance(prisma: PrismaClient, userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true, points: true, bonusBalance: true },
    });

    if (!user) {
      throw { statusCode: 404, message: '사용자를 찾을 수 없습니다' };
    }

    return {
      balance: user.balance,
      points: user.points,
      bonusBalance: user.bonusBalance,
    };
  }

  async getAddresses(prisma: PrismaClient, userId: number) {
    const addresses = await prisma.walletAddress.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return addresses;
  }

  async addAddress(
    prisma: PrismaClient,
    userId: number,
    coinType: CoinType,
    network: NetworkType,
    address: string,
    label?: string,
  ) {
    // Check max address limit
    const count = await prisma.walletAddress.count({ where: { userId } });
    if (count >= MAX_ADDRESSES_PER_USER) {
      throw { statusCode: 400, message: `출금 주소는 최대 ${MAX_ADDRESSES_PER_USER}개까지 등록할 수 있습니다` };
    }

    const walletAddress = await prisma.walletAddress.create({
      data: {
        userId,
        coinType,
        network,
        address,
        label: label || null,
      },
    });

    return walletAddress;
  }

  async deleteAddress(prisma: PrismaClient, userId: number, addressId: number) {
    // Verify ownership
    const address = await prisma.walletAddress.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw { statusCode: 404, message: '출금 주소를 찾을 수 없습니다' };
    }

    if (address.userId !== userId) {
      throw { statusCode: 403, message: '삭제 권한이 없습니다' };
    }

    await prisma.walletAddress.delete({ where: { id: addressId } });

    return { message: '출금 주소가 삭제되었습니다' };
  }

  async createDeposit(
    prisma: PrismaClient,
    userId: number,
    coinType: CoinType,
    network: NetworkType,
    amount: number,
  ) {
    // Validate minimum amount
    const minAmount = MIN_DEPOSIT_AMOUNTS[coinType] || 0;
    if (amount < minAmount) {
      throw {
        statusCode: 400,
        message: `최소 입금액은 ${minAmount} ${coinType}입니다`,
      };
    }

    // Generate a mock deposit address
    const depositAddress = generateMockAddress(network);

    const deposit = await prisma.deposit.create({
      data: {
        userId,
        coinType,
        network,
        amount: new Prisma.Decimal(amount),
        depositAddress,
        status: 'PENDING',
      },
    });

    return deposit;
  }

  async createWithdrawal(
    prisma: PrismaClient,
    redis: RedisLike,
    userId: number,
    coinType: CoinType,
    network: NetworkType,
    address: string,
    amount: number,
    password: string,
  ) {
    // 1. Check brute-force lockout
    const lockKey = `wd_lock:${userId}`;
    const attemptsKey = `wd_attempts:${userId}`;

    const locked = await redis.get(lockKey);
    if (locked) {
      const ttl = await redis.ttl(lockKey);
      throw {
        statusCode: 429,
        message: `비밀번호 시도 횟수 초과. ${Math.ceil(ttl / 60)}분 후 다시 시도해주세요`,
      };
    }

    // 2. Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw { statusCode: 404, message: '사용자를 찾을 수 없습니다' };
    }

    const passwordValid = await compare(password, user.passwordHash);
    if (!passwordValid) {
      const attempts = await redis.incr(attemptsKey);
      await redis.expire(attemptsKey, WITHDRAWAL_PW_LOCKOUT_SECONDS);
      if (attempts >= WITHDRAWAL_PW_MAX_ATTEMPTS) {
        await redis.set(lockKey, '1', 'EX', WITHDRAWAL_PW_LOCKOUT_SECONDS);
        await redis.del(attemptsKey);
        throw {
          statusCode: 429,
          message: '비밀번호 시도 횟수 초과. 15분 후 다시 시도해주세요',
        };
      }
      throw {
        statusCode: 401,
        message: `비밀번호가 일치하지 않습니다 (${WITHDRAWAL_PW_MAX_ATTEMPTS - attempts}회 남음)`,
      };
    }

    // Clear failed attempts on successful password
    await redis.del(attemptsKey);

    // 2. Calculate fee
    const feeKey = `${coinType}_${network}`;
    const fee = WITHDRAWAL_FEES[feeKey] ?? 0;
    const totalAmount = amount + fee;

    // 3. Atomic balance check and deduction with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Use raw query for SELECT FOR UPDATE equivalent
      const users = await tx.$queryRaw<Array<{ id: number; balance: Prisma.Decimal }>>`
        SELECT id, balance FROM users WHERE id = ${userId} FOR UPDATE
      `;

      if (!users || users.length === 0) {
        throw { statusCode: 404, message: '사용자를 찾을 수 없습니다' };
      }

      const currentBalance = parseFloat(users[0].balance.toString());
      if (currentBalance < totalAmount) {
        throw { statusCode: 400, message: '잔액이 부족합니다' };
      }

      // Deduct balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalAmount } },
        select: { balance: true },
      });

      // Create withdrawal record
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          coinType,
          network,
          amount: new Prisma.Decimal(amount),
          fee: new Prisma.Decimal(fee),
          address,
          status: 'PENDING',
        },
      });

      // Create money log
      await tx.moneyLog.create({
        data: {
          userId,
          type: 'withdrawal',
          amount: new Prisma.Decimal(-totalAmount),
          balanceAfter: updatedUser.balance,
          description: `${coinType} 출금 신청 (${network})`,
          referenceId: `withdrawal_${withdrawal.id}`,
        },
      });

      return withdrawal;
    });

    return result;
  }

  async getTransactions(prisma: PrismaClient, userId: number, filters: TransactionFilters) {
    const { type = 'all', status = 'all', startDate, endDate, page, limit } = filters;

    // Build common where clause
    const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (startDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { ...dateFilter.createdAt, lte: end };
    }
    const statusFilter = status !== 'all' ? { status: status as TransactionStatus } : {};
    const commonWhere = { userId, ...statusFilter, ...dateFilter };

    // Single type: DB-level skip/take pagination
    if (type === 'deposit') {
      const [items, total] = await Promise.all([
        prisma.deposit.findMany({
          where: commonWhere,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.deposit.count({ where: commonWhere }),
      ]);
      return {
        items: items.map(normalizeDeposit),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }

    if (type === 'withdrawal') {
      const [items, total] = await Promise.all([
        prisma.withdrawal.findMany({
          where: commonWhere,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.withdrawal.count({ where: commonWhere }),
      ]);
      return {
        items: items.map(normalizeWithdrawal),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }

    // type === 'all': fetch limited data from both tables + separate counts
    const offset = (page - 1) * limit;
    const [deposits, withdrawals, depositCount, withdrawalCount] = await Promise.all([
      prisma.deposit.findMany({
        where: commonWhere,
        orderBy: { createdAt: 'desc' },
        take: offset + limit,
      }),
      prisma.withdrawal.findMany({
        where: commonWhere,
        orderBy: { createdAt: 'desc' },
        take: offset + limit,
      }),
      prisma.deposit.count({ where: commonWhere }),
      prisma.withdrawal.count({ where: commonWhere }),
    ]);

    // Merge sort two pre-sorted arrays, then slice for current page
    const merged = [
      ...deposits.map(normalizeDeposit),
      ...withdrawals.map(normalizeWithdrawal),
    ];
    merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = depositCount + withdrawalCount;
    const items = merged.slice(offset, offset + limit);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTransaction(
    prisma: PrismaClient,
    userId: number,
    id: number,
    type: 'deposit' | 'withdrawal',
  ) {
    if (type === 'deposit') {
      const deposit = await prisma.deposit.findUnique({
        where: { id },
      });

      if (!deposit || deposit.userId !== userId) {
        throw { statusCode: 404, message: '거래를 찾을 수 없습니다' };
      }

      return {
        id: deposit.id,
        type: 'deposit' as const,
        coinType: deposit.coinType,
        network: deposit.network,
        amount: deposit.amount,
        fee: null,
        address: deposit.depositAddress,
        txHash: deposit.txHash,
        status: deposit.status,
        processedAt: deposit.processedAt,
        createdAt: deposit.createdAt,
      };
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
    });

    if (!withdrawal || withdrawal.userId !== userId) {
      throw { statusCode: 404, message: '거래를 찾을 수 없습니다' };
    }

    return {
      id: withdrawal.id,
      type: 'withdrawal' as const,
      coinType: withdrawal.coinType,
      network: withdrawal.network,
      amount: withdrawal.amount,
      fee: withdrawal.fee,
      address: withdrawal.address,
      txHash: withdrawal.txHash,
      status: withdrawal.status,
      processedAt: withdrawal.processedAt,
      createdAt: withdrawal.createdAt,
    };
  }
}
