import { Coins } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getExchangeRateQuote } from '../../../api/exchangeRates';
import type { UserPreferences } from '../../../config/userPreferences';
import { Field } from '../../../components/forms/Field';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { financeQueryKeys } from '../../../features/finance/queryKeys';
import type { CurrencyCode } from '../../../types/financial';

interface CurrencyCardProps {
  preferences: UserPreferences;
  onChange: <Key extends keyof UserPreferences>(key: Key, value: UserPreferences[Key]) => void;
}

const currencyOptions: Array<{ value: CurrencyCode; label: string }> = [
  { value: 'DOP', label: 'Peso dominicano' },
  { value: 'USD', label: 'Dólar estadounidense' },
  { value: 'EUR', label: 'Euro' },
];

export function CurrencyCard({ preferences, onChange }: CurrencyCardProps) {
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(preferences.primaryCurrency);
  const [quoteCurrency, setQuoteCurrency] = useState<CurrencyCode>(
    preferences.primaryCurrency === 'DOP' ? 'USD' : 'DOP',
  );
  const [amount, setAmount] = useState('100');
  const parsedAmount = useMemo(() => {
    const value = Number(amount);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [amount]);
  const quoteQuery = useQuery({
    queryKey: financeQueryKeys.exchangeRateQuote(baseCurrency, quoteCurrency, parsedAmount),
    queryFn: () => getExchangeRateQuote({ base: baseCurrency, quote: quoteCurrency, amount: parsedAmount }),
    enabled: parsedAmount > 0,
    staleTime: 15 * 60 * 1000,
  });
  const quote = quoteQuery.data;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Coins className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-text">Monedas</h2>
        </div>
        <Badge tone="neutral">Principal: {preferences.primaryCurrency}</Badge>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Moneda principal">
          <Select
            value={preferences.primaryCurrency}
            onChange={(event) => onChange('primaryCurrency', event.target.value as UserPreferences['primaryCurrency'])}
          >
            <option value="DOP">Peso dominicano</option>
            <option value="USD">Dólar estadounidense</option>
            <option value="EUR">Euro</option>
          </Select>
        </Field>
        <div className="rounded-panel border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-text">Resumen por moneda</p>
          <p className="mt-1 text-sm leading-6 text-subtle">DOP, USD y EUR se muestran con totales separados.</p>
        </div>
      </div>
      <div className="mt-5 rounded-panel border border-border bg-canvas/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-text">Tasa de referencia</p>
          <Badge tone="neutral">{quote?.date ?? 'Hoy'}</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr]">
          <Field label="Monto">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>
          <Field label="Desde">
            <Select value={baseCurrency} onChange={(event) => setBaseCurrency(event.target.value as CurrencyCode)}>
              {currencyOptions.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Hacia">
            <Select value={quoteCurrency} onChange={(event) => setQuoteCurrency(event.target.value as CurrencyCode)}>
              {currencyOptions.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="mt-4 rounded-panel bg-muted/40 p-4">
          {quoteQuery.isLoading ? (
            <p className="text-sm font-medium text-text">Consultando tasa...</p>
          ) : quoteQuery.isError ? (
            <p className="text-sm font-medium text-danger">Tasa no disponible.</p>
          ) : quote ? (
            <div className="grid gap-1">
              <p className="text-lg font-semibold text-text">
                {formatMoney(quote.amount, quote.base)} = {formatMoney(quote.convertedAmount, quote.quote)}
              </p>
              <p className="text-sm text-subtle">
                1 {quote.base} = {quote.rate} {quote.quote}
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-subtle">Ingresa un monto para consultar.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function formatMoney(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
