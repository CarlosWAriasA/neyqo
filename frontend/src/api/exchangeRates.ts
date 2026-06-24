import type { CurrencyCode } from '../types/financial';
import { apiClient } from './client';

export interface ExchangeRateQuote {
  base: CurrencyCode;
  quote: CurrencyCode;
  amount: number;
  rate: number;
  inverseRate: number;
  convertedAmount: number;
  date: string;
  source: 'frankfurter';
  sourceLabel: string;
  cached: boolean;
}

export interface ExchangeRateQuoteParams {
  base: CurrencyCode;
  quote: CurrencyCode;
  amount: number;
}

export async function getExchangeRateQuote(params: ExchangeRateQuoteParams) {
  const response = await apiClient.get<{ quote: ExchangeRateQuote }>('/exchange-rates/quote', {
    params,
  });

  return response.data.quote;
}
