import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-panel border border-border bg-surface px-3 text-sm text-text outline-none transition placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/15',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
