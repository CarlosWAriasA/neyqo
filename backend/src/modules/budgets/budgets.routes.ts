import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import { budgetParamsSchema, createBudgetSchema, updateBudgetSchema } from './budgets.schemas';
import type { BudgetsService } from './budgets.service';

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return {
    message,
    errors: fieldErrors,
  };
}

export const buildBudgetsRoutes =
  (budgetsService: BudgetsService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', async (request) => {
      const authorizationHeader = request.headers.authorization;
      const accessToken = authorizationHeader?.startsWith('Bearer ')
        ? authorizationHeader.slice(7)
        : undefined;

      request.authUser = await authService.getCurrentUser(accessToken);
    });

    app.get('/', async (request, reply) => {
      const budgets = await budgetsService.list(request.authUser!.id);
      return reply.code(200).send({ budgets });
    });

    app.post('/recommended', async (request, reply) => {
      const budgets = await budgetsService.createInitialBudgets(request.authUser!.id);
      return reply.code(201).send({ budgets });
    });

    app.get('/:id', async (request, reply) => {
      const params = budgetParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de presupuesto inválido.'));
      }

      const budget = await budgetsService.getById(request.authUser!.id, params.data.id);
      return reply.code(200).send({ budget });
    });

    app.get('/:id/periods', async (request, reply) => {
      const params = budgetParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de presupuesto inválido.'));
      }

      const periods = await budgetsService.getPeriodHistory(request.authUser!.id, params.data.id);
      return reply.code(200).send({ periods });
    });

    app.get('/:id/expenses', async (request, reply) => {
      const params = budgetParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de presupuesto inválido.'));
      }

      const expenses = await budgetsService.getCurrentExpenses(request.authUser!.id, params.data.id);
      return reply.code(200).send({ expenses });
    });

    app.post('/', async (request, reply) => {
      const parsed = createBudgetSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de presupuesto inválidos.', parsed.error.flatten().fieldErrors));
      }

      const budget = await budgetsService.create(request.authUser!.id, parsed.data);
      return reply.code(201).send({ budget });
    });

    app.patch('/:id', async (request, reply) => {
      const params = budgetParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de presupuesto inválido.'));
      }

      const parsed = updateBudgetSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de presupuesto inválidos.', parsed.error.flatten().fieldErrors));
      }

      const budget = await budgetsService.update(request.authUser!.id, params.data.id, parsed.data);
      return reply.code(200).send({ budget });
    });

    app.patch('/:id/deactivate', async (request, reply) => {
      const params = budgetParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de presupuesto inválido.'));
      }

      const budget = await budgetsService.deactivate(request.authUser!.id, params.data.id);
      return reply.code(200).send({ budget });
    });

    app.patch('/:id/reactivate', async (request, reply) => {
      const params = budgetParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de presupuesto inválido.'));
      }

      const budget = await budgetsService.reactivate(request.authUser!.id, params.data.id);
      return reply.code(200).send({ budget });
    });
  };
