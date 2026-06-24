import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import {
  categoryParamsSchema,
  createCategorySchema,
  updateCategorySchema,
} from './categories.schemas';
import type { CategoriesService } from './categories.service';
import { requireAuth, validationError } from '../shared/route-helpers';

export const buildCategoriesRoutes =
  (categoriesService: CategoriesService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', requireAuth(authService));

    app.get('/', async (request, reply) => {
      const categories = await categoriesService.list(request.authUser!.id);
      return reply.code(200).send({ categories });
    });

    app.post('/', async (request, reply) => {
      const parsed = createCategorySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de categoría inválidos.', parsed.error.flatten().fieldErrors));
      }

      const category = await categoriesService.create(request.authUser!.id, parsed.data);
      return reply.code(201).send({ category });
    });

    app.patch('/:id', async (request, reply) => {
      const params = categoryParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de categoría inválido.'));
      }

      const parsed = updateCategorySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de categoría inválidos.', parsed.error.flatten().fieldErrors));
      }

      const category = await categoriesService.update(request.authUser!.id, params.data.id, parsed.data);
      return reply.code(200).send({ category });
    });

    app.patch('/:id/deactivate', async (request, reply) => {
      const params = categoryParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de categoría inválido.'));
      }

      const category = await categoriesService.deactivate(request.authUser!.id, params.data.id);
      return reply.code(200).send({ category });
    });

    app.patch('/:id/reactivate', async (request, reply) => {
      const params = categoryParamsSchema.safeParse(request.params);

      if (!params.success) {
        return reply.code(400).send(validationError('Identificador de categoría inválido.'));
      }

      const category = await categoriesService.reactivate(request.authUser!.id, params.data.id);
      return reply.code(200).send({ category });
    });
  };
