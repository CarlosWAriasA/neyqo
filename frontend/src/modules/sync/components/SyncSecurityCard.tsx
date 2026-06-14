import { ShieldCheck } from 'lucide-react';
import { Card } from '../../../components/ui/card';

export function SyncSecurityCard() {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold text-text">Control del usuario</h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-subtle">
        Cuando esté disponible, la conexión se iniciará desde esta sección y podrás pausarla o retirarla cuando lo necesites.
      </p>
    </Card>
  );
}
