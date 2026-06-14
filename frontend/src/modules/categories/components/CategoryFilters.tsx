import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { cn } from '../../../utils/cn';
import type { CategoryStatusFilter, CategoryTypeFilter } from '../categories.schema';

const typeOptions: Array<{ value: CategoryTypeFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
];

const statusOptions: Array<{ value: CategoryStatusFilter; label: string }> = [
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
  { value: 'all', label: 'Todas' },
];

interface CategoryFiltersProps {
  searchTerm: string;
  typeFilter: CategoryTypeFilter;
  statusFilter: CategoryStatusFilter;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: CategoryTypeFilter) => void;
  onStatusChange: (value: CategoryStatusFilter) => void;
}

export function CategoryFilters({
  searchTerm,
  typeFilter,
  statusFilter,
  onSearchChange,
  onTypeChange,
  onStatusChange,
}: CategoryFiltersProps) {
  return (
    <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(18rem,1fr)_auto_auto] lg:items-end">
      <label className="grid gap-2 text-sm font-medium text-text sm:col-span-2 lg:col-span-1">
        Buscar
        <span className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <Input
            className="pl-9"
            placeholder="Buscar categoría"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </span>
      </label>

      <FilterGroup label="Tipo">
        {typeOptions.map((option) => (
          <FilterButton
            key={option.value}
            active={typeFilter === option.value}
            onClick={() => onTypeChange(option.value)}
          >
            {option.label}
          </FilterButton>
        ))}
      </FilterGroup>

      <FilterGroup label="Estado">
        {statusOptions.map((option) => (
          <FilterButton
            key={option.value}
            active={statusFilter === option.value}
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </FilterButton>
        ))}
      </FilterGroup>
    </Card>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-text">{label}</span>
      <div className="flex h-10 w-full rounded-panel border border-border bg-muted p-1 lg:w-max">{children}</div>
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'h-8 min-w-20 flex-1 rounded-[6px] px-3 text-sm font-medium text-subtle transition hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:flex-none',
        active && 'bg-primary text-white shadow-soft hover:text-white',
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
