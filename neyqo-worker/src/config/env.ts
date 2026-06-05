import 'dotenv/config';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3010),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio.'),
  DB_SSL: z.enum(['true', 'false']).default('false'),
  WORKER_ENABLED: z.enum(['true', 'false']).default('true'),
  WORKER_INSTANCE_ID: z.string().optional().default(''),
  NEYQO_API_BASE_URL: z.string().url().default('http://localhost:3000'),
  INTERNAL_SERVICE_SECRET: z.string().optional().default(''),
  SCHEDULED_TRANSACTIONS_JOB_ENABLED: z.enum(['true', 'false']).default('true'),
  SCHEDULED_TRANSACTIONS_INTERVAL_MINUTES: z.coerce.number().int().min(1).default(10),
  SCHEDULED_TRANSACTIONS_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(100),
  SCHEDULED_TRANSACTIONS_MAX_CATCH_UP_PER_RECORD: z.coerce.number().int().min(1).max(500).default(100),
  SCHEDULED_TRANSACTIONS_LOCK_TTL_SECONDS: z.coerce.number().int().min(10).default(120),
  EMAIL_SYNC_JOB_ENABLED: z.enum(['true', 'false']).default('false'),
  EMAIL_SYNC_INTERVAL_MINUTES: z.coerce.number().int().min(1).default(10),
  EMAIL_SYNC_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(50),
  JOB_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  JOB_RETRY_DELAY_SECONDS: z.coerce.number().int().min(0).max(300).default(30),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Configuración inválida del worker:\n${parsedEnv.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')}`,
  );
}

const rawEnv = parsedEnv.data;

export const env = {
  nodeEnv: rawEnv.NODE_ENV,
  port: rawEnv.PORT,
  databaseUrl: rawEnv.DATABASE_URL.trim(),
  dbSsl: rawEnv.DB_SSL === 'true',
  workerEnabled: rawEnv.WORKER_ENABLED === 'true',
  workerInstanceId: rawEnv.WORKER_INSTANCE_ID.trim() || `neyqo-worker-${randomUUID()}`,
  neyqoApiBaseUrl: rawEnv.NEYQO_API_BASE_URL.replace(/\/+$/, ''),
  internalServiceSecret: rawEnv.INTERNAL_SERVICE_SECRET.trim(),
  scheduledTransactions: {
    enabled: rawEnv.SCHEDULED_TRANSACTIONS_JOB_ENABLED === 'true',
    intervalMs: rawEnv.SCHEDULED_TRANSACTIONS_INTERVAL_MINUTES * 60_000,
    batchSize: rawEnv.SCHEDULED_TRANSACTIONS_BATCH_SIZE,
    maxCatchUpPerRecord: rawEnv.SCHEDULED_TRANSACTIONS_MAX_CATCH_UP_PER_RECORD,
    lockTtlMs: rawEnv.SCHEDULED_TRANSACTIONS_LOCK_TTL_SECONDS * 1000,
  },
  emailSync: {
    enabled: rawEnv.EMAIL_SYNC_JOB_ENABLED === 'true',
    intervalMs: rawEnv.EMAIL_SYNC_INTERVAL_MINUTES * 60_000,
    batchSize: rawEnv.EMAIL_SYNC_BATCH_SIZE,
  },
  retries: {
    maxRetries: rawEnv.JOB_MAX_RETRIES,
    retryDelayMs: rawEnv.JOB_RETRY_DELAY_SECONDS * 1000,
  },
} as const;
