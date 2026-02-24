import { FastifyInstance } from 'fastify';
import { GameCategory, Prisma } from '@prisma/client';
import { createHmac } from 'crypto';
import { config } from '../config.js';

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GameService {
  constructor(private readonly fastify: FastifyInstance) {}

  // Return all active categories ordered by sortOrder
  async getCategories() {
    const { prisma } = this.fastify;

    return prisma.gameCategoryConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Return providers filtered by category, ordered by name
  async getProviders(category?: string) {
    const { prisma } = this.fastify;

    const where: Prisma.GameProviderWhereInput = { isActive: true };
    if (category) {
      where.category = category as GameCategory;
    }

    return prisma.gameProvider.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        logo: true,
        category: true,
        gameCount: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  // Paginated games for a specific provider
  async getGamesByProvider(
    providerCode: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<any>> {
    const { prisma } = this.fastify;

    const provider = await prisma.gameProvider.findUnique({
      where: { code: providerCode },
    });

    if (!provider) {
      throw { statusCode: 404, message: '프로바이더를 찾을 수 없습니다' };
    }

    const where: Prisma.GameWhereInput = {
      providerId: provider.id,
      isActive: true,
    };

    const [items, total] = await Promise.all([
      prisma.game.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          provider: {
            select: { code: true, name: true },
          },
        },
      }),
      prisma.game.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Search games with filters
  async searchGames(
    query: string,
    category?: string,
    provider?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<any>> {
    const { prisma } = this.fastify;

    const where: Prisma.GameWhereInput = {
      isActive: true,
      ...(query && {
        name: { contains: query, mode: 'insensitive' as Prisma.QueryMode },
      }),
      ...(category && { category: category as GameCategory }),
      ...(provider && {
        provider: { code: provider },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.game.findMany({
        where,
        orderBy: { launchCount: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          provider: {
            select: { code: true, name: true },
          },
        },
      }),
      prisma.game.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Launch a real game (authenticated user)
  async launchGame(userId: number, gameId: string, platform: 1 | 2) {
    const { prisma } = this.fastify;

    const game = await prisma.game.findUnique({
      where: { externalId: gameId },
      include: { provider: true },
    });

    if (!game) {
      throw { statusCode: 404, message: '게임을 찾을 수 없습니다' };
    }

    if (!game.isActive) {
      throw { statusCode: 403, message: '현재 이용할 수 없는 게임입니다' };
    }

    if (!game.provider.isActive) {
      throw { statusCode: 403, message: '프로바이더가 비활성 상태입니다' };
    }

    // Increment launch count
    await prisma.game.update({
      where: { id: game.id },
      data: { launchCount: { increment: 1 } },
    });

    // Record in bet_records as a game launch marker (bet_amount=0, win_amount=0)
    await prisma.betRecord.create({
      data: {
        userId,
        gameId: game.id,
        category: game.category,
        betAmount: 0,
        winAmount: 0,
        outcome: 'launch',
      },
    });

    // Generate HMAC-signed session token to avoid exposing userId in URL
    const timestamp = Date.now();
    const sessionToken = createHmac('sha256', config.jwt.secret)
      .update(`${userId}:${game.externalId}:${timestamp}`)
      .digest('hex')
      .slice(0, 32);
    const launchUrl = `https://game-placeholder.example.com/play?gameId=${game.externalId}&token=${sessionToken}&platform=${platform}&mode=real&t=${timestamp}`;

    return {
      launchUrl,
      game: {
        id: game.id,
        externalId: game.externalId,
        name: game.name,
        provider: game.provider.name,
        category: game.category,
        thumbnail: game.thumbnail,
      },
    };
  }

  // Launch demo game (no auth required, money=0)
  async launchDemoGame(gameId: string, platform: 1 | 2) {
    const { prisma } = this.fastify;

    const game = await prisma.game.findUnique({
      where: { externalId: gameId },
      include: { provider: true },
    });

    if (!game) {
      throw { statusCode: 404, message: '게임을 찾을 수 없습니다' };
    }

    if (!game.isActive) {
      throw { statusCode: 403, message: '현재 이용할 수 없는 게임입니다' };
    }

    // Generate demo launch URL (money=0)
    const launchUrl = `https://game-placeholder.example.com/play?gameId=${game.externalId}&userId=demo&platform=${platform}&mode=demo&money=0&t=${Date.now()}`;

    return {
      launchUrl,
      game: {
        id: game.id,
        externalId: game.externalId,
        name: game.name,
        provider: game.provider.name,
        category: game.category,
        thumbnail: game.thumbnail,
      },
    };
  }

  // Get recently played games for a user (from BetRecord, limit 20)
  async getRecentGames(userId: number) {
    const { prisma } = this.fastify;

    // Get distinct recent game IDs from bet_records
    const recentRecords = await prisma.betRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        gameId: true,
        createdAt: true,
        game: {
          select: {
            id: true,
            externalId: true,
            name: true,
            category: true,
            thumbnail: true,
            launchCount: true,
            provider: {
              select: { code: true, name: true },
            },
          },
        },
      },
      take: 100,
    });

    // Deduplicate by gameId, keeping the most recent entry
    const seen = new Set<number>();
    const uniqueGames = [];
    for (const record of recentRecords) {
      if (!seen.has(record.gameId)) {
        seen.add(record.gameId);
        uniqueGames.push({
          ...record.game,
          lastPlayedAt: record.createdAt,
        });
      }
      if (uniqueGames.length >= 20) break;
    }

    return uniqueGames;
  }

  // Get popular games by launchCount
  async getPopularGames(category?: string, limit: number = 20) {
    const { prisma } = this.fastify;

    const where: Prisma.GameWhereInput = {
      isActive: true,
      launchCount: { gt: 0 },
      ...(category && { category: category as GameCategory }),
    };

    return prisma.game.findMany({
      where,
      orderBy: { launchCount: 'desc' },
      take: limit,
      include: {
        provider: {
          select: { code: true, name: true },
        },
      },
    });
  }
}
