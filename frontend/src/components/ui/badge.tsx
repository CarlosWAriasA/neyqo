import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-muted text-subtle',
      income: 'bg-positive/10 text-positive',
      expense: 'bg-danger/10 text-danger',
      transfer: 'bg-info/10 text-info',
      warning: 'bg-warning/10 text-warning',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className, tone }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, className }))}>{children}</span>;
}
