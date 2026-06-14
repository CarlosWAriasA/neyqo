import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Escribe un correo válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Escribe tu nombre.'),
    email: z.string().email('Escribe un correo válido.'),
    password: z.string().min(8, 'Usa al menos 8 caracteres.'),
    confirmPassword: z.string().min(8, 'Confirma tu contraseña.'),
    acceptedTerms: z.literal(true, {
      error: 'Debes aceptar términos y privacidad.',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Escribe un correo válido.'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Escribe un correo válido.'),
  code: z.string().min(6, 'Escribe el código recibido.'),
  password: z.string().min(8, 'Usa al menos 8 caracteres.'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
