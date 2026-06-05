import { RefreshCw } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';

export function SyncPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Sincronización"
        description="La conexión con Gmail y Outlook todavía no está disponible."
      />

      <EmptyState
        icon={RefreshCw}
        title="Sincronización próximamente"
        description="Estamos preparando esta sección para conectar correos y detectar movimientos de forma segura. Por ahora puedes registrar tus movimientos manualmente."
      />
    </div>
  );
}
