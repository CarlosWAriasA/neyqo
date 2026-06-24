import type { FastifyPluginAsync } from 'fastify';
import { requireInternalServiceSecret, validationError } from '../shared/route-helpers';
import { createInternalTransactionSchema } from '../transactions/transactions.schemas';
import type { TransactionsService } from '../transactions/transactions.service';

export const buildInternalRoutes =
  (transactionsService: TransactionsService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', requireInternalServiceSecret());

    app.post('/transactions', async (request, reply) => {
      const parsed = createInternalTransactionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de transacción interna inválidos.', parsed.error.flatten().fieldErrors));
      }

      const result = await transactionsService.createInternal(parsed.data);
      return reply.code(result.duplicate ? 200 : 201).send(result);
    });
  };
