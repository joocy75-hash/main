import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GambllyGameService } from '../services/gamblly-game-service.js';

const gameService = new GambllyGameService();

export default async function gameRoutes(fastify: FastifyInstance) {
  // GET /api/games/categories — game category list
  fastify.get(
    '/api/games/categories',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({ success: true, data: gameService.getCategories() });
    }
  );

  // GET /api/games/providers — all KRW providers
  fastify.get(
    '/api/games/providers',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { refresh } = request.query as { refresh?: string };
      const providers = await gameService.getProviders(refresh === '1');
      return reply.send({ success: true, data: providers });
    }
  );

  // GET /api/games/providers-stats — lightweight providers with game counts (from cache)
  fastify.get(
    '/api/games/providers-stats',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const providers = await gameService.getProvidersWithStats();
        return reply.send({ success: true, data: { providers } });
      } catch (err) {
        _request.log.error(err, 'Failed to fetch provider stats');
        return reply.code(500).send({ success: false, message: '프로바이더 정보를 불러오지 못했습니다' });
      }
    }
  );

  // GET /api/games/all — all games + providers (cached 1h, stale-while-revalidate)
  fastify.get(
    '/api/games/all',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { refresh } = request.query as { refresh?: string };
        const result = await gameService.getAllGames(refresh === '1');
        return reply.send({
          success: true,
          data: {
            totalProviders: result.providers.length,
            totalGames: result.games.length,
            providers: result.providers,
            games: result.games,
          },
        });
      } catch (err) {
        request.log.error(err, 'Failed to fetch all games');
        return reply.code(500).send({ success: false, message: '게임 목록을 불러오지 못했습니다' });
      }
    }
  );

  // GET /api/games/provider/:code — games by provider
  fastify.get(
    '/api/games/provider/:code',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code } = request.params as { code: string };
      try {
        const games = await gameService.getGamesByProvider(code);
        return reply.send({ success: true, data: games });
      } catch (err) {
        request.log.error(err, `Failed to fetch games for provider ${code}`);
        return reply.code(500).send({ success: false, message: '게임 목록을 불러오지 못했습니다' });
      }
    }
  );

  // GET /api/games/search — search games by name
  fastify.get(
    '/api/games/search',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { q, category, provider } = request.query as { q?: string; category?: string; provider?: string };
      const { games } = await gameService.getAllGames();

      let filtered = games;
      if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter(
          (g) => g.name.toLowerCase().includes(query) || g.providerName.toLowerCase().includes(query)
        );
      }
      if (category && category !== 'all') {
        filtered = filtered.filter((g) => g.category === category);
      }
      if (provider) {
        filtered = filtered.filter((g) => g.provider === provider);
      }

      return reply.send({ success: true, data: filtered });
    }
  );

  // POST /api/games/launch — launch game (requires auth)
  fastify.post(
    '/api/games/launch',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user.userId;
      const { gameUid, platform } = request.body as { gameUid: string; platform?: 1 | 2 };

      if (!gameUid) {
        return reply.code(400).send({ success: false, message: '게임 ID가 필요합니다' });
      }

      try {
        const result = await gameService.launchGame({
          userId,
          gameUid,
          platform: platform || 1,
        });
        return reply.send({ success: true, data: result });
      } catch (err) {
        request.log.error(err, 'Failed to launch game');
        return reply.code(500).send({ success: false, message: '게임 실행에 실패했습니다' });
      }
    }
  );

  // POST /api/games/demo — launch game in demo mode (no auth required)
  fastify.post(
    '/api/games/demo',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { gameUid, platform } = request.body as { gameUid: string; platform?: 1 | 2 };

      if (!gameUid) {
        return reply.code(400).send({ success: false, message: '게임 ID가 필요합니다' });
      }

      try {
        const result = await gameService.launchGame({
          userId: 0,
          gameUid,
          creditAmount: 0,
          platform: platform || 1,
        });
        return reply.send({ success: true, data: result });
      } catch (err) {
        request.log.error(err, 'Failed to launch demo game');
        return reply.code(500).send({ success: false, message: '게임 실행에 실패했습니다' });
      }
    }
  );
}
