import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import {
  createTransactionSchema,
  transactionParamsSchema,
  updateTransactionSchema,
} from './transactions.schemas';
import type { TransactionsService } from './transactions.service';

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return {
    message,
    errors: fieldErrors,
  };
}

export const buildTransactionsRoutes =
  (transactionsService: TransactionsService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', async (request) => {
      const authorizationHeader = request.headers.authorization;
      const accessToken = authorizationHeader?.startsWith('Bearer ')
        ? authorizationHeader.slice(7)
        : undefined;

      request.authUser = await authService.getCurrentUser(accessToken);
    });

    app.get('/', async (request, reply) => {
      const transactions = await transactionsService.list(request.authUser!.id);
      return reply.code(200).send({ transactions });
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
