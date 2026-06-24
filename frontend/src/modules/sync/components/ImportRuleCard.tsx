import { Power, PowerOff } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import type { EmailImportRule } from '../../../types/financial';
import { bankLabels } from '../sync.constants';

interface ImportRuleCardProps {
  rule: EmailImportRule;
  changing: boolean;
  onToggleStatus: () => void;
}

export function ImportRuleCard({ rule, changing, onToggleStatus }: ImportRuleCardProps) {
  const isActive = rule.status === 'active';

  return (
    <Card className="grid min-w-0 gap-3 p-4 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate font-semibold text-text">{bankLabels[rule.bankCode]}</h3>
            <Badge tone={isActive ? 'income' : 'neutral'}>{isActive ? 'Activa' : 'Inactiva'}</Badge>
          </div>
          <p className="mt-1 truncate text-sm text-subtle">{rule.accountName}</p>
        </div>
        {rule.cardLastDigits ? (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-subtle">
            **** {rule.cardLastDigits}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="min-w-0 rounded-panel bg-muted px-3 py-2">
          <p className="text-xs text-subtle">Categoría</p>
          <p className="truncate font-medium text-text">{rule.categoryName}</p>
        </div>
        <div className="min-w-0 rounded-panel bg-muted px-3 py-2">
          <p className="text-xs text-subtle">Producto</p>
          <p className="truncate font-medium text-text">{productKindLabel(rule.productKind)}</p>
        </div>
      </div>

      {rule.merchantPattern ? (
        <p className="truncate text-xs text-subtle">Comercio: {rule.merchantPattern}</p>
      ) : null}

      <Button type="button" variant="secondary" size="sm" onClick={onToggleStatus} disabled={changing}>
        {isActive ? <PowerOff className="h-4 w-4" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
        {changing ? 'Actualizando...' : isActive ? 'Pausar' : 'Activar'}
      </Button>
    </Card>
  );
}

function productKindLabel(value: EmailImportRule['productKind']) {
  if (value === 'card') return 'Tarjeta';
  if (value === 'account') return 'Cuenta';
  return 'Otro';
}
