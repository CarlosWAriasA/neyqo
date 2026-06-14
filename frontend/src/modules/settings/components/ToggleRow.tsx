import type { LucideIcon } from 'lucide-react';

interface ToggleRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({ icon: Icon, title, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-panel border border-border bg-canvas/50 p-4">
      <span className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-medium text-text">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-subtle">{description}</span>
        </span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
