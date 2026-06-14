import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  visible: boolean;
  onToggle: () => void;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, visible, onToggle, ...props }, ref) => (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn('pr-11', className)}
        {...props}
      />
      <button
        type="button"
        className="absolute right-3 top-2.5 text-subtle hover:text-text"
        onClick={onToggle}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  ),
);

PasswordInput.displayName = 'PasswordInput';
