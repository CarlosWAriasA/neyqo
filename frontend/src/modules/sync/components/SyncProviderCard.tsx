import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import type { syncProviders } from '../sync.constants';

type SyncProvider = (typeof syncProviders)[number];

interface SyncProviderCardProps {
  provider: SyncProvider;
}

export function SyncProviderCard({ provider }: SyncProviderCardProps) {
  const Icon = provider.icon;

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
        <Badge tone="neutral">Próximamente</Badge>
      </div>
    </Card>
  );
}
