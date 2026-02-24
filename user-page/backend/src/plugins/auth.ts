import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';
import { hashToken, JwtPayload } from '../utils/jwt.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyJwt, {
    secret: config.jwt.secret,
    sign: {
      algorithm: 'HS256',
    },
  });

  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const payload = request.user as JwtPayload;

      if (payload.type !== 'access') {
        return reply.code(401).send({
          success: false,
          error: '유효하지 않은 토큰입니다',
        });
      }

      // Always check token blacklist after successful jwtVerify
      const authHeader = request.headers.authorization;
      const token = authHeader?.replace('Bearer ', '') || '';
      const tokenHash = hashToken(token);
      const isBlacklisted = await fastify.redis.get(`bl:${tokenHash}`);
      if (isBlacklisted) {
        return reply.code(401).send({
          success: false,
          error: '만료된 토큰입니다',
        });
      }
    } catch {
      return reply.code(401).send({
        success: false,
        error: '인증이 필요합니다',
      });
    }
  };

  fastify.decorate('authenticate', authenticate);
});
