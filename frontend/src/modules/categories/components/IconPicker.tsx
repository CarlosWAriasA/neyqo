import { categoryIconOptions } from '../../../config/categoryIcons';
import { cn } from '../../../utils/cn';

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}

export function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text">Vista rápida de iconos</p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
        {categoryIconOptions.map((option) => {
          const Icon = option.icon;
          const selected = selectedIcon === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                'flex h-10 items-center justify-center rounded-panel border border-border text-subtle transition hover:bg-muted hover:text-text',
                selected && 'border-primary bg-primary-soft text-primary',
              )}
              title={option.label}
              onClick={() => onSelect(option.value)}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
