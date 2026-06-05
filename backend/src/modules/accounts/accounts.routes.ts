import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import {
  accountParamsSchema,
  createAccountSchema,
  updateAccountSchema,
} from './accounts.schemas';
import type { AccountsService } from './accounts.service';

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return {
    message,
    errors: fieldErrors,
  };
}

export const buildAccountsRoutes =
  (accountsService: AccountsService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', async (request) => {
      const authorizationHeader = request.headers.authorization;
      const accessToken = authorizationHeader?.startsWith('Bearer ')
        ? authorizationHeader.slice(7)
        : undefined;

      request.authUser = await authService.getCurrentUser(accessToken);
    });

    app.get('/', async (request, reply) => {
      const accounts = await accountsService.list(request.authUser!.id);
      return reply.code(200).send({ accounts });
    });

    app.post('/', async (request, reply) => {
      const parsed = createAccountSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de cuenta inválidos.', parsed.error.flatten().fieldErrors));
      }

      const account = await accountsService.create(request.authUser!.id, parsed.data);
      return reply.code(201).send({ account });
    });

    app.get('/:id', async (request, reply) => {
      const params = accountParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de cuenta inválido.'));
      }

      const account = await accountsService.getById(request.authUser!.id, params.data.id);
      return reply.code(200).send({ account });
    });

    app.patch('/:id', async (request, reply) => {
      const params = accountParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de cuenta inválido.'));
      }

      const parsed = updateAccountSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de cuenta inválidos.', parsed.error.flatten().fieldErrors));
      }

      const account = await accountsService.update(request.authUser!.id, params.data.id, parsed.data);
      return reply.code(200).send({ account });
    });

    app.patch('/:id/deactivate', async (request, reply) => {
      const params = accountParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de cuenta inválido.'));
      }

      const account = await accountsService.deactivate(request.authUser!.id, params.data.id);
      return reply.code(200).send({ account });
    });

    app.patch('/:id/reactivate', async (request, reply) => {
      const params = accountParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de cuenta inválido.'));
      }

      const account = await accountsService.reactivate(request.authUser!.id, params.data.id);
      return reply.code(200).send({ account });
    });
  };
