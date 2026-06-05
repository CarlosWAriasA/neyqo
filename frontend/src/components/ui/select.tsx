import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-panel border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);

Select.displayName = 'Select';
