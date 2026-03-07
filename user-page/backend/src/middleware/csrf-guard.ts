import { FastifyRequest, FastifyReply } from 'fastify';

const CSRF_EXEMPT_PREFIXES = ['/api/webhooks'];

export async function csrfGuard(request: FastifyRequest, reply: FastifyReply) {
  const method = request.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (CSRF_EXEMPT_PREFIXES.some((p) => request.url.startsWith(p))) {
      return;
    }
    const xRequestedWith = request.headers['x-requested-with'];
    if (xRequestedWith !== 'XMLHttpRequest') {
      return reply.code(403).send({ error: 'CSRF 검증 실패' });
    }
  }
}
