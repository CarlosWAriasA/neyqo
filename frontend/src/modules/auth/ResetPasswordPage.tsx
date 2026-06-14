import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { resetPassword } from '@/api/auth';
import { AuthCard } from '@/components/forms/AuthCard';
import { Field } from '@/components/forms/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AUTH_MESSAGES } from '@/modules/auth/auth.constants';
import { resetPasswordSchema, type ResetPasswordValues } from '@/modules/auth/auth.schema';
import { PasswordInput } from '@/modules/auth/components/PasswordInput';

export function ResetPasswordPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '', code: '', password: '' },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await resetPassword(values);
      setMessage(response.message);
    } catch {
      setMessage(AUTH_MESSAGES.resetPasswordError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Restablecer contraseña" description="Usa el código recibido para definir una nueva contraseña.">
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field label="Código" error={form.formState.errors.code?.message}>
          <Input inputMode="numeric" {...form.register('code')} />
        </Field>
        <Field label="Nueva contraseña" error={form.formState.errors.password?.message}>
          <PasswordInput
            visible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            autoComplete="new-password"
            {...form.register('password')}
          />
        </Field>
        {message ? <p className="rounded-panel bg-info/10 p-3 text-sm text-info">{message}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Restablecer
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-subtle">
        <Link className="font-medium text-primary hover:text-primary-strong" to="/login">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthCard>
  );
}
