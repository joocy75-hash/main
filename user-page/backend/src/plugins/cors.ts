import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';

export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: ['http://localhost:3002', 'http://localhost:3001'],
    credentials: true,
  });
});
