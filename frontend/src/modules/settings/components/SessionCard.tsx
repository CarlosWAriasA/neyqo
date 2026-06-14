import { LogOut, ShieldCheck } from 'lucide-react';
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
      <p className="mt-4 text-sm leading-6 text-subtle">
        Cierra la sesión en este navegador cuando termines de trabajar o compartas el equipo.
      </p>
      <div className="mt-5 flex justify-end">
        <Button variant="danger" onClick={onLogoutClick}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>
    </Card>
  );
}
