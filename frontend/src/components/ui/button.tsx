import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex h-10 items-center justify-center gap-2 rounded-panel px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-strong focus-visible:outline-primary',
        secondary: 'border border-border bg-surface text-text hover:bg-muted focus-visible:outline-primary',
        ghost: 'text-subtle hover:bg-muted hover:text-text focus-visible:outline-primary',
        danger: 'bg-danger text-white hover:brightness-95 focus-visible:outline-danger',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        icon: 'h-10 w-10 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);

Button.displayName = 'Button';
