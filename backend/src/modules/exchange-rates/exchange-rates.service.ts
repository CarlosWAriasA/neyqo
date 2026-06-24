import { env } from '../../config/env';
import type { CurrencyCode } from '../../entities/account.entity';
import type { ExchangeRateQuoteInput, ExchangeRateQuoteResponse } from './exchange-rates.schemas';

interface FrankfurterRateResponse {
  date?: string;
  rate?: number;
}

interface CachedRate {
  rate: number;
  date: string;
  expiresAt: number;
}

export class ExchangeRatesError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const cacheTtlMs = 15 * 60 * 1000;
const requestTimeoutMs = 5_000;

export class ExchangeRatesService {
  private readonly cache = new Map<string, CachedRate>();

  async quote(input: ExchangeRateQuoteInput): Promise<ExchangeRateQuoteResponse> {
    if (input.base === input.quote) {
      return this.buildResponse(input, 1, new Date().toISOString().slice(0, 10), false);
    }

    const cacheKey = `${input.base}:${input.quote}`;
    const cachedRate = this.cache.get(cacheKey);

    if (cachedRate && cachedRate.expiresAt > Date.now()) {
      return this.buildResponse(input, cachedRate.rate, cachedRate.date, true);
    }

    const freshRate = await this.fetchRate(input.base, input.quote);
    this.cache.set(cacheKey, {
      rate: freshRate.rate,
      date: freshRate.date,
      expiresAt: Date.now() + cacheTtlMs,
    });

    return this.buildResponse(input, freshRate.rate, freshRate.date, false);
  }

  private async fetchRate(base: CurrencyCode, quote: CurrencyCode): Promise<{ rate: number; date: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const response = await fetch(`${env.exchangeRatesApiBaseUrl}/v2/rate/${base}/${quote}`, {
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ExchangeRatesError(502, 'No pudimos obtener la tasa de referencia.');
      }

      const data = (await response.json()) as FrankfurterRateResponse;

      if (!data.rate || !Number.isFinite(data.rate) || data.rate <= 0 || !data.date) {
        throw new ExchangeRatesError(502, 'La tasa de referencia no está disponible.');
      }

      return {
        rate: data.rate,
        date: data.date,
      };
    } catch (error) {
      if (error instanceof ExchangeRatesError) {
        throw error;
      }

      throw new ExchangeRatesError(502, 'No pudimos obtener la tasa de referencia.');
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildResponse(
    input: ExchangeRateQuoteInput,
    rate: number,
    date: string,
    cached: boolean,
  ): ExchangeRateQuoteResponse {
    return {
      base: input.base,
      quote: input.quote,
      amount: input.amount,
      rate: roundRate(rate),
      inverseRate: roundRate(1 / rate),
      convertedAmount: roundMoney(input.amount * rate),
      date,
      source: 'frankfurter',
      sourceLabel: 'Tasa de referencia',
      cached,
    };
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundRate(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
