import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth-service.js';
import { authRateLimit } from '../middleware/rate-limit.js';
import { config } from '../config.js';

const COOKIE_BASE = {
  httpOnly: config.cookie.httpOnly,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: '/',
} as const;

function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  reply.setCookie('accessToken', accessToken, {
    ...COOKIE_BASE,
    maxAge: 15 * 60, // 15 minutes
  });
  reply.setCookie('refreshToken', refreshToken, {
    ...COOKIE_BASE,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie('accessToken', { path: '/' });
  reply.clearCookie('refreshToken', { path: '/api/auth' });
}

const registerSchema = z.object({
  username: z
    .string()
    .regex(/^[a-z0-9]{4,20}$/, '아이디는 영문 소문자와 숫자 4~20자로 입력해주세요'),
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상 입력해주세요')
    .max(20, '닉네임은 20자 이하로 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(/[a-zA-Z]/, '비밀번호에 영문자를 포함해주세요')
    .regex(/[0-9]/, '비밀번호에 숫자를 포함해주세요'),
  phone: z
    .string()
    .regex(/^01[0-9]{8,9}$/, '올바른 휴대폰 번호를 입력해주세요'),
  referrerCode: z
    .string()
    .min(1, '추천코드를 입력해주세요'),
});

const loginSchema = z.object({
  username: z.string().min(1, '아이디를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export default async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify);

  // POST /api/auth/register - rate limited to 5/min
  fastify.post('/api/auth/register', authRateLimit, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return reply.code(400).send({
        success: false,
        error: firstError.message,
      });
    }

    try {
      const result = await authService.register(parsed.data);
      setAuthCookies(reply, result.accessToken, result.refreshToken);
      return reply.code(201).send({
        success: true,
        data: { user: result.user },
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const message = err.message || '서버 오류가 발생했습니다';
      fastify.log.error(err, 'Register error');
      return reply.code(statusCode).send({
        success: false,
        error: message,
      });
    }
  });

  // POST /api/auth/login - rate limited to 5/min
  fastify.post('/api/auth/login', authRateLimit, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return reply.code(400).send({
        success: false,
        error: firstError.message,
      });
    }

    try {
      const result = await authService.login({
        username: parsed.data.username,
        password: parsed.data.password,
        ip: request.ip,
        userAgent: request.headers['user-agent'] || '',
      });
      setAuthCookies(reply, result.accessToken, result.refreshToken);
      return reply.code(200).send({
        success: true,
        data: { user: result.user },
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const message = err.message || '서버 오류가 발생했습니다';
      if (statusCode >= 500) {
        fastify.log.error(err, 'Login error');
      }
      return reply.code(statusCode).send({
        success: false,
        error: message,
      });
    }
  });

  // POST /api/auth/refresh - read refreshToken from cookie or body
  fastify.post('/api/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = (request.cookies as Record<string, string>)?.refreshToken ||
                         ((request.body as any)?.refreshToken as string) || '';

    if (!refreshToken) {
      return reply.code(400).send({
        success: false,
        error: '리프레시 토큰이 필요합니다',
      });
    }

    try {
      const result = await authService.refresh(refreshToken);
      setAuthCookies(reply, result.accessToken, result.refreshToken);
      return reply.code(200).send({
        success: true,
        data: {},
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const message = err.message || '서버 오류가 발생했습니다';
      if (statusCode >= 500) {
        fastify.log.error(err, 'Refresh error');
      }
      clearAuthCookies(reply);
      return reply.code(statusCode).send({
        success: false,
        error: message,
      });
    }
  });

  // POST /api/auth/logout
  fastify.post(
    '/api/auth/logout',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = logoutSchema.safeParse(request.body);
      const cookies = request.cookies as Record<string, string> | undefined;

      const accessToken = request.headers.authorization?.replace('Bearer ', '') ||
                          cookies?.accessToken || '';
      const refreshToken = cookies?.refreshToken ||
                           (parsed.success ? (parsed.data.refreshToken || '') : '');

      try {
        await authService.logout(accessToken, refreshToken);
        clearAuthCookies(reply);
        return reply.code(200).send({
          success: true,
          data: { message: '로그아웃 되었습니다' },
        });
      } catch (err: any) {
        fastify.log.error(err, 'Logout error');
        clearAuthCookies(reply);
        return reply.code(500).send({
          success: false,
          error: '서버 오류가 발생했습니다',
        });
      }
    },
  );
}
