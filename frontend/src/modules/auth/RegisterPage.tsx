import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { register, restoreStoredUser } from '../../api/auth';
import { AuthCard } from '../../components/forms/AuthCard';
import { Field } from '../../components/forms/Field';
import { FormDivider } from '../../components/forms/FormDivider';
import { SocialAuthButtons } from '../../components/forms/SocialAuthButtons';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Escribe tu nombre.'),
    email: z.string().email('Escribe un correo válido.'),
    password: z.string().min(8, 'Usa al menos 8 caracteres.'),
    confirmPassword: z.string().min(8, 'Confirma tu contraseña.'),
    acceptedTerms: z.literal(true, {
      error: 'Debes aceptar términos y privacidad.',
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

type RegisterValues = z.infer<typeof registerSchema>;

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
      setError('No pudimos crear la cuenta. Revisa los datos o intenta nuevamente.');
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
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="pr-11"
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
        <Field label="Confirmar contraseña" error={form.formState.errors.confirmPassword?.message}>
          <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...form.register('confirmPassword')} />
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
