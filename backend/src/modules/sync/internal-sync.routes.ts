import type { FastifyPluginAsync } from 'fastify';
import { requireInternalServiceSecret, validationError } from '../shared/route-helpers';
import { createInternalImportedTransactionSchema } from './sync.schemas';
import type { SyncService } from './sync.service';

export const buildInternalSyncRoutes =
  (syncService: SyncService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', requireInternalServiceSecret());

    app.post('/email-sync/imported-transactions', async (request, reply) => {
      const parsed = createInternalImportedTransactionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de transacción detectada inválidos.', parsed.error.flatten().fieldErrors));
      }

      const result = await syncService.createInternalImportedTransaction(parsed.data);
      return reply.code(result.duplicate ? 200 : 201).send(result);
    });
  };
