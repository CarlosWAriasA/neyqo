import { Edit, Pause, Play, Power } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import type { ScheduledMovement } from '../../../types/financial';
import { cn } from '../../../utils/cn';
import { formatCurrency, formatDate } from '../../../utils/format';
import { statusCopy } from '../scheduled.constants';
import { formatFrequency } from '../scheduled.utils';

interface ScheduledCardProps {
  item: ScheduledMovement;
  pending: boolean;
  onDetail: () => void;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
  onDeactivate: () => void;
}

export function ScheduledCard({
  item,
  pending,
  onDetail,
  onEdit,
  onPause,
  onResume,
  onDeactivate,
}: ScheduledCardProps) {
  const status = statusCopy[item.status];

  return (
    <Card className="grid gap-3 p-3 sm:gap-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-text">{item.name}</h2>
          <p className="mt-1 hidden text-sm text-subtle sm:block">{item.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={item.type === 'income' ? 'income' : 'expense'}>
            {item.type === 'income' ? 'Ingreso' : 'Gasto'}
          </Badge>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-sm text-subtle">Monto</p>
          <p className={cn('text-lg font-semibold sm:text-2xl', item.type === 'income' ? 'text-positive' : 'text-danger')}>
            {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
          </p>
        </div>
        <div>
          <p className="text-sm text-subtle">Próxima fecha</p>
          <p className="font-semibold text-text">
            {item.nextExecutionDate ? formatDate(item.nextExecutionDate) : 'Sin fecha próxima'}
          </p>
        </div>
      </div>
      <div className="rounded-panel bg-muted p-3 text-sm text-subtle">
        <p className="font-medium text-text">
          {item.category} · {item.account}
        </p>
        <p className="mt-1">{formatFrequency(item)}</p>
        <p className="mt-1 hidden sm:block">{status.description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="flex-1 sm:flex-none" variant="secondary" size="sm" onClick={onDetail}>
          Ver detalle
        </Button>
        {item.status !== 'completed' && item.status !== 'inactive' ? (
          <Button variant="secondary" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Editar</span>
          </Button>
        ) : null}
        {item.status === 'active' ? (
          <Button variant="ghost" size="sm" disabled={pending} onClick={onPause}>
            <Pause className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Pausar</span>
          </Button>
        ) : null}
        {item.status === 'paused' ? (
          <Button variant="ghost" size="sm" disabled={pending} onClick={onResume}>
            <Play className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Reactivar</span>
          </Button>
        ) : null}
        {item.status !== 'completed' && item.status !== 'inactive' ? (
          <Button variant="ghost" size="sm" disabled={pending} onClick={onDeactivate}>
            <Power className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Desactivar</span>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
