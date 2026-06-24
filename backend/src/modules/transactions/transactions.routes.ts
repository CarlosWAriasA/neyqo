import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import { requireAuth, validationError } from '../shared/route-helpers';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionParamsSchema,
  updateTransactionSchema,
} from './transactions.schemas';
import type { TransactionsService } from './transactions.service';

export const buildTransactionsRoutes =
  (transactionsService: TransactionsService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', requireAuth(authService));

    app.get('/', async (request, reply) => {
      const parsed = listTransactionsQuerySchema.safeParse(request.query);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Filtros de transacciones inválidos.', parsed.error.flatten().fieldErrors));
      }

      try {
        const transactions = await transactionsService.list(request.authUser!.id, parsed.data);
        return reply.code(200).send(transactions);
      } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_CURSOR') {
          return reply.code(400).send(validationError('Cursor de transacciones inválido.'));
        }

        throw error;
      }
    });

    app.post('/', async (request, reply) => {
      const parsed = createTransactionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de transacción inválidos.', parsed.error.flatten().fieldErrors));
      }

      const transaction = await transactionsService.create(request.authUser!.id, parsed.data);
      return reply.code(201).send({ transaction });
    });

    app.get('/:id', async (request, reply) => {
      const params = transactionParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de transacción inválido.'));
      }

      const transaction = await transactionsService.getById(request.authUser!.id, params.data.id);
      return reply.code(200).send({ transaction });
    });

    app.patch('/:id', async (request, reply) => {
      const params = transactionParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de transacción inválido.'));
      }

      const parsed = updateTransactionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de transacción inválidos.', parsed.error.flatten().fieldErrors));
      }

      const transaction = await transactionsService.update(request.authUser!.id, params.data.id, parsed.data);
      return reply.code(200).send({ transaction });
    });

    app.delete('/:id', async (request, reply) => {
      const params = transactionParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de transacción inválido.'));
      }

      await transactionsService.delete(request.authUser!.id, params.data.id);
      return reply.code(204).send();
    });
  };
