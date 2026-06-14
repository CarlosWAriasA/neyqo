import { RefreshCw } from 'lucide-react';
import { EmptyState } from '../../../components/common/EmptyState';

export function SyncComingSoon() {
  return (
    <EmptyState
      icon={RefreshCw}
      title="Sincronización próximamente"
      description="Estamos preparando esta sección para conectar correos y detectar movimientos de forma segura. Por ahora puedes registrar tus movimientos manualmente."
    />
  );
}
