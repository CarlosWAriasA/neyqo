import { timingSafeEqual } from 'crypto';
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { env } from '../../config/env';
import type { AuthService } from '../auth/auth.service';

export function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return {
    message,
    errors: fieldErrors,
  };
}

export function requireAuth(authService: AuthService): preHandlerHookHandler {
  return async (request) => {
    const authorizationHeader = request.headers.authorization;
    const accessToken = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.slice(7)
      : undefined;

    request.authUser = await authService.getCurrentUser(accessToken);
  };
}

export function requireInternalServiceSecret(): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!env.internalServiceSecret) {
      return reply.code(503).send({
        message: 'Los endpoints internos no están configurados.',
      });
    }

    const receivedSecret = getHeaderValue(request.headers['x-internal-service-secret']);

    if (!secretMatches(receivedSecret)) {
      return reply.code(401).send({
        message: 'Solicitud interna no autorizada.',
      });
    }

    return undefined;
  };
}

function getHeaderValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function secretMatches(receivedSecret: string): boolean {
  if (!env.internalServiceSecret) {
    return false;
  }

  const expected = Buffer.from(env.internalServiceSecret);
  const received = Buffer.from(receivedSecret);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
