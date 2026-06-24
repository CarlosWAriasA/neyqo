import { Laptop, LogOut, MonitorSmartphone, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import type { AuthSessionDevice } from '../../../types/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Skeleton } from '../../../components/common/Skeleton';

interface SessionCardProps {
  sessions: AuthSessionDevice[];
  loading: boolean;
  pendingSessionId?: string;
  pendingAll: boolean;
  pendingOthers: boolean;
  onRefresh: () => void;
  onLogoutClick: () => void;
  onRevokeSession: (sessionId: string) => void;
  onRevokeOthers: () => void;
  onRevokeAll: () => void;
}

export function SessionCard({
  sessions,
  loading,
  pendingSessionId,
  pendingAll,
  pendingOthers,
  onRefresh,
  onLogoutClick,
  onRevokeSession,
  onRevokeOthers,
  onRevokeAll,
}: SessionCardProps) {
  const hasOtherSessions = sessions.some((session) => !session.current);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-text">Sesión y dispositivos</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Actualizar
        </Button>
      </div>

      <div className="mt-5 grid gap-3">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              pending={pendingSessionId === session.id}
              onRevoke={() => onRevokeSession(session.id)}
            />
          ))
        ) : (
          <div className="rounded-panel border border-border bg-muted/30 p-4 text-sm leading-6 text-subtle">
            No hay dispositivos activos para mostrar.
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" onClick={onRevokeOthers} disabled={!hasOtherSessions || pendingOthers || pendingAll}>
            {pendingOthers ? 'Cerrando...' : 'Cerrar otros dispositivos'}
          </Button>
          <Button variant="danger" onClick={onRevokeAll} disabled={pendingAll}>
            {pendingAll ? 'Cerrando...' : 'Cerrar todos'}
          </Button>
          <Button variant="danger" onClick={onLogoutClick}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface SessionRowProps {
  session: AuthSessionDevice;
  pending: boolean;
  onRevoke: () => void;
}

function SessionRow({ session, pending, onRevoke }: SessionRowProps) {
  const device = getDeviceDetails(session.userAgent);
  const Icon = device.kind === 'mobile' ? Smartphone : device.kind === 'desktop' ? Laptop : MonitorSmartphone;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-panel border border-border bg-muted/30 p-4">
      <span className="flex min-w-0 gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text">{device.label}</span>
            {session.current ? <Badge tone="income">Este dispositivo</Badge> : null}
          </span>
          <span className="mt-1 block text-sm leading-6 text-subtle">
            Último uso: {formatSessionDate(session.lastUsedAt)}
          </span>
          <span className="block break-words text-xs leading-5 text-subtle">
            {session.ipAddress ? `IP ${session.ipAddress}` : 'IP no disponible'} · Expira {formatSessionDate(session.expiresAt)}
          </span>
        </span>
      </span>
      <Button variant={session.current ? 'danger' : 'secondary'} size="sm" onClick={onRevoke} disabled={pending}>
        {pending ? 'Cerrando...' : 'Cerrar'}
      </Button>
    </div>
  );
}

function getDeviceDetails(userAgent: string | null) {
  if (!userAgent) {
    return {
      kind: 'unknown',
      label: 'Dispositivo desconocido',
    };
  }

  const isMobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);
  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('Chrome/')
      ? 'Chrome'
      : userAgent.includes('Firefox/')
        ? 'Firefox'
        : userAgent.includes('Safari/')
          ? 'Safari'
          : 'Navegador';
  const platform = userAgent.includes('Windows')
    ? 'Windows'
    : userAgent.includes('Mac OS')
      ? 'macOS'
      : userAgent.includes('Android')
        ? 'Android'
        : userAgent.includes('iPhone') || userAgent.includes('iPad')
          ? 'iOS'
          : 'Sistema desconocido';

  return {
    kind: isMobile ? 'mobile' : 'desktop',
    label: `${browser} en ${platform}`,
  };
}

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
