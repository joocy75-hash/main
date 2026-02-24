import { FastifyRequest, FastifyReply } from 'fastify';

export const authGuard = async (request: FastifyRequest, reply: FastifyReply) => {
  await request.server.authenticate(request, reply);
};
