import { CalendarDays } from 'lucide-react';
import { Card } from '../../../components/ui/card';

export function CalendarInfoCard() {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold text-text">Moneda y calendario</h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-subtle">
        La moneda principal se usará para resúmenes y reportes. Las cuentas seguirán conservando
        su propia moneda para evitar mezclar balances sin conversión.
      </p>
    </Card>
  );
}
