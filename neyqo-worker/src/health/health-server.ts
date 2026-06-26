import { timingSafeEqual } from 'crypto';
import Fastify from 'fastify';
import { z } from 'zod';
import { env } from '../config/env';
import type { NeyqoApiClient } from '../clients/neyqo-api/neyqo-api-client';
import type { JobScheduler } from '../core/scheduler/scheduler';
import type { DataSource } from 'typeorm';

function getHeaderValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function secretMatches(receivedSecret: string): boolean {
  if (!env.internalServiceSecret) {
    return false;
  }

  const expected = Buffer.from(env.internalServiceSecret);
  const received = Buffer.from(receivedSecret);

  return expected.length === received.length && timingSafeEqual(expected, received);
}

const manualRunSchema = z.object({
  userId: z.uuid().optional(),
});

export function buildHealthServer(params: {
  dataSource: DataSource;
  apiClient: NeyqoApiClient;
  scheduler: JobScheduler;
}) {
  const app = Fastify({
    logger: env.nodeEnv !== 'test',
  });

  app.get('/health', async () => ({
    status: 'ok',
  }));

  app.get('/ready', async (request, reply) => {
    const checks = {
      database: false,
      api: false,
      configuration: Boolean(env.internalServiceSecret && env.neyqoApiBaseUrl),
    };

    try {
      await params.dataSource.query('SELECT 1');
      checks.database = true;
    } catch {
      checks.database = false;
    }

    try {
      checks.api = await params.apiClient.checkHealth();
    } catch {
      checks.api = false;
    }

    const ready = checks.database && checks.api && checks.configuration;
    return reply.code(ready ? 200 : 503).send({
      status: ready ? 'ready' : 'not_ready',
      checks,
    });
  });

  app.post('/internal/jobs/scheduled-transactions/run', async (request, reply) => {
    const receivedSecret = getHeaderValue(request.headers['x-internal-service-secret']);

    if (!secretMatches(receivedSecret)) {
      return reply.code(401).send({
        message: 'Solicitud interna no autorizada.',
      });
    }

    const parsed = manualRunSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Datos de ejecución inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await params.scheduler.runJob('scheduled-transactions', {
      triggeredBy: 'manual',
      userId: parsed.data.userId,
    });

    return reply.code(200).send({ result });
  });

  app.post('/internal/jobs/email-sync/run', async (request, reply) => {
    const receivedSecret = getHeaderValue(request.headers['x-internal-service-secret']);

    if (!secretMatches(receivedSecret)) {
      return reply.code(401).send({
        message: 'Solicitud interna no autorizada.',
      });
    }

    const parsed = manualRunSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Datos de ejecución inválidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await params.scheduler.runJob('email-sync', {
      triggeredBy: 'manual',
      userId: parsed.data.userId,
    });

    return reply.code(200).send({ result });
  });

  return app;
}
