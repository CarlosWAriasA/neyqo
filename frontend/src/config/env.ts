import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().optional().default('/api'),
  VITE_APP_NAME: z.string().optional().default('Neyqo'),
  VITE_GOOGLE_AUTH_ENABLED: z.enum(['true', 'false']).optional().default('false'),
  VITE_MICROSOFT_AUTH_ENABLED: z.enum(['true', 'false']).optional().default('false'),
  VITE_EMAIL_SYNC_ENABLED: z.enum(['true', 'false']).optional().default('false'),
});

const parsedEnv = envSchema.parse(import.meta.env);

export const env = {
  apiBaseUrl: parsedEnv.VITE_API_BASE_URL.trim() || '/api',
  appName: parsedEnv.VITE_APP_NAME.trim() || 'Neyqo',
  googleAuthEnabled: parsedEnv.VITE_GOOGLE_AUTH_ENABLED === 'true',
  microsoftAuthEnabled: parsedEnv.VITE_MICROSOFT_AUTH_ENABLED === 'true',
  emailSyncEnabled: parsedEnv.VITE_EMAIL_SYNC_ENABLED === 'true',
} as const;
