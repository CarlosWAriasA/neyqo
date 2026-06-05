import { z } from 'zod';

export const categoryTypeSchema = z.enum(['income', 'expense']);

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Escribe un nombre claro.').max(90),
  type: categoryTypeSchema,
  icon: z.string().trim().min(2, 'Elige un icono.').max(40),
  priority: z.coerce.number().int().min(1).max(999).default(100),
  description: z.string().trim().max(240).optional(),
});

export const updateCategorySchema = createCategorySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Envía al menos un campo para actualizar.',
);

export const categoryParamsSchema = z.object({
  id: z.uuid(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
