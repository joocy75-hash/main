import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.ip;
    },
    errorResponseBuilder: () => {
      return {
        success: false,
        error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      };
    },
  });
});

// Route-level rate limit configs
export const authRateLimit = { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } };
export const publicApiRateLimit = { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } };
