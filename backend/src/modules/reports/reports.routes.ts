import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import { requireAuth, validationError } from '../shared/route-helpers';
import { reportFiltersSchema } from './reports.schemas';
import type { ReportsService } from './reports.service';

export const buildReportsRoutes =
  (reportsService: ReportsService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', requireAuth(authService));

    app.get('/summary', async (request, reply) => {
      const parsed = reportFiltersSchema.safeParse(request.query);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Filtros de reportes inválidos.', parsed.error.flatten().fieldErrors));
      }

      const summary = await reportsService.summary(request.authUser!.id, parsed.data);
      return reply.code(200).send(summary);
    });

    app.get('/cashflow', async (request, reply) => {
      const parsed = reportFiltersSchema.safeParse(request.query);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Filtros de reportes inválidos.', parsed.error.flatten().fieldErrors));
      }

      const cashflow = await reportsService.cashflow(request.authUser!.id, parsed.data);
      return reply.code(200).send(cashflow);
    });

    app.get('/spending-by-category', async (request, reply) => {
      const parsed = reportFiltersSchema.safeParse(request.query);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Filtros de reportes inválidos.', parsed.error.flatten().fieldErrors));
      }

      const categories = await reportsService.spendingByCategory(request.authUser!.id, parsed.data);
      return reply.code(200).send(categories);
    });

    app.get('/spending-by-account', async (request, reply) => {
      const parsed = reportFiltersSchema.safeParse(request.query);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Filtros de reportes inválidos.', parsed.error.flatten().fieldErrors));
      }

      const accounts = await reportsService.spendingByAccount(request.authUser!.id, parsed.data);
      return reply.code(200).send(accounts);
    });

    app.get('/budget-performance', async (request, reply) => {
      const parsed = reportFiltersSchema.safeParse(request.query);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Filtros de reportes inválidos.', parsed.error.flatten().fieldErrors));
      }

      const budgets = await reportsService.budgetPerformance(request.authUser!.id, parsed.data);
      return reply.code(200).send(budgets);
    });
  };
