import { Edit, X } from 'lucide-react';
import { DetailListSkeleton } from '../../../components/common/LoadingSkeletons';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import type { GeneratedScheduledTransaction, ScheduledMovement } from '../../../types/financial';
import { formatCurrency, formatDate } from '../../../utils/format';
import { frequencyLabel, statusCopy } from '../scheduled.constants';

interface ScheduledDetailPanelProps {
  item: ScheduledMovement;
  generated: GeneratedScheduledTransaction[];
  loading: boolean;
  hasMoreGenerated: boolean;
  loadingMoreGenerated: boolean;
  onLoadMoreGenerated: () => void;
  onClose: () => void;
  onEdit: () => void;
}

export function ScheduledDetailPanel({
  item,
  generated,
  loading,
  hasMoreGenerated,
  loadingMoreGenerated,
  onLoadMoreGenerated,
  onClose,
  onEdit,
}: ScheduledDetailPanelProps) {
  return (
    <div className="fixed inset-0 z-40 bg-text/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="ml-auto grid h-full w-full max-w-3xl content-start gap-5 overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">{item.name}</h2>
            <p className="mt-1 text-sm text-subtle">{statusCopy[item.status].description}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <DetailItem label="Tipo" value={item.type === 'income' ? 'Ingreso' : 'Gasto'} />
          <DetailItem label="Monto" value={formatCurrency(item.amount)} />
          <DetailItem label="Categoría" value={item.category} />
          <DetailItem label="Cuenta" value={item.account} />
          <DetailItem label="Frecuencia" value={frequencyLabel[item.frequency]} />
          <DetailItem
            label="Próxima fecha"
            value={item.nextExecutionDate ? formatDate(item.nextExecutionDate) : 'Sin fecha próxima'}
          />
          <DetailItem label="Fecha inicial" value={formatDate(item.startDate)} />
          <DetailItem label="Fecha final" value={item.endDate ? formatDate(item.endDate) : 'Sin fecha final'} />
          <DetailItem label="Estado" value={statusCopy[item.status].label} />
          {item.description ? <DetailItem label="Descripción" value={item.description} /> : null}
        </div>

        <div className="flex justify-end">
          {item.status !== 'completed' && item.status !== 'inactive' ? (
            <Button variant="secondary" onClick={onEdit}>
              <Edit className="h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
          ) : null}
        </div>

        <Card className="grid gap-4">
          <div>
            <h3 className="font-semibold text-text">Historial de movimientos generados</h3>
            <p className="text-sm text-subtle">Movimientos creados automáticamente desde este programado.</p>
          </div>
          {loading ? <DetailListSkeleton rows={4} /> : null}
          {!loading && generated.length === 0 ? (
            <p className="rounded-panel border border-dashed border-border p-4 text-sm text-subtle">
              Todavía no se han generado movimientos para este programado.
            </p>
          ) : null}
          {generated.length > 0 ? (
            <div className="grid gap-2">
              {generated.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid gap-2 rounded-panel border border-border p-3 text-sm md:grid-cols-[120px_1fr_120px_1fr]"
                >
                  <span className="text-subtle">{formatDate(transaction.date)}</span>
                  <span className="font-medium text-text">{transaction.description}</span>
                  <span className="font-semibold text-text">{formatCurrency(transaction.amount)}</span>
                  <span className="text-subtle">
                    {transaction.account} · {transaction.category ?? 'Sin categoría'}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {hasMoreGenerated ? (
            <Button type="button" variant="secondary" disabled={loadingMoreGenerated} onClick={onLoadMoreGenerated}>
              Cargar más
            </Button>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-panel border border-border p-3">
      <p className="text-xs text-subtle">{label}</p>
      <p className="mt-1 font-medium text-text">{value}</p>
    </div>
  );
}
