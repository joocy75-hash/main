import { FastifyInstance } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  });

  fastify.get('/api', async () => {
    return {
      success: true,
      data: {
        message: 'User Page API v1.0.0',
      },
    };
  });
}
