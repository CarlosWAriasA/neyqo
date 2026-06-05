import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import { updateUserPreferencesSchema } from './preferences.schemas';
import type { PreferencesService } from './preferences.service';

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return {
    message,
    errors: fieldErrors,
  };
}

export const buildPreferencesRoutes =
  (preferencesService: PreferencesService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', async (request) => {
      const authorizationHeader = request.headers.authorization;
      const accessToken = authorizationHeader?.startsWith('Bearer ')
        ? authorizationHeader.slice(7)
        : undefined;

      request.authUser = await authService.getCurrentUser(accessToken);
    });

    app.get('/', async (request, reply) => {
      const preferences = await preferencesService.get(request.authUser!.id);
      return reply.code(200).send({ preferences });
    });

    app.patch('/', async (request, reply) => {
      const parsed = updateUserPreferencesSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Preferencias inválidas.', parsed.error.flatten().fieldErrors));
      }

      const preferences = await preferencesService.update(request.authUser!.id, parsed.data);
      return reply.code(200).send({ preferences });
    });
  };
