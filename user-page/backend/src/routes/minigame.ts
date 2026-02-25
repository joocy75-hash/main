import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BepickService } from '../services/minigame-service.js';

export default async function minigameRoutes(fastify: FastifyInstance) {
  const bepickService = new BepickService();

  // GET /api/minigame/types - Available minigame types (public)
  fastify.get('/api/minigame/types', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const types = bepickService.getGameTypes();
      return reply.send({ success: true, data: types });
    } catch (err: any) {
      fastify.log.error(err, 'Get minigame types error');
      return reply.code(500).send({
        success: false,
        error: '서버 오류가 발생했습니다',
      });
    }
  });

  // GET /api/minigame/rounds - Latest 30 rounds (public)
  fastify.get('/api/minigame/rounds', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const rounds = await bepickService.getLatestRounds(fastify.redis);
      return reply.send({ success: true, data: rounds });
    } catch (err: any) {
      fastify.log.error(err, 'Get minigame rounds error');
      return reply.code(500).send({
        success: false,
        error: '서버 오류가 발생했습니다',
      });
    }
  });

  // GET /api/minigame/current - Current (latest) round (public)
  fastify.get('/api/minigame/current', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const current = await bepickService.getCurrentRound(fastify.redis);
      return reply.send({ success: true, data: current });
    } catch (err: any) {
      fastify.log.error(err, 'Get current minigame round error');
      return reply.code(500).send({
        success: false,
        error: '서버 오류가 발생했습니다',
      });
    }
  });
}
