import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Chrome, Landmark, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { getEmailSyncRuns, getExternalConnections } from '../../api/financial';
import { EmptyState } from '../../components/common/EmptyState';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { env } from '../../config/env';

const providerCopy = {
  gmail: {
    label: 'Gmail',
    icon: Chrome,
    description: 'Preparado para Gmail API con consentimiento OAuth separado.',
  },
  outlook: {
    label: 'Outlook',
    icon: Landmark,
    description: 'Preparado para Microsoft Graph con consentimiento incremental.',
  },
};

export function SyncPage() {
  const connectionsQuery = useQuery({ queryKey: ['external-connections'], queryFn: getExternalConnections });
  const runsQuery = useQuery({ queryKey: ['email-sync-runs'], queryFn: getEmailSyncRuns });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Sincronización"
        description="Conecta una cuenta de correo solo cuando quieras automatizar consumos enviados por bancos o emisores."
        actions={
          <Button variant="secondary" disabled={!env.emailSyncEnabled}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Sincronizar ahora
          </Button>
        }
      />

      <Card className="border-info/20 bg-info/5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-info" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-text">Privacidad primero</h2>
            <p className="mt-1 text-sm leading-6 text-subtle">
              Iniciar sesión con Google o Microsoft no pide lectura de correos. Ese permiso se solicitará
              únicamente desde esta sección, con consentimiento explícito y revocación disponible.
            </p>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        {(connectionsQuery.data ?? []).map((connection) => {
          const copy = providerCopy[connection.provider];
          const Icon = copy.icon;

          return (
            <Card key={connection.id} className="grid gap-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-panel bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-semibold text-text">{copy.label}</h2>
                    <p className="mt-1 text-sm leading-6 text-subtle">{copy.description}</p>
                  </div>
                </div>
                <Badge tone={connection.status === 'connected' ? 'income' : 'warning'}>
                  {connection.status === 'connected' ? 'Conectado' : 'En preparación'}
                </Badge>
              </div>
              <div className="grid gap-2 rounded-panel bg-muted p-4 text-sm">
                <p className="text-subtle">Última sincronización</p>
                <p className="font-medium text-text">{connection.lastSyncAt ?? 'Todavía no disponible'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={!env.emailSyncEnabled}>Conectar</Button>
                <Button variant="secondary" disabled>
                  Desconectar
                </Button>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-text">Tokens separados y cifrados</h2>
          <p className="mt-2 text-sm leading-6 text-subtle">
            Los tokens de Gmail u Outlook no deben mezclarse con los tokens internos de Neyqo. La
            arquitectura futura debe cifrarlos en reposo y permitir revocación por proveedor.
          </p>
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-text">Movimientos detectados</h2>
              <p className="text-sm text-subtle">Espacio reservado para revisión manual antes de importar.</p>
            </div>
            <Badge tone="warning">Placeholder</Badge>
          </div>
          {(runsQuery.data ?? []).length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No hay sincronizaciones todavía"
              description="Cuando exista la integración real, aquí aparecerán correos procesados, movimientos detectados y errores."
            />
          ) : null}
        </Card>
      </section>
    </div>
  );
}
