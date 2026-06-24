import { CircleEllipsis, Edit, Play, Power } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { categoryIconByValue } from '../../../config/categoryIcons';
import type { Category } from '../../../types/financial';

interface CategoryCardProps {
  category: Category;
  isChangingStatus: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}

export function CategoryCard({
  category,
  isChangingStatus,
  onEdit,
  onDeactivate,
  onReactivate,
}: CategoryCardProps) {
  const Icon = categoryIconByValue[category.icon] ?? CircleEllipsis;

  return (
    <Card className="min-w-0 overflow-hidden p-3 sm:grid sm:gap-4 sm:p-5">
      <div className="flex min-w-0 items-center gap-2.5 sm:items-start sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:items-start sm:gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary sm:h-10 sm:w-10">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <h2 className="truncate text-sm font-semibold text-text sm:text-base">{category.name}</h2>
              <Badge tone={category.status === 'active' ? 'income' : 'neutral'} className="shrink-0 px-2 py-0.5 sm:hidden">
                {category.status === 'active' ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-subtle sm:hidden">
              {category.type === 'income' ? 'Ingreso' : 'Gasto'}
            </p>
            <p className="mt-1 hidden text-sm text-subtle sm:block">{category.description || 'Sin descripción'}</p>
          </div>
        </div>
        <Badge tone={category.type === 'income' ? 'income' : 'expense'} className="hidden shrink-0 px-2 py-0.5 sm:inline-flex sm:px-2.5 sm:py-1">
          {category.type === 'income' ? 'Ingreso' : 'Gasto'}
        </Badge>
        <div className="flex shrink-0 gap-1 sm:hidden">
          <Button className="h-8 w-8 px-0" variant="secondary" size="sm" onClick={onEdit} aria-label="Editar categoría">
            <Edit className="h-4 w-4" aria-hidden="true" />
          </Button>
          {category.status === 'active' ? (
            <Button className="h-8 w-8 px-0" variant="ghost" size="sm" disabled={isChangingStatus} onClick={onDeactivate} aria-label="Desactivar categoría">
              <Power className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button className="h-8 w-8 px-0" variant="ghost" size="sm" disabled={isChangingStatus} onClick={onReactivate} aria-label="Reactivar categoría">
              <Play className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      <div className="hidden flex-wrap gap-2 sm:flex">
        <Badge tone="neutral" className="hidden sm:inline-flex">Prioridad {category.priority}</Badge>
        <Badge tone={category.status === 'active' ? 'income' : 'neutral'}>
          {category.status === 'active' ? 'Activa' : 'Inactiva'}
        </Badge>
      </div>
      <div className="hidden gap-2 sm:flex">
        <Button className="flex-1 sm:flex-none" variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" aria-hidden="true" />
          Editar
        </Button>
        {category.status === 'active' ? (
          <Button variant="ghost" size="sm" disabled={isChangingStatus} onClick={onDeactivate}>
            <Power className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{isChangingStatus ? 'Desactivando...' : 'Desactivar'}</span>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled={isChangingStatus} onClick={onReactivate}>
            <Play className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{isChangingStatus ? 'Reactivando...' : 'Reactivar'}</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
