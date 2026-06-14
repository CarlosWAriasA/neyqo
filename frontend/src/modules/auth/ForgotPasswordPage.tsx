import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { requestPasswordReset } from '@/api/auth';
import { AuthCard } from '@/components/forms/AuthCard';
import { Field } from '@/components/forms/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AUTH_MESSAGES } from '@/modules/auth/auth.constants';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/modules/auth/auth.schema';

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await requestPasswordReset(values.email);
      setMessage(response.message);
    } catch {
      setMessage(AUTH_MESSAGES.forgotPasswordFallback);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Recuperar contraseña" description="Te enviaremos un código si existe una cuenta con ese correo.">
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="tu@correo.com" {...form.register('email')} />
        </Field>
        {message ? <p className="rounded-panel bg-info/10 p-3 text-sm text-info">{message}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar código
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
