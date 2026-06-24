import { Globe2, LogOut, ShieldCheck } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

interface SessionCardProps {
  onLogoutClick: () => void;
}

export function SessionCard({ onLogoutClick }: SessionCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-text">Sesión</h2>
        </div>
        <Badge tone="neutral">Activa</Badge>
      </div>
      <div className="mt-5 grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-border bg-muted/30 p-4">
          <span className="flex gap-3">
            <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <span className="block text-sm font-medium text-text">Cerrar sesión en todos los dispositivos</span>
              <span className="mt-1 block text-sm leading-6 text-subtle">Protege tu cuenta en equipos compartidos.</span>
            </span>
          </span>
          <Button variant="secondary" disabled>
            En camino
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="danger" onClick={onLogoutClick}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </Card>
  );
}
