import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import { requireAuth, validationError } from '../shared/route-helpers';
import { updateUserPreferencesSchema } from './preferences.schemas';
import type { PreferencesService } from './preferences.service';

export const buildPreferencesRoutes =
  (preferencesService: PreferencesService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', requireAuth(authService));

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
