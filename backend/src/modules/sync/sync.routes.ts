import { randomBytes } from 'crypto';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env';
import type { AuthService } from '../auth/auth.service';
import { requireAuth, validationError } from '../shared/route-helpers';
import {
  createImportRuleSchema,
  importedTransactionParamsSchema,
  importRuleParamsSchema,
  listImportedTransactionsQuerySchema,
  listImportRulesQuerySchema,
  updateImportedTransactionSchema,
  updateImportRuleSchema,
} from './sync.schemas';
import type { SyncService } from './sync.service';

interface SyncOAuthState {
  nonce: string;
  userId: string;
  returnTo?: string;
}

const syncOAuthStateCookieName = 'neyqo.sync-oauth-state';

function encodeSyncOAuthState(userId: string, returnTo: string | undefined) {
  const state: SyncOAuthState = {
    nonce: randomBytes(16).toString('hex'),
    userId,
    returnTo: sanitizeSyncReturnTo(returnTo),
  };

  return Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
}

function decodeSyncOAuthState(state: string | undefined): SyncOAuthState | undefined {
  if (!state) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as Partial<SyncOAuthState>;

    if (!parsed.nonce || !parsed.userId) {
      return undefined;
    }

    return {
      nonce: parsed.nonce,
      userId: parsed.userId,
      returnTo: sanitizeSyncReturnTo(parsed.returnTo),
    };
  } catch {
    return undefined;
  }
}

function sanitizeSyncReturnTo(returnTo: string | undefined) {
  if (!returnTo) {
    return undefined;
  }

  try {
    const url = new URL(returnTo);
    const allowedOrigins = new Set([env.frontendUrl, ...env.allowedOrigins].filter(Boolean));
    const allowedLocalhost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);

    return allowedOrigins.has(url.origin) || allowedLocalhost ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function syncRedirectUrl(returnTo: string | undefined, params: Record<string, string>) {
  const url = new URL(returnTo || `${env.frontendUrl || 'http://localhost:5173'}/app/sync`);

  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  return url.toString();
}

export const buildSyncRoutes =
  (syncService: SyncService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.get('/external-connections', { preHandler: requireAuth(authService) }, async (request, reply) => {
      const connections = await syncService.listExternalConnections(request.authUser!.id);
      return reply.code(200).send({ connections });
    });

    app.post('/oauth/:provider/start', { preHandler: requireAuth(authService) }, async (request, reply) => {
      const params = request.params as { provider?: string };

      if (params.provider !== 'gmail' && params.provider !== 'outlook') {
        return reply.code(400).send(validationError('Proveedor de correo inválido.'));
      }

      const query = request.query as { returnTo?: string };
      const state = encodeSyncOAuthState(request.authUser!.id, query.returnTo);
      const authUrl = syncService.buildMailOAuthUrl(request.authUser!.id, params.provider, state);

      reply.setCookie(syncOAuthStateCookieName, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.cookieSecure,
        path: '/api/sync/oauth',
        domain: env.cookieDomain,
        maxAge: 600,
      });

      return reply.code(200).send({ authUrl });
    });

    app.get('/oauth/:provider/callback', async (request, reply) => {
      const params = request.params as { provider?: string };

      if (params.provider !== 'gmail' && params.provider !== 'outlook') {
        return reply.redirect(syncRedirectUrl(undefined, { sync: 'error', reason: 'invalid_provider' }));
      }

      const query = request.query as { code?: string; state?: string; error?: string };
      const decodedState = decodeSyncOAuthState(query.state);
      const validState = Boolean(query.state && request.cookies[syncOAuthStateCookieName] === query.state && decodedState);

      reply.clearCookie(syncOAuthStateCookieName, {
        sameSite: 'lax',
        secure: env.cookieSecure,
        path: '/api/sync/oauth',
        domain: env.cookieDomain,
      });

      if (!validState || !decodedState) {
        return reply.redirect(syncRedirectUrl(undefined, { sync: 'error', reason: 'invalid_state', provider: params.provider }));
      }

      if (query.error || !query.code) {
        return reply.redirect(syncRedirectUrl(decodedState.returnTo, { sync: 'error', reason: 'access_denied', provider: params.provider }));
      }

      try {
        await syncService.completeMailOAuth(decodedState.userId, params.provider, query.code);
        return reply.redirect(syncRedirectUrl(decodedState.returnTo, { sync: 'connected', provider: params.provider }));
      } catch (error) {
        request.log.warn({ error }, 'Mail OAuth callback failed.');
        return reply.redirect(syncRedirectUrl(decodedState.returnTo, { sync: 'error', reason: 'callback_failed', provider: params.provider }));
      }
    });

    app.get('/import-rules', { preHandler: requireAuth(authService) }, async (request, reply) => {
      const parsed = listImportRulesQuerySchema.safeParse(request.query);

      if (!parsed.success) {
        return reply.code(400).send(validationError('Filtros de reglas inválidos.', parsed.error.flatten().fieldErrors));
      }

      const importRules = await syncService.listImportRules(request.authUser!.id, parsed.data);
      return reply.code(200).send({ importRules });
    });

    app.post('/import-rules', { preHandler: requireAuth(authService) }, async (request, reply) => {
      const parsed = createImportRuleSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send(validationError('Datos de regla inválidos.', parsed.error.flatten().fieldErrors));
      }

      const importRule = await syncService.createImportRule(request.authUser!.id, parsed.data);
      return reply.code(201).send({ importRule });
    });

    app.patch('/import-rules/:id', { preHandler: requireAuth(authService) }, async (request, reply) => {
      const params = importRuleParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de regla inválido.'));
      }

      const parsed = updateImportRuleSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send(validationError('Datos de regla inválidos.', parsed.error.flatten().fieldErrors));
      }

      const importRule = await syncService.updateImportRule(request.authUser!.id, params.data.id, parsed.data);
      return reply.code(200).send({ importRule });
    });

    app.get('/imported-transactions', { preHandler: requireAuth(authService) }, async (request, reply) => {
      const parsed = listImportedTransactionsQuerySchema.safeParse(request.query);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Filtros de transacciones detectadas inválidos.', parsed.error.flatten().fieldErrors));
      }

      try {
        const importedTransactions = await syncService.listImportedTransactions(request.authUser!.id, parsed.data);
        return reply.code(200).send(importedTransactions);
      } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_CURSOR') {
          return reply.code(400).send(validationError('Cursor de transacciones detectadas inválido.'));
        }

        throw error;
      }
    });

    app.patch('/imported-transactions/:id', { preHandler: requireAuth(authService) }, async (request, reply) => {
      const params = importedTransactionParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de transacción detectada inválido.'));
      }

      const parsed = updateImportedTransactionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de transacción detectada inválidos.', parsed.error.flatten().fieldErrors));
      }

      const importedTransaction = await syncService.updateImportedTransaction(
        request.authUser!.id,
        params.data.id,
        parsed.data,
      );
      return reply.code(200).send({ importedTransaction });
    });
  };
