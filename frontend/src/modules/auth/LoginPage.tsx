import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { login, restoreStoredUser } from '../../api/auth';
import { authStorage } from '../../api/client';
import { AuthCard } from '../../components/forms/AuthCard';
import { Field } from '../../components/forms/Field';
import { FormDivider } from '../../components/forms/FormDivider';
import { SocialAuthButtons } from '../../components/forms/SocialAuthButtons';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const loginSchema = z.object({
  email: z.string().email('Escribe un correo válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const rememberedEmail = authStorage.getRememberedEmail();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedEmail,
      password: '',
      remember: Boolean(rememberedEmail),
    },
  });

  if (restoreStoredUser()) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    setError('');

    try {
      await login(
        { email: values.email, password: values.password },
        { remember: values.remember ?? false },
      );
      navigate('/app/dashboard', { replace: true });
    } catch {
      setError('No pudimos iniciar sesión. Revisa tu correo, contraseña o verificación pendiente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Iniciar sesión" description="Accede para continuar organizando tus finanzas.">
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            autoFocus={!rememberedEmail}
            {...form.register('email')}
          />
        </Field>
        <Field label="Contraseña" error={form.formState.errors.password?.message}>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-11"
              autoFocus={Boolean(rememberedEmail)}
              {...form.register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-subtle hover:text-text"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-subtle">
            <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" {...form.register('remember')} />
            Recordarme
          </label>
          <Link className="font-medium text-primary hover:text-primary-strong" to="/forgot-password">
            Recuperar contraseña
          </Link>
        </div>
        {error ? <p className="rounded-panel bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Iniciar sesión
        </Button>
      </form>
      <FormDivider />
      <SocialAuthButtons googleLabel="Continuar con Google" microsoftLabel="Continuar con Microsoft" />
      <p className="mt-5 text-center text-sm text-subtle">
        ¿No tienes cuenta?{' '}
        <Link className="font-medium text-primary hover:text-primary-strong" to="/register">
          Crear cuenta
        </Link>
      </p>
    </AuthCard>
  );
}
