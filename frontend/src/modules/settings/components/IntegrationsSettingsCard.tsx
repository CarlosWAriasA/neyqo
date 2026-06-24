import { MailCheck, RefreshCw, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';

const integrationRows = [
  {
    title: 'Conexiones de correo',
    description: 'Gmail y Outlook para importar movimientos.',
    icon: MailCheck,
  },
  {
    title: 'Reglas de importación',
    description: 'Bancos, tarjetas, cuentas y categorías.',
    icon: Settings2,
  },
  {
    title: 'Sincronización manual',
    description: 'Actualiza tus movimientos cuando lo necesites.',
    icon: RefreshCw,
  },
];

export function IntegrationsSettingsCard() {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MailCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-text">Integraciones</h2>
        </div>
        <Link
          to="/app/sync"
          className="inline-flex h-9 items-center justify-center rounded-panel border border-border bg-surface px-3 text-sm font-medium text-text transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-10 sm:px-4"
        >
          Gestionar
        </Link>
      </div>
      <div className="mt-5 grid gap-3">
        {integrationRows.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="flex items-start justify-between gap-3 rounded-panel border border-border bg-muted/30 p-4">
              <span className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-text">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-subtle">{item.description}</span>
                </span>
              </span>
              <Badge tone="neutral">Activo</Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
