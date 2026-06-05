import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn('rounded-panel border border-border bg-surface p-5 shadow-soft', className)}
      {...props}
    />
  );
}
