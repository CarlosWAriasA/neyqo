import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-panel border border-dashed border-border bg-surface p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-panel bg-primary-soft text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-subtle">{description}</p>
      {actionLabel || secondaryActionLabel ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
          {secondaryActionLabel ? (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
