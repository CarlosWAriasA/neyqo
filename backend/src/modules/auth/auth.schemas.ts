import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'El correo es obligatorio.')
  .email('El correo no es válido.')
  .transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(4, 'El nombre debe tener al menos 4 caracteres.')
    .max(120, 'El nombre es demasiado largo.'),
  email: emailSchema,
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .max(72, 'La contraseña es demasiado larga.'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

export const googleLoginSchema = z.object({
  accessToken: z.string().trim().min(10, 'El token de Google es obligatorio.'),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'El codigo debe tener 6 digitos.'),
});

export const resendVerificationCodeSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'El codigo debe tener 6 digitos.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .max(72, 'La contraseña es demasiado larga.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationCodeInput = z.infer<typeof resendVerificationCodeSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
