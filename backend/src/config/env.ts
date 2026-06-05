import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_URL: z.string().optional().default(''),
  FRONTEND_URL: z.string().optional().default(''),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio.'),
  DB_SSL: z.enum(['true', 'false']).default('false'),
  DB_SYNCHRONIZE: z.enum(['true', 'false']).default('true'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:4200'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres.'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres.'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('30m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  JWT_REFRESH_COOKIE_NAME: z.string().default('refresh_token'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_AUTH_REDIRECT_URI: z.string().optional().default(''),
  GOOGLE_GMAIL_REDIRECT_URI: z.string().optional().default(''),
  MICROSOFT_CLIENT_ID: z.string().optional().default(''),
  MICROSOFT_CLIENT_SECRET: z.string().optional().default(''),
  MICROSOFT_TENANT_ID: z.string().optional().default(''),
  MICROSOFT_AUTH_REDIRECT_URI: z.string().optional().default(''),
  MICROSOFT_MAIL_REDIRECT_URI: z.string().optional().default(''),
  EXTERNAL_TOKEN_ENCRYPTION_KEY: z.string().optional().default(''),
  INTERNAL_SERVICE_SECRET: z.string().optional().default(''),
  EMAIL_VERIFICATION_CODE_EXPIRES_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
  PASSWORD_RESET_CODE_EXPIRES_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM_EMAIL: z.string().optional().default(''),
  SMTP_FROM_NAME: z.string().optional().default('Luma Gate'),
  MAIL_DEV_LOG_CODES: z.enum(['true', 'false']).default('true'),
  FILE_LOGGING_ENABLED: z.enum(['true', 'false']).default('true'),
  LOG_DIR: z.string().optional().default('logs'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Configuración inválida del backend:\n${parsedEnv.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')}`,
  );
}

const rawEnv = parsedEnv.data;
const databaseUrl = rawEnv.DATABASE_URL.trim();
const databaseUrlRequiresSsl = /\bsslmode=(require|req|verify-ca|verify-full)\b/i.test(databaseUrl);
const cookieSameSite = rawEnv.COOKIE_SAME_SITE;
const smtpUser = rawEnv.SMTP_USER.trim();
const smtpFromEmail = rawEnv.SMTP_FROM_EMAIL.trim() || smtpUser;

export const env = {
  nodeEnv: rawEnv.NODE_ENV,
  port: rawEnv.PORT,
  appUrl: rawEnv.APP_URL.trim(),
  frontendUrl: rawEnv.FRONTEND_URL.trim(),
  databaseUrl,
  dbSsl: rawEnv.DB_SSL === 'true' || databaseUrlRequiresSsl,
  dbSynchronize: rawEnv.DB_SYNCHRONIZE === 'true',
  allowedOrigins: rawEnv.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtAccessSecret: rawEnv.JWT_ACCESS_SECRET,
  jwtRefreshSecret: rawEnv.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: rawEnv.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: rawEnv.JWT_REFRESH_EXPIRES_IN,
  jwtRefreshCookieName: rawEnv.JWT_REFRESH_COOKIE_NAME,
  cookieSecure: rawEnv.COOKIE_SECURE === 'true' || cookieSameSite === 'none',
  cookieSameSite,
  cookieDomain: rawEnv.COOKIE_DOMAIN.trim() || undefined,
  googleClientId: rawEnv.GOOGLE_CLIENT_ID.trim(),
  googleClientSecret: rawEnv.GOOGLE_CLIENT_SECRET.trim(),
  googleAuthRedirectUri: rawEnv.GOOGLE_AUTH_REDIRECT_URI.trim(),
  googleGmailRedirectUri: rawEnv.GOOGLE_GMAIL_REDIRECT_URI.trim(),
  microsoftClientId: rawEnv.MICROSOFT_CLIENT_ID.trim(),
  microsoftClientSecret: rawEnv.MICROSOFT_CLIENT_SECRET.trim(),
  microsoftTenantId: rawEnv.MICROSOFT_TENANT_ID.trim(),
  microsoftAuthRedirectUri: rawEnv.MICROSOFT_AUTH_REDIRECT_URI.trim(),
  microsoftMailRedirectUri: rawEnv.MICROSOFT_MAIL_REDIRECT_URI.trim(),
  externalTokenEncryptionKey: rawEnv.EXTERNAL_TOKEN_ENCRYPTION_KEY.trim(),
  internalServiceSecret: rawEnv.INTERNAL_SERVICE_SECRET.trim(),
  emailVerificationCodeExpiresMinutes: rawEnv.EMAIL_VERIFICATION_CODE_EXPIRES_MINUTES,
  passwordResetCodeExpiresMinutes: rawEnv.PASSWORD_RESET_CODE_EXPIRES_MINUTES,
  smtpHost: rawEnv.SMTP_HOST.trim(),
  smtpPort: rawEnv.SMTP_PORT,
  smtpSecure: rawEnv.SMTP_SECURE === 'true',
  smtpUser,
  smtpPass: rawEnv.SMTP_PASS,
  smtpFromEmail,
  smtpFromName: rawEnv.SMTP_FROM_NAME.trim() || 'Luma Gate',
  mailDevLogCodes: rawEnv.MAIL_DEV_LOG_CODES === 'true',
  fileLoggingEnabled: rawEnv.FILE_LOGGING_ENABLED === 'true',
  logDir: rawEnv.LOG_DIR.trim() || 'logs',
} as const;
