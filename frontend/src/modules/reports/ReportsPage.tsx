import { useQuery } from '@tanstack/react-query';
import { BarChart3, CalendarDays, PieChart, TrendingUp } from 'lucide-react';
import { getBudgets, getTransactions } from '../../api/financial';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { formatCurrency } from '../../utils/format';

export function ReportsPage() {
  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });
  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: getBudgets });
  const activeBudgets = (budgetsQuery.data ?? []).filter((budget) => budget.recordStatus === 'active');
  const expenses = (transactionsQuery.data ?? [])
    .filter((transaction) => transaction.status === 'completed' && transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const income = (transactionsQuery.data ?? [])
    .filter((transaction) => transaction.status === 'completed' && transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Reportes"
        description="Espacios preparados para gráficos de gastos por categoría, cuenta, periodo y evolución mensual."
      />

      <Card className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px]">
        <Select aria-label="Tipo de reporte">
          <option>Ingresos frente a gastos</option>
          <option>Gastos por categoría</option>
          <option>Gastos por cuenta</option>
          <option>Balance por periodo</option>
        </Select>
        <Input type="date" aria-label="Desde" />
        <Input type="date" aria-label="Hasta" />
        <Select aria-label="Cuenta">
          <option>Todas las cuentas</option>
        </Select>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-subtle">Ingresos</p>
          <p className="mt-2 text-2xl font-semibold text-positive">{formatCurrency(income)}</p>
        </Card>
        <Card>
          <p className="text-sm text-subtle">Gastos</p>
          <p className="mt-2 text-2xl font-semibold text-danger">{formatCurrency(expenses)}</p>
        </Card>
        <Card>
          <p className="text-sm text-subtle">Presupuestos activos</p>
          <p className="mt-2 text-2xl font-semibold text-text">{activeBudgets.length}</p>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="min-h-96">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-text">Evolución mensual</h2>
              <p className="text-sm text-subtle">Área reservada para gráfica temporal.</p>
            </div>
          </div>
          <div className="mt-8 flex h-64 items-end gap-3">
            {[45, 72, 54, 83, 68, 91].map((height, index) => (
              <div key={height} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-panel bg-primary/80" style={{ height: `${height}%` }} />
                <span className="text-xs text-subtle">M{index + 1}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="grid gap-4">
          <Card>
            <PieChart className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-text">Gastos por categoría</h2>
            <p className="mt-2 text-sm leading-6 text-subtle">
              Aquí se conectará la distribución de gasto cuando existan endpoints financieros.
            </p>
          </Card>
          <Card>
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-text">Balance por periodo</h2>
            <p className="mt-2 text-sm leading-6 text-subtle">
              Preparado para comparar ingresos, gastos y saldo acumulado por rango.
            </p>
          </Card>
          <Card>
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-text">Historial filtrable</h2>
            <p className="mt-2 text-sm leading-6 text-subtle">
              Los filtros superiores serán la base del historial por fechas.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
