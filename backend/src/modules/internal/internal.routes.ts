import { timingSafeEqual } from 'crypto';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env';
import { createInternalTransactionSchema } from '../transactions/transactions.schemas';
import type { TransactionsService } from '../transactions/transactions.service';

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return {
    message,
    errors: fieldErrors,
  };
}

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

export const buildInternalRoutes =
  (transactionsService: TransactionsService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', async (request, reply) => {
      if (!env.internalServiceSecret) {
        return reply.code(503).send({
          message: 'Los endpoints internos no están configurados.',
        });
      }

      const receivedSecret = getHeaderValue(request.headers['x-internal-service-secret']);

      if (!secretMatches(receivedSecret)) {
        return reply.code(401).send({
          message: 'Solicitud interna no autorizada.',
        });
      }

      return undefined;
    });

    app.post('/transactions', async (request, reply) => {
      const parsed = createInternalTransactionSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Datos de transacción interna inválidos.', parsed.error.flatten().fieldErrors));
      }

      const result = await transactionsService.createInternal(parsed.data);
      return reply.code(result.duplicate ? 200 : 201).send(result);
    });
  };
