import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CashflowBucket } from '../../../api/reports';
import { Card } from '../../../components/ui/card';
import type { CurrencyCode } from '../../../types/financial';
import { formatCurrency } from '../../../utils/format';
import { chartColors, compactCurrency } from '../reports.utils';
import { ErrorState } from '../../../components/feedback/ErrorState';

interface CashflowChartCardProps {
  currency: CurrencyCode;
  buckets: CashflowBucket[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function CashflowChartCard({ currency, buckets, loading, error, onRetry }: CashflowChartCardProps) {
  const totalNet = buckets.reduce((total, bucket) => total + bucket.net, 0);

  return (
    <Card className="grid gap-4 overflow-hidden">
      <div>
        <h2 className="text-base font-semibold text-text">Flujo de efectivo</h2>
        <p className="mt-1 text-sm text-subtle">
          Ingresos, gastos y neto en {currency}. Neto del rango: {formatCurrency(totalNet, currency)}.
        </p>
      </div>

      {error ? (
        <ErrorState
          title="No pudimos cargar el flujo"
          description="Reintenta para actualizar esta gráfica."
          onRetry={onRetry}
        />
      ) : null}

      {!error && loading ? <div className="h-80 animate-pulse rounded-panel bg-muted" /> : null}

      {!error && !loading && buckets.length === 0 ? (
        <div className="rounded-panel border border-dashed border-border p-6 text-sm text-subtle">
          No hay ingresos o gastos completados para graficar en esta moneda.
        </div>
      ) : null}

      {!error && !loading && buckets.length > 0 ? (
        <div className="h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={buckets} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.muted} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: chartColors.subtle, fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value) => compactCurrency(Number(value), currency)}
                tick={{ fill: chartColors.subtle, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip
                formatter={(value, name) => [formatCurrency(Number(value), currency), labelForSeries(String(name))]}
                labelClassName="text-text"
                contentStyle={{
                  borderRadius: 8,
                  borderColor: chartColors.muted,
                  background: 'rgb(var(--color-surface))',
                  color: chartColors.text,
                }}
              />
              <Legend />
              <Bar dataKey="income" name="Ingresos" fill={chartColors.income} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Gastos" fill={chartColors.expenses} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="net" name="Neto" stroke={chartColors.net} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </Card>
  );
}

function labelForSeries(name: string) {
  return {
    income: 'Ingresos',
    expenses: 'Gastos',
    net: 'Neto',
  }[name] ?? name;
}
