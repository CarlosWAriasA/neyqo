import type { FastifyPluginAsync } from 'fastify';
import type { AuthService } from '../auth/auth.service';
import { requireAuth, validationError } from '../shared/route-helpers';
import { exchangeRateQuoteSchema } from './exchange-rates.schemas';
import { ExchangeRatesError, type ExchangeRatesService } from './exchange-rates.service';

export const buildExchangeRatesRoutes =
  (exchangeRatesService: ExchangeRatesService, authService: AuthService): FastifyPluginAsync =>
  async (app) => {
    app.addHook('preHandler', requireAuth(authService));

    app.get('/quote', async (request, reply) => {
      const parsed = exchangeRateQuoteSchema.safeParse(request.query);

      if (!parsed.success) {
        return reply
          .code(400)
          .send(validationError('Consulta de moneda inválida.', parsed.error.flatten().fieldErrors));
      }

      try {
        const quote = await exchangeRatesService.quote(parsed.data);
        return reply.code(200).send({ quote });
      } catch (error) {
        if (error instanceof ExchangeRatesError) {
          return reply.code(error.statusCode).send({ message: error.message });
        }

        throw error;
      }
    });
  };
