import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env';
import { logSecurityEvent } from '../utils/file-logger';

function isAllowedOrigin(origin: string) {
  if (env.allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(hostname);
  } catch {
    return false;
  }
}

export async function registerSecurity(app: FastifyInstance): Promise<void> {
  await app.register(cookie);

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  });

  await app.register(cors, {
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, isAllowedOrigin(origin));
    },
  });

  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: '1 minute',
  });

  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;

    if (origin && !isAllowedOrigin(origin)) {
      logSecurityEvent('http.origin.blocked', request, { origin });
      return reply.code(403).send({
        message: 'El origen de la petición no está permitido.',
      });
    }

    return undefined;
  });

  app.addHook('onSend', async (request, reply, payload) => {
    if (request.url.startsWith('/api') || request.url.startsWith('/internal')) {
      reply.header('Cache-Control', 'no-store');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');
    }

    return payload;
  });

  app.addHook('onResponse', async (request, reply) => {
    if (reply.statusCode === 429) {
      logSecurityEvent('http.rate_limit.exceeded', request, {
        route: request.routeOptions.url,
      });
    }
  });
}
