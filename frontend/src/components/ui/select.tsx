import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactElement,
  type SelectHTMLAttributes,
} from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

type OptionElement = ReactElement<SelectHTMLAttributes<HTMLOptionElement>, 'option'>;
type SearchableSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
};

interface SelectOption {
  value: string;
  label: string;
  disabled: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SearchableSelectProps>(
  ({ className, children, disabled, onChange, onBlur, value, defaultValue, name, id, placeholder, ...props }, ref) => {
    const generatedId = useId();
    const buttonId = id ?? generatedId;
    const listboxId = `${buttonId}-listbox`;
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectRef = useRef<HTMLSelectElement | null>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [internalValue, setInternalValue] = useState(() => String(value ?? defaultValue ?? ''));
    const isControlled = value !== undefined;
    const options = useMemo(() => getOptions(children), [children]);
    const selectedValue = isControlled ? String(value) : internalValue;
    const selectedOption = options.find((option) => option.value === selectedValue);
    const normalizedQuery = query.trim().toLowerCase();
    const filteredOptions = normalizedQuery
      ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
      : options;

    useEffect(() => {
      if (!open) {
        return undefined;
      }

      searchInputRef.current?.focus();
      searchInputRef.current?.select();

      function handlePointerDown(event: MouseEvent) {
        if (!containerRef.current?.contains(event.target as Node)) {
          setOpen(false);
          setQuery('');
        }
      }

      document.addEventListener('mousedown', handlePointerDown);

      return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [open]);

    useEffect(() => {
      if (!isControlled && selectRef.current && selectRef.current.value !== internalValue) {
        setInternalValue(selectRef.current.value);
      }
    });

    function assignRef(node: HTMLSelectElement | null) {
      selectRef.current = node;

      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }

    function selectOption(option: SelectOption) {
      if (option.disabled || disabled) {
        return;
      }

      if (!isControlled) {
        setInternalValue(option.value);
      }

      if (selectRef.current) {
        selectRef.current.value = option.value;
      }

      onChange?.({
        target: { name, value: option.value },
        currentTarget: { name, value: option.value },
      } as ChangeEvent<HTMLSelectElement>);
      setOpen(false);
      setQuery('');
    }

    function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
        setQuery(event.key);
        setOpen(true);
      }
    }

    function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        setQuery('');
        return;
      }

      if (event.key === 'Enter' && filteredOptions.length > 0) {
        event.preventDefault();
        selectOption(filteredOptions.find((option) => !option.disabled) ?? filteredOptions[0]);
      }
    }

    function handleBlur() {
      onBlur?.({
        target: { name, value: selectedValue },
        currentTarget: { name, value: selectedValue },
      } as never);
    }

    return (
      <div ref={containerRef} className={cn('relative w-full', className)}>
        <select
          ref={assignRef}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          name={name}
          value={selectedValue}
          onChange={onChange}
          onBlur={onBlur}
          {...props}
        >
          {children}
        </select>
        <button
          id={buttonId}
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between gap-3 rounded-panel border border-border bg-surface px-3 text-left text-sm text-text outline-none transition hover:bg-muted focus:border-primary focus:ring-2 focus:ring-primary/15',
            disabled && 'cursor-not-allowed opacity-60 hover:bg-surface',
          )}
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onBlur={handleBlur}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleButtonKeyDown}
        >
          <span className={cn('truncate', !selectedOption && 'text-subtle')}>
            {selectedOption?.label ?? placeholder ?? 'Seleccionar'}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-subtle" aria-hidden="true" />
        </button>

        {open ? (
          <div className="absolute z-30 mt-2 w-full rounded-panel border border-border bg-surface p-2 shadow-panel">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
              <input
                ref={searchInputRef}
                className="h-9 w-full rounded-panel border border-border bg-surface pl-9 pr-3 text-sm text-text outline-none placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="Buscar..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <div id={listboxId} className="category-scrollbar mt-2 max-h-56 overflow-y-auto" role="listbox">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-subtle">Sin resultados</p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    className={cn(
                      'flex min-h-10 w-full items-center justify-between gap-3 rounded-panel px-3 text-left text-sm transition hover:bg-muted',
                      option.value === selectedValue && 'bg-primary-soft text-primary',
                      option.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                    )}
                    role="option"
                    aria-selected={option.value === selectedValue}
                    disabled={option.disabled}
                    onClick={() => selectOption(option)}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.value === selectedValue ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);

Select.displayName = 'Select';

function getOptions(children: SelectHTMLAttributes<HTMLSelectElement>['children']): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== 'option') {
      return [];
    }

    const option = child as OptionElement;
    const value = option.props.value === undefined ? optionLabel(option) : String(option.props.value);

    return [
      {
        value,
        label: optionLabel(option),
        disabled: Boolean(option.props.disabled),
      },
    ];
  });
}

function optionLabel(option: OptionElement) {
  return Children.toArray(option.props.children).join('');
}
