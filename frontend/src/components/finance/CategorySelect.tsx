import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { categoryIconByValue, fallbackCategoryIcon } from '../../config/categoryIcons';
import type { Category } from '../../types/financial';
import { cn } from '../../utils/cn';

interface CategorySelectProps {
  categories: Category[];
  value?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  onChange: (categoryId: string) => void;
}

export function CategorySelect({
  categories,
  value = '',
  placeholder = 'Seleccionar categoría',
  clearable = false,
  disabled = false,
  onChange,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const selectedCategory = categories.find((category) => category.id === value);
  const SelectedIcon = selectedCategory
    ? categoryIconByValue[selectedCategory.icon] ?? fallbackCategoryIcon
    : null;
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return normalizedQuery
      ? categories.filter((category) => category.name.toLowerCase().includes(normalizedQuery))
      : categories;
  }, [categories, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return undefined;
    }

    searchInputRef.current?.focus();
    searchInputRef.current?.select();

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function selectCategory(categoryId: string) {
    onChange(categoryId);
    setOpen(false);
  }

  function clearCategory() {
    onChange('');
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-3 rounded-panel border border-border bg-surface px-3 text-left text-sm text-text outline-none transition hover:bg-muted focus:border-primary focus:ring-2 focus:ring-primary/15',
          disabled && 'cursor-not-allowed opacity-60 hover:bg-surface',
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex min-w-0 items-center gap-2">
          {SelectedIcon ? <SelectedIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
          <span className={cn('truncate', !selectedCategory && 'text-subtle')}>
            {selectedCategory?.name ?? placeholder}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && selectedCategory ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Quitar ${selectedCategory.name}`}
              className="rounded-full p-0.5 text-subtle transition hover:bg-muted hover:text-text"
              onClick={(event) => {
                event.stopPropagation();
                clearCategory();
              }}
              onKeyDown={(event) => {
                event.stopPropagation();

                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  clearCategory();
                }
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          ) : null}
          <ChevronDown className="h-4 w-4 text-subtle" aria-hidden="true" />
        </span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-full rounded-panel border border-border bg-surface p-2 shadow-panel">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <input
              ref={searchInputRef}
              className="h-9 w-full rounded-panel border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Buscar categoría..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setOpen(false);
                }

                if (event.key === 'Enter' && filteredCategories[0]) {
                  event.preventDefault();
                  selectCategory(filteredCategories[0].id);
                }
              }}
            />
          </div>
          <div className="category-scrollbar mt-2 max-h-56 overflow-y-auto" role="listbox">
            {filteredCategories.length === 0 ? (
              <p className="px-3 py-2 text-sm text-subtle">Sin resultados</p>
            ) : (
              filteredCategories.map((category) => {
                const selected = selectedCategory?.id === category.id;
                const Icon = categoryIconByValue[category.icon] ?? fallbackCategoryIcon;

                return (
                  <button
                    key={category.id}
                    type="button"
                    className={cn(
                      'flex min-h-11 w-full items-center justify-between gap-3 rounded-panel px-3 text-left text-sm transition hover:bg-muted',
                      selected && 'bg-primary-soft text-primary',
                    )}
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectCategory(category.id)}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate font-medium">{category.name}</span>
                    </span>
                    {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
