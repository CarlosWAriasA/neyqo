import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CurrencyCode } from '../../../types/financial';
import { Card } from '../../../components/ui/card';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { formatCurrency } from '../../../utils/format';
import { chartColors, compactCurrency } from '../reports.utils';

interface RankedBarItem {
  name: string;
  amount: number;
  percentage: number;
  count: number;
}

interface RankedBarsCardProps {
  title: string;
  description: string;
  currency: CurrencyCode;
  items: RankedBarItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function RankedBarsCard({ title, description, currency, items, loading, error, onRetry }: RankedBarsCardProps) {
  const height = Math.max(220, items.length * 44);

  return (
    <Card className="grid gap-4 overflow-hidden">
      <div>
        <h2 className="text-base font-semibold text-text">{title}</h2>
        <p className="mt-1 text-sm text-subtle">{description}</p>
      </div>

      {error ? (
        <ErrorState title="No pudimos cargar esta sección" description="Reintenta para actualizar los datos." onRetry={onRetry} />
      ) : null}

      {!error && loading ? <div className="h-64 animate-pulse rounded-panel bg-muted" /> : null}

      {!error && !loading && items.length === 0 ? (
        <div className="rounded-panel border border-dashed border-border p-6 text-sm text-subtle">
          No hay gastos completados para este desglose.
        </div>
      ) : null}

      {!error && !loading && items.length > 0 ? (
        <div className="min-w-0" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items} layout="vertical" margin={{ top: 0, right: 16, left: 12, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.muted} strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => compactCurrency(Number(value), currency)}
                tick={{ fill: chartColors.subtle, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={116}
                tick={{ fill: chartColors.subtle, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value), currency), 'Gasto']}
                contentStyle={{
                  borderRadius: 8,
                  borderColor: chartColors.muted,
                  background: 'rgb(var(--color-surface))',
                  color: chartColors.text,
                }}
              />
              <Bar dataKey="amount" fill={chartColors.expenses} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </Card>
  );
}
