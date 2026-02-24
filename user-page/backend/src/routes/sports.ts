import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { SportsService } from '../services/sports-service.js';
import { publicApiRateLimit } from '../middleware/rate-limit.js';

const eventsQuerySchema = z.object({
  status: z.enum(['LIVE', 'SCHEDULED']).default('LIVE'),
  sport: z.string().optional(),
});

export default async function sportsRoutes(fastify: FastifyInstance) {
  const sportsService = new SportsService();

  // GET /api/sports/events - requires auth + rate limit
  fastify.get('/api/sports/events', { preHandler: [fastify.authenticate], ...publicApiRateLimit }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = eventsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: '잘못된 조회 파라미터입니다',
      });
    }

    try {
      const { status, sport } = parsed.data;
      const events = status === 'LIVE'
        ? await sportsService.getLiveEvents(sport)
        : await sportsService.getScheduledEvents(sport);

      return reply.send({ success: true, data: events });
    } catch (err: any) {
      fastify.log.error(err, 'Get sports events error');
      const statusCode = err.statusCode || 500;
      return reply.code(statusCode).send({
        success: false,
        error: statusCode >= 500 ? '서버 오류가 발생했습니다' : (err.message || '요청 처리에 실패했습니다'),
      });
    }
  });

  // GET /api/sports/events/:id/odds - requires auth + rate limit
  fastify.get('/api/sports/events/:id/odds', { preHandler: [fastify.authenticate], ...publicApiRateLimit }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const eventId = parseInt(id, 10);

      if (isNaN(eventId)) {
        return reply.code(400).send({
          success: false,
          error: '유효하지 않은 이벤트 ID입니다',
        });
      }

      const odds = await sportsService.getEventOdds(eventId);
      return reply.send({ success: true, data: odds });
    } catch (err: any) {
      fastify.log.error(err, 'Get event odds error');
      const statusCode = err.statusCode || 500;
      return reply.code(statusCode).send({
        success: false,
        error: statusCode >= 500 ? '서버 오류가 발생했습니다' : (err.message || '요청 처리에 실패했습니다'),
      });
    }
  });

  // GET /api/sports/categories - public
  fastify.get('/api/sports/categories', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const categories = sportsService.getSportCategories();
      return reply.send({ success: true, data: categories });
    } catch (err: any) {
      fastify.log.error(err, 'Get sport categories error');
      const statusCode = err.statusCode || 500;
      return reply.code(statusCode).send({
        success: false,
        error: statusCode >= 500 ? '서버 오류가 발생했습니다' : (err.message || '요청 처리에 실패했습니다'),
      });
    }
  });

  // GET /api/esports/live - requires auth + rate limit
  fastify.get('/api/esports/live', { preHandler: [fastify.authenticate], ...publicApiRateLimit }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const events = await sportsService.getEsportsLive();
      return reply.send({ success: true, data: events });
    } catch (err: any) {
      fastify.log.error(err, 'Get esports live error');
      const statusCode = err.statusCode || 500;
      return reply.code(statusCode).send({
        success: false,
        error: statusCode >= 500 ? '서버 오류가 발생했습니다' : (err.message || '요청 처리에 실패했습니다'),
      });
    }
  });

  // GET /api/esports/categories - public
  fastify.get('/api/esports/categories', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const categories = sportsService.getEsportsCategories();
      return reply.send({ success: true, data: categories });
    } catch (err: any) {
      fastify.log.error(err, 'Get esports categories error');
      const statusCode = err.statusCode || 500;
      return reply.code(statusCode).send({
        success: false,
        error: statusCode >= 500 ? '서버 오류가 발생했습니다' : (err.message || '요청 처리에 실패했습니다'),
      });
    }
  });
}
