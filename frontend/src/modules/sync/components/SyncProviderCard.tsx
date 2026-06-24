import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import type { ExternalConnection } from '../../../types/financial';
import type { syncProviders } from '../sync.constants';

type SyncProvider = (typeof syncProviders)[number];

interface SyncProviderCardProps {
  provider: SyncProvider;
  connection?: ExternalConnection;
  connecting: boolean;
  onConnect: () => void;
}

export function SyncProviderCard({ provider, connection, connecting, onConnect }: SyncProviderCardProps) {
  const Icon = provider.icon;
  const connected = connection?.status === 'connected';

  return (
    <Card className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-text">{provider.name}</h2>
            <p className="mt-1 text-sm leading-6 text-subtle">{provider.description}</p>
          </div>
        </div>
        <Badge tone={connected ? 'income' : 'neutral'}>{connected ? 'Conectado' : 'Sin conectar'}</Badge>
      </div>
      {connection ? <p className="truncate text-sm font-medium text-text">{connection.email}</p> : null}
      <Button type="button" variant={connected ? 'secondary' : 'primary'} onClick={onConnect} disabled={connecting}>
        {connecting ? 'Conectando...' : connected ? 'Actualizar conexión' : 'Conectar correo'}
      </Button>
    </Card>
  );
}
