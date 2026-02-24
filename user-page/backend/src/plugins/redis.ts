import fp from 'fastify-plugin';
import fastifyRedis from '@fastify/redis';
import { FastifyInstance } from 'fastify';
import { config } from '../config.js';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyRedis, {
    url: config.redisUrl,
    closeClient: true,
  });

  fastify.log.info('Redis connected');
});
