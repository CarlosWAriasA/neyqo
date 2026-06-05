import { BarChart3 } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';

export function ReportsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Reportes"
        description="Los gráficos y análisis avanzados todavía no están disponibles."
      />

      <EmptyState
        icon={BarChart3}
        title="Reportes próximamente"
        description="Esta sección se habilitará cuando los reportes financieros estén listos. Mientras tanto, puedes revisar tus cuentas, movimientos, presupuestos y programados."
      />
    </div>
  );
}
