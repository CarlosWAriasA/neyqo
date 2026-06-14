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
    <Card className="grid gap-3 p-3 sm:gap-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary sm:h-10 sm:w-10">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-text">{category.name}</h2>
            <p className="mt-1 hidden text-sm text-subtle sm:block">{category.description || 'Sin descripción'}</p>
          </div>
        </div>
        <Badge tone={category.type === 'income' ? 'income' : 'expense'}>
          {category.type === 'income' ? 'Ingreso' : 'Gasto'}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone="neutral" className="hidden sm:inline-flex">Prioridad {category.priority}</Badge>
        <Badge tone={category.status === 'active' ? 'income' : 'neutral'}>
          {category.status === 'active' ? 'Activa' : 'Inactiva'}
        </Badge>
      </div>
      <div className="flex gap-2">
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
