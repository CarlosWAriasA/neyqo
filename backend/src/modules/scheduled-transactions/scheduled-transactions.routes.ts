import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import { requireAuth, validationError } from '../shared/route-helpers';
import {
  createScheduledTransactionSchema,
  listGeneratedTransactionsQuerySchema,
  listScheduledTransactionsQuerySchema,
  scheduledTransactionParamsSchema,
  updateScheduledTransactionSchema,
} from './scheduled-transactions.schemas';
import type { ScheduledTransactionsService } from './scheduled-transactions.service';

export const buildScheduledTransactionsRoutes =
  (scheduledTransactionsService: ScheduledTransactionsService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', requireAuth(authService));

    app.get('/', async (request, reply) => {
      const parsed = listScheduledTransactionsQuerySchema.safeParse(request.query);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Filtros de programados inválidos.', parsed.error.flatten().fieldErrors));
      }

      try {
        const scheduledTransactions = await scheduledTransactionsService.list(request.authUser!.id, parsed.data);
        return reply.code(200).send(scheduledTransactions);
      } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_CURSOR') {
          return reply.code(400).send(validationError('Cursor de programados inválido.'));
        }

        throw error;
      }
    });

    app.get('/upcoming', async (request, reply) => {
      const upcoming = await scheduledTransactionsService.upcoming(request.authUser!.id);
      return reply.code(200).send({ upcoming });
    });

    app.get('/summary', async (request, reply) => {
      const summary = await scheduledTransactionsService.summary(request.authUser!.id);
      return reply.code(200).send({ summary });
    });

    app.post('/', async (request, reply) => {
      const parsed = createScheduledTransactionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de programado inválidos.', parsed.error.flatten().fieldErrors));
      }

      const scheduledTransaction = await scheduledTransactionsService.create(request.authUser!.id, parsed.data);
      return reply.code(201).send({ scheduledTransaction });
    });

    app.get('/:id', async (request, reply) => {
      const params = scheduledTransactionParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de programado inválido.'));
      }

      const scheduledTransaction = await scheduledTransactionsService.getById(request.authUser!.id, params.data.id);
      return reply.code(200).send({ scheduledTransaction });
    });

    app.get('/:id/generated-transactions', async (request, reply) => {
      const params = scheduledTransactionParamsSchema.safeParse(request.params);
      const query = listGeneratedTransactionsQuerySchema.safeParse(request.query);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de programado inválido.'));
      }

      if (!query.success) {
        return reply
          .code(400)
          .send(validationError('Filtros de transacciones generadas inválidos.', query.error.flatten().fieldErrors));
      }

      try {
        const transactions = await scheduledTransactionsService.generatedTransactions(
          request.authUser!.id,
          params.data.id,
          query.data,
        );
        return reply.code(200).send(transactions);
      } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_CURSOR') {
          return reply.code(400).send(validationError('Cursor de transacciones generadas inválido.'));
        }

        throw error;
      }
    });

    app.put('/:id', async (request, reply) => {
      const params = scheduledTransactionParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de programado inválido.'));
      }

      const parsed = updateScheduledTransactionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de programado inválidos.', parsed.error.flatten().fieldErrors));
      }

      const scheduledTransaction = await scheduledTransactionsService.update(
        request.authUser!.id,
        params.data.id,
        parsed.data,
      );
      return reply.code(200).send({ scheduledTransaction });
    });

    app.patch('/:id/pause', async (request, reply) => {
      const params = scheduledTransactionParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de programado inválido.'));
      }

      const scheduledTransaction = await scheduledTransactionsService.pause(request.authUser!.id, params.data.id);
      return reply.code(200).send({ scheduledTransaction });
    });

    app.patch('/:id/resume', async (request, reply) => {
      const params = scheduledTransactionParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de programado inválido.'));
      }

      const scheduledTransaction = await scheduledTransactionsService.resume(request.authUser!.id, params.data.id);
      return reply.code(200).send({ scheduledTransaction });
    });

    app.patch('/:id/deactivate', async (request, reply) => {
      const params = scheduledTransactionParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de programado inválido.'));
      }

      const scheduledTransaction = await scheduledTransactionsService.deactivate(request.authUser!.id, params.data.id);
      return reply.code(200).send({ scheduledTransaction });
    });
  };
