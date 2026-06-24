import type { Account, Category } from '../../../types/financial';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { reportPresetOptions } from '../reports.utils';
import type { ReportFilterState, ReportPreset } from '../reports.schema';

interface ReportsFiltersProps {
  filters: ReportFilterState;
  accounts: Account[];
  categories: Category[];
  onChange: (filters: ReportFilterState) => void;
}

export function ReportsFilters({ filters, accounts, categories, onChange }: ReportsFiltersProps) {
  const expenseCategories = categories.filter((category) => category.status === 'active' && category.type === 'expense');

  return (
    <section className="grid gap-3 rounded-panel border border-border bg-surface p-3 shadow-soft sm:p-4">
      <div className="flex flex-wrap gap-2">
        {reportPresetOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`h-9 rounded-panel border px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              filters.preset === option.value
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-text hover:bg-muted'
            }`}
            onClick={() => onChange({ ...filters, preset: option.value as ReportPreset })}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_160px]">
        <Select
          value={filters.accountId}
          onChange={(event) => onChange({ ...filters, accountId: event.target.value })}
        >
          <option value="">Todas las cuentas</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>

        <Select
          value={filters.categoryId}
          onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
        >
          <option value="">Todas las categorías</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        {filters.preset === 'custom' ? (
          <>
            <Input
              type="date"
              aria-label="Fecha inicial"
              value={filters.dateFrom}
              onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
            />
            <Input
              type="date"
              aria-label="Fecha final"
              value={filters.dateTo}
              onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
