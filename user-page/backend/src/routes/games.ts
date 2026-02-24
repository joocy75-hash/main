import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { GameService } from '../services/game-service.js';

const gameCategoryEnum = z.enum(['casino', 'slot', 'holdem', 'sports', 'shooting', 'coin', 'mini_game']);

const launchSchema = z.object({
  gameId: z.string().min(1, '게임 ID가 필요합니다'),
  platform: z.number().int().min(1).max(2).default(1),
});

const demoSchema = z.object({
  gameId: z.string().min(1, '게임 ID가 필요합니다'),
  platform: z.number().int().min(1).max(2).default(1),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const searchSchema = paginationSchema.extend({
  q: z.string().optional(),
  category: gameCategoryEnum.optional(),
  provider: z.string().optional(),
});

const providerQuerySchema = z.object({
  category: gameCategoryEnum.optional(),
});

const popularQuerySchema = z.object({
  category: gameCategoryEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export default async function gameRoutes(fastify: FastifyInstance) {
  const gameService = new GameService(fastify);

  // GET /api/games/categories - Return 7 categories from DB
  fastify.get('/api/games/categories', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const categories = await gameService.getCategories();
      return reply.send({ success: true, data: categories });
    } catch (err: any) {
      fastify.log.error(err, 'Get categories error');
      return reply.code(err.statusCode || 500).send({
        success: false,
        error: err.message || '서버 오류가 발생했습니다',
      });
    }
  });

  // GET /api/games/providers - Return active providers with gameCount
  fastify.get('/api/games/providers', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = providerQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: '유효하지 않은 카테고리입니다',
        });
      }
      const providers = await gameService.getProviders(parsed.data.category);
      return reply.send({ success: true, data: providers });
    } catch (err: any) {
      fastify.log.error(err, 'Get providers error');
      return reply.code(err.statusCode || 500).send({
        success: false,
        error: err.message || '서버 오류가 발생했습니다',
      });
    }
  });

  // GET /api/games/providers/:code - Return games for a specific provider
  fastify.get('/api/games/providers/:code', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code } = request.params as { code: string };
      const query = request.query as { page?: string; limit?: string };
      const parsed = paginationSchema.safeParse(query);

      const page = parsed.success ? parsed.data.page : 1;
      const limit = parsed.success ? parsed.data.limit : 20;

      const result = await gameService.getGamesByProvider(code, page, limit);
      return reply.send({ success: true, data: result });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return reply.code(statusCode).send({
        success: false,
        error: err.message || '서버 오류가 발생했습니다',
      });
    }
  });

  // GET /api/games/search - Search games by name
  fastify.get('/api/games/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = searchSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: '잘못된 검색 파라미터입니다',
        });
      }

      const { q, category, provider, page, limit } = parsed.data;
      const result = await gameService.searchGames(q || '', category, provider, page, limit);
      return reply.send({ success: true, data: result });
    } catch (err: any) {
      fastify.log.error(err, 'Search games error');
      return reply.code(err.statusCode || 500).send({
        success: false,
        error: err.message || '서버 오류가 발생했습니다',
      });
    }
  });

  // POST /api/games/launch - Generate game launch URL (requires auth)
  fastify.post(
    '/api/games/launch',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = launchSchema.safeParse(request.body);
      if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return reply.code(400).send({
          success: false,
          error: firstError.message,
        });
      }

      try {
        const userId = request.user.userId;
        const { gameId, platform } = parsed.data;
        const result = await gameService.launchGame(userId, gameId, platform as 1 | 2);
        return reply.send({ success: true, data: result });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Launch game error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/games/recent - Get user's recently played games (requires auth)
  fastify.get(
    '/api/games/recent',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const games = await gameService.getRecentGames(userId);
        return reply.send({ success: true, data: games });
      } catch (err: any) {
        fastify.log.error(err, 'Get recent games error');
        return reply.code(err.statusCode || 500).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/games/popular - Get popular games by launch_count
  fastify.get('/api/games/popular', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = popularQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: '유효하지 않은 파라미터입니다',
        });
      }
      const { category, limit } = parsed.data;
      const games = await gameService.getPopularGames(category, limit);
      return reply.send({ success: true, data: games });
    } catch (err: any) {
      fastify.log.error(err, 'Get popular games error');
      return reply.code(err.statusCode || 500).send({
        success: false,
        error: err.message || '서버 오류가 발생했습니다',
      });
    }
  });

  // POST /api/games/demo - Generate demo game launch URL (no auth, money=0)
  fastify.post('/api/games/demo', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = demoSchema.safeParse(request.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return reply.code(400).send({
        success: false,
        error: firstError.message,
      });
    }

    try {
      const { gameId, platform } = parsed.data;
      const result = await gameService.launchDemoGame(gameId, platform as 1 | 2);
      return reply.send({ success: true, data: result });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      if (statusCode >= 500) {
        fastify.log.error(err, 'Demo game error');
      }
      return reply.code(statusCode).send({
        success: false,
        error: err.message || '서버 오류가 발생했습니다',
      });
    }
  });
}
