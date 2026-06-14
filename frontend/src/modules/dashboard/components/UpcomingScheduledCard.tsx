import { CalendarClock } from 'lucide-react';
import { Skeleton } from '../../../components/common/Skeleton';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import type { UpcomingScheduledMovement } from '../../../types/financial';
import { cn } from '../../../utils/cn';
import { formatCurrency, formatDate } from '../../../utils/format';

interface UpcomingScheduledCardProps {
  movements: UpcomingScheduledMovement[];
  loading?: boolean;
  onOpenScheduled: () => void;
}

export function UpcomingScheduledCard({ movements, loading = false, onOpenScheduled }: UpcomingScheduledCardProps) {
  return (
    <Card className="sm:min-h-[22rem]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text">Próximos movimientos</h2>
          <p className="text-sm text-subtle">Programados que se registrarán automáticamente.</p>
        </div>
        <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[4.375rem]" />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <p className="rounded-panel border border-dashed border-border p-4 text-sm text-subtle">
          No tienes movimientos programados para los próximos días.
        </p>
      ) : (
        <div className="grid gap-3">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="flex flex-col gap-2 rounded-panel border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-text">{movement.name}</p>
                <p className="text-sm text-subtle">
                  {formatDate(movement.date)} · {movement.category}
                </p>
              </div>
              <span className={cn('font-semibold', movement.type === 'income' ? 'text-positive' : 'text-danger')}>
                {movement.type === 'income' ? '+' : '-'} {formatCurrency(movement.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
      <Button variant="secondary" className="mt-4" onClick={onOpenScheduled}>
        Ver todos
      </Button>
    </Card>
  );
}
