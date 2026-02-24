import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { EventService } from '../services/event-service.js';

const convertSchema = z.object({
  amount: z.number().int().min(100, '최소 100 포인트 이상이어야 합니다'),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export default async function eventRoutes(fastify: FastifyInstance) {
  const eventService = new EventService();

  // ===== ATTENDANCE =====

  // POST /api/attendance/check-in
  fastify.post(
    '/api/attendance/check-in',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await eventService.checkIn(fastify.prisma, fastify.redis, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Check-in error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/attendance/status
  fastify.get(
    '/api/attendance/status',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await eventService.getAttendanceStatus(fastify.prisma, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get attendance status error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // ===== MISSIONS =====

  // GET /api/missions
  fastify.get(
    '/api/missions',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await eventService.getMissions(fastify.prisma, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get missions error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // POST /api/missions/:id/claim
  fastify.post(
    '/api/missions/:id/claim',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params as { id: string };
        const missionId = parseInt(id, 10);

        if (isNaN(missionId)) {
          return reply.code(400).send({
            success: false,
            error: '유효하지 않은 미션 ID입니다',
          });
        }

        const data = await eventService.claimMission(fastify.prisma, userId, missionId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Claim mission error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // ===== SPIN =====

  // POST /api/spin/execute
  fastify.post(
    '/api/spin/execute',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await eventService.executeSpin(fastify.prisma, fastify.redis, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Execute spin error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/spin/status
  fastify.get(
    '/api/spin/status',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await eventService.getSpinStatus(fastify.prisma, fastify.redis, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get spin status error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // ===== PROMOTIONS =====

  // GET /api/promotions (public)
  fastify.get('/api/promotions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { category } = request.query as { category?: string };
      const data = await eventService.getPromotions(fastify.prisma, category);
      return reply.send({ success: true, data });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      if (statusCode >= 500) {
        fastify.log.error(err, 'Get promotions error');
      }
      return reply.code(statusCode).send({
        success: false,
        error: err.message || '서버 오류가 발생했습니다',
      });
    }
  });

  // POST /api/promotions/:id/claim
  fastify.post(
    '/api/promotions/:id/claim',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params as { id: string };
        const promotionId = parseInt(id, 10);

        if (isNaN(promotionId)) {
          return reply.code(400).send({
            success: false,
            error: '유효하지 않은 프로모션 ID입니다',
          });
        }

        const data = await eventService.claimPromotion(fastify.prisma, userId, promotionId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Claim promotion error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // ===== VIP =====

  // GET /api/vip/info
  fastify.get(
    '/api/vip/info',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await eventService.getVipInfo(fastify.prisma, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get VIP info error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/vip/levels (public)
  fastify.get('/api/vip/levels', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await eventService.getVipLevels(fastify.prisma);
      return reply.send({ success: true, data });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      if (statusCode >= 500) {
        fastify.log.error(err, 'Get VIP levels error');
      }
      return reply.code(statusCode).send({
        success: false,
        error: err.message || '서버 오류가 발생했습니다',
      });
    }
  });

  // ===== POINTS =====

  // POST /api/points/convert
  fastify.post(
    '/api/points/convert',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = convertSchema.safeParse(request.body);
      if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return reply.code(400).send({
          success: false,
          error: firstError.message,
        });
      }

      try {
        const userId = request.user.userId;
        const { amount } = parsed.data;
        const data = await eventService.convertPoints(fastify.prisma, userId, amount);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Convert points error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/points/history
  fastify.get(
    '/api/points/history',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = paginationSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: '잘못된 조회 파라미터입니다',
        });
      }

      try {
        const userId = request.user.userId;
        const { page, limit } = parsed.data;
        const data = await eventService.getPointHistory(fastify.prisma, userId, page, limit);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get point history error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );
}
