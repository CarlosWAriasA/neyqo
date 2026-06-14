import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { register, restoreStoredUser } from '@/api/auth';
import { AuthCard } from '@/components/forms/AuthCard';
import { Field } from '@/components/forms/Field';
import { FormDivider } from '@/components/forms/FormDivider';
import { SocialAuthButtons } from '@/components/forms/SocialAuthButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AUTH_MESSAGES } from '@/modules/auth/auth.constants';
import { registerSchema, type RegisterValues } from '@/modules/auth/auth.schema';
import { PasswordInput } from '@/modules/auth/components/PasswordInput';

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  if (restoreStoredUser()) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      setMessage(response.message);
      setTimeout(() => navigate('/login'), 1200);
    } catch {
      setError(AUTH_MESSAGES.registerError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Crear cuenta" description="Empieza con correo y contraseña. El acceso social queda separado de la sincronización de correos.">
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Nombre" error={form.formState.errors.fullName?.message}>
          <Input autoComplete="name" placeholder="Tu nombre" autoFocus {...form.register('fullName')} />
        </Field>
        <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="tu@correo.com" {...form.register('email')} />
        </Field>
        <Field label="Contraseña" error={form.formState.errors.password?.message}>
          <PasswordInput
            visible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            autoComplete="new-password"
            {...form.register('password')}
          />
        </Field>
        <Field label="Confirmar contraseña" error={form.formState.errors.confirmPassword?.message}>
          <PasswordInput
            visible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            autoComplete="new-password"
            {...form.register('confirmPassword')}
          />
        </Field>
        <label className="flex items-start gap-2 text-sm text-subtle">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border accent-primary" {...form.register('acceptedTerms')} />
          <span>
            Acepto los <Link className="text-primary" to="/terms">términos</Link> y la{' '}
            <Link className="text-primary" to="/privacy">privacidad</Link>.
          </span>
        </label>
        {form.formState.errors.acceptedTerms?.message ? (
          <p className="text-sm text-danger">{form.formState.errors.acceptedTerms.message}</p>
        ) : null}
        {message ? <p className="rounded-panel bg-positive/10 p-3 text-sm text-positive">{message}</p> : null}
        {error ? <p className="rounded-panel bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Crear cuenta
        </Button>
      </form>
      <FormDivider />
      <SocialAuthButtons googleLabel="Registrarme con Google" microsoftLabel="Registrarme con Microsoft" />
      <p className="mt-5 text-center text-sm text-subtle">
        ¿Ya tienes cuenta?{' '}
        <Link className="font-medium text-primary hover:text-primary-strong" to="/login">
          Iniciar sesión
        </Link>
      </p>
    </AuthCard>
  );
}
