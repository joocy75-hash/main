import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ProfileService } from '../services/profile-service.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateProfileSchema = z.object({
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다').max(20, '닉네임은 20자 이하여야 합니다').optional(),
  phone: z.string().regex(/^01\d{8,9}$/, '올바른 전화번호 형식이 아닙니다').optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
  newPassword: z.string()
    .min(8, '새 비밀번호는 8자 이상이어야 합니다')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '비밀번호는 영문과 숫자를 포함해야 합니다'),
});

const gameCategoryEnum = z.enum(['casino', 'slot', 'holdem', 'sports', 'shooting', 'coin', 'mini_game']);

const betQuerySchema = paginationSchema.extend({
  category: gameCategoryEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const moneyQuerySchema = paginationSchema.extend({
  type: z.string().optional(),
});

const pointQuerySchema = paginationSchema.extend({
  type: z.string().optional(),
});

const commissionQuerySchema = paginationSchema.extend({
  type: z.string().optional(),
  category: gameCategoryEnum.optional(),
});

const inquiryQuerySchema = paginationSchema.extend({
  status: z.string().optional(),
});

const createInquirySchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이하여야 합니다'),
  content: z.string().min(1, '내용을 입력해주세요'),
});

export default async function profileRoutes(fastify: FastifyInstance) {
  const profileService = new ProfileService();

  // ===== PROFILE =====

  // GET /api/profile - User profile (auth)
  fastify.get(
    '/api/profile',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await profileService.getProfile(fastify.prisma, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get profile error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // PUT /api/profile - Update profile (auth)
  fastify.put(
    '/api/profile',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return reply.code(400).send({
          success: false,
          error: firstError.message,
        });
      }

      try {
        const userId = request.user.userId;
        const data = await profileService.updateProfile(fastify.prisma, userId, parsed.data);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Update profile error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // POST /api/profile/password - Change password (auth)
  fastify.post(
    '/api/profile/password',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = changePasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return reply.code(400).send({
          success: false,
          error: firstError.message,
        });
      }

      try {
        const userId = request.user.userId;
        const { currentPassword, newPassword } = parsed.data;
        const data = await profileService.changePassword(fastify.prisma, userId, currentPassword, newPassword);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Change password error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/profile/bets - Bet history (auth)
  fastify.get(
    '/api/profile/bets',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = betQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: '잘못된 조회 파라미터입니다',
        });
      }

      try {
        const userId = request.user.userId;
        const data = await profileService.getBetHistory(fastify.prisma, userId, parsed.data);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get bet history error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/profile/money-logs - Money history (auth)
  fastify.get(
    '/api/profile/money-logs',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = moneyQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: '잘못된 조회 파라미터입니다',
        });
      }

      try {
        const userId = request.user.userId;
        const data = await profileService.getMoneyHistory(fastify.prisma, userId, parsed.data);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get money history error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/profile/point-logs - Point history (auth)
  fastify.get(
    '/api/profile/point-logs',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = pointQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: '잘못된 조회 파라미터입니다',
        });
      }

      try {
        const userId = request.user.userId;
        const data = await profileService.getPointHistory(fastify.prisma, userId, parsed.data);
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

  // GET /api/profile/login-history - Login history (auth)
  fastify.get(
    '/api/profile/login-history',
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
        const data = await profileService.getLoginHistory(fastify.prisma, userId, page, limit);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get login history error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // ===== AFFILIATE =====

  // GET /api/affiliate/dashboard - Referral dashboard (auth)
  fastify.get(
    '/api/affiliate/dashboard',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await profileService.getReferralDashboard(fastify.prisma, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get referral dashboard error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/affiliate/members - Referral members (auth)
  fastify.get(
    '/api/affiliate/members',
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
        const data = await profileService.getReferralMembers(fastify.prisma, userId, page, limit);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get referral members error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/affiliate/commissions - Commission history (auth)
  fastify.get(
    '/api/affiliate/commissions',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = commissionQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: '잘못된 조회 파라미터입니다',
        });
      }

      try {
        const userId = request.user.userId;
        const data = await profileService.getCommissionHistory(fastify.prisma, userId, parsed.data);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get commission history error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/affiliate/rates - Rolling rates (auth)
  fastify.get(
    '/api/affiliate/rates',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await profileService.getRollingRates(fastify.prisma, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get rolling rates error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // ===== MESSAGES =====

  // GET /api/messages - Message list (auth)
  fastify.get(
    '/api/messages',
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
        const data = await profileService.getMessages(fastify.prisma, userId, page, limit);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get messages error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/messages/unread-count - Unread count (auth)
  fastify.get(
    '/api/messages/unread-count',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const data = await profileService.getUnreadCount(fastify.prisma, userId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get unread count error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/messages/:id - Message detail (auth)
  fastify.get(
    '/api/messages/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params as { id: string };
        const messageId = parseInt(id, 10);

        if (isNaN(messageId)) {
          return reply.code(400).send({
            success: false,
            error: '유효하지 않은 쪽지 ID입니다',
          });
        }

        const data = await profileService.getMessage(fastify.prisma, userId, messageId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get message error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // DELETE /api/messages/:id - Delete message (auth)
  fastify.delete(
    '/api/messages/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params as { id: string };
        const messageId = parseInt(id, 10);

        if (isNaN(messageId)) {
          return reply.code(400).send({
            success: false,
            error: '유효하지 않은 쪽지 ID입니다',
          });
        }

        const data = await profileService.deleteMessage(fastify.prisma, userId, messageId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Delete message error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // ===== INQUIRIES =====

  // GET /api/inquiries - Inquiry list (auth)
  fastify.get(
    '/api/inquiries',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = inquiryQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          error: '잘못된 조회 파라미터입니다',
        });
      }

      try {
        const userId = request.user.userId;
        const { page, limit, status } = parsed.data;
        const data = await profileService.getInquiries(fastify.prisma, userId, page, limit, status);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get inquiries error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // POST /api/inquiries - Create inquiry (auth)
  fastify.post(
    '/api/inquiries',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createInquirySchema.safeParse(request.body);
      if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return reply.code(400).send({
          success: false,
          error: firstError.message,
        });
      }

      try {
        const userId = request.user.userId;
        const { title, content } = parsed.data;
        const data = await profileService.createInquiry(fastify.prisma, userId, title, content);
        return reply.code(201).send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Create inquiry error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );

  // GET /api/inquiries/:id - Inquiry detail + replies (auth)
  fastify.get(
    '/api/inquiries/:id',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params as { id: string };
        const inquiryId = parseInt(id, 10);

        if (isNaN(inquiryId)) {
          return reply.code(400).send({
            success: false,
            error: '유효하지 않은 문의 ID입니다',
          });
        }

        const data = await profileService.getInquiry(fastify.prisma, userId, inquiryId);
        return reply.send({ success: true, data });
      } catch (err: any) {
        const statusCode = err.statusCode || 500;
        if (statusCode >= 500) {
          fastify.log.error(err, 'Get inquiry error');
        }
        return reply.code(statusCode).send({
          success: false,
          error: err.message || '서버 오류가 발생했습니다',
        });
      }
    },
  );
}
