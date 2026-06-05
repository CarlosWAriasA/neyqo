import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { Eye, EyeOff, Loader2, Lock, Mail, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import {
  login,
  register,
  requestPasswordReset,
  resendVerificationCode,
  verifyEmail,
} from '../../api/auth';
import { authStorage } from '../../api/client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Field } from './Field';
import { FormDivider } from './FormDivider';
import { SocialAuthButtons } from './SocialAuthButtons';

export type AuthModalMode = 'login' | 'register' | 'forgot-password' | 'verify-email';

interface AuthModalProps {
  mode: AuthModalMode | null;
  onClose: () => void;
  onModeChange: (mode: AuthModalMode) => void;
}

const loginSchema = z.object({
  email: z.string().email('Escribe un correo válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
  remember: z.boolean().optional(),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Escribe tu nombre.'),
    email: z.string().email('Escribe un correo válido.'),
    password: z.string().min(8, 'Usa al menos 8 caracteres.'),
    confirmPassword: z.string().min(8, 'Confirma tu contraseña.'),
    acceptedTerms: z.literal(true, { error: 'Debes aceptar términos y privacidad.' }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

const forgotSchema = z.object({
  email: z.string().email('Escribe un correo válido.'),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;

export function AuthModal({ mode, onClose, onModeChange }: AuthModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    if (!mode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => {
      const initialField = dialogRef.current?.querySelector<HTMLElement>('[data-auth-autofocus="true"]');
      initialField?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mode, onClose]);

  const handleNeedVerification = (email: string) => {
    setPendingEmail(email);
    onModeChange('verify-email');
  };

  const handleVerified = () => {
    window.location.href = '/app/dashboard';
  };

  const handleOAuthSuccess = () => {
    window.location.href = '/app/dashboard';
  };

  return (
    <AnimatePresence>
      {mode ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[440px] bg-surface rounded-2xl shadow-panel max-h-[92vh] overflow-y-auto"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            tabIndex={-1}
          >
            <div className="relative px-8 py-8">
              <button
                type="button"
                className="absolute right-5 top-5 rounded-lg p-1.5 text-subtle transition hover:bg-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.14 }}
                >
                  {mode === 'login' && (
                    <LoginForm
                      onModeChange={onModeChange}
                      onNeedVerification={handleNeedVerification}
                      onOAuthSuccess={handleOAuthSuccess}
                    />
                  )}
                  {mode === 'register' && (
                    <RegisterForm
                      onModeChange={onModeChange}
                      onNeedVerification={handleNeedVerification}
                      onOAuthSuccess={handleOAuthSuccess}
                    />
                  )}
                  {mode === 'forgot-password' && (
                    <ForgotPasswordForm onModeChange={onModeChange} />
                  )}
                  {mode === 'verify-email' && (
                    <VerifyEmailForm
                      email={pendingEmail}
                      onModeChange={onModeChange}
                      onVerified={handleVerified}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// ---

function LoginForm({
  onModeChange,
  onNeedVerification,
  onOAuthSuccess,
}: {
  onModeChange: (mode: AuthModalMode) => void;
  onNeedVerification: (email: string) => void;
  onOAuthSuccess: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const rememberedEmail = authStorage.getRememberedEmail();
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedEmail,
      password: '',
      remember: Boolean(rememberedEmail),
    },
  });
  const emailField = form.register('email');
  const passwordField = form.register('password');

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => {
      if (rememberedEmail) {
        passwordInputRef.current?.focus();
      } else {
        emailInputRef.current?.focus();
      }
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [rememberedEmail]);

  const onSubmit = async (values: LoginValues) => {
    setLoading(true);
    setError('');
    setUnverifiedEmail('');

    try {
      await login(
        { email: values.email, password: values.password },
        { remember: values.remember ?? false },
      );
      window.location.href = '/app/dashboard';
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const status = axiosErr.response?.status;
      const serverMsg = axiosErr.response?.data?.message;

      if (status === 403) {
        setUnverifiedEmail(values.email);
        setError('Debes confirmar tu correo antes de continuar.');
      } else if (status === 401) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError(serverMsg || 'No pudimos iniciar sesión. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-text">Inicia sesión</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-subtle">
        Continúa revisando tus cuentas, gastos y presupuestos.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              className="h-11 pl-9"
              data-auth-autofocus={rememberedEmail ? undefined : 'true'}
              {...emailField}
              ref={(element) => {
                emailField.ref(element);
                emailInputRef.current = element;
              }}
            />
          </div>
        </Field>

        <Field label="Contraseña" error={form.formState.errors.password?.message}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="h-11 pl-9 pr-11"
              data-auth-autofocus={rememberedEmail ? 'true' : undefined}
              {...passwordField}
              ref={(element) => {
                passwordField.ref(element);
                passwordInputRef.current = element;
              }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-text"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-subtle">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary"
              {...form.register('remember')}
            />
            Recordarme
          </label>
          <button
            type="button"
            className="font-medium text-primary hover:text-primary-strong"
            onClick={() => onModeChange('forgot-password')}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
            <p>{error}</p>
            {unverifiedEmail && (
              <button
                type="button"
                className="mt-1.5 font-medium underline"
                onClick={() => onNeedVerification(unverifiedEmail)}
              >
                Verificar mi correo
              </button>
            )}
          </div>
        )}

        <Button type="submit" disabled={loading} className="h-11 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Iniciar sesión
        </Button>
      </form>

      <FormDivider />
      <SocialAuthButtons
        googleLabel="Continuar con Google"
        microsoftLabel="Continuar con Microsoft"
        onSuccess={onOAuthSuccess}
        onError={setError}
      />

      <p className="mt-6 text-center text-sm text-subtle">
        ¿No tienes cuenta?{' '}
        <button
          className="font-medium text-primary hover:text-primary-strong"
          onClick={() => onModeChange('register')}
        >
          Crea una
        </button>
      </p>
    </div>
  );
}

// ---

function RegisterForm({
  onModeChange,
  onNeedVerification,
  onOAuthSuccess,
}: {
  onModeChange: (mode: AuthModalMode) => void;
  onNeedVerification: (email: string) => void;
  onOAuthSuccess: () => void;
}) {
  const fullNameInputRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });
  const fullNameField = form.register('fullName');

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => {
      fullNameInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, []);

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true);
    setError('');

    try {
      const response = await register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });
      void response;
      onNeedVerification(values.email);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const status = axiosErr.response?.status;
      const serverMsg = axiosErr.response?.data?.message;

      if (status === 409) {
        setError('Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.');
      } else {
        setError(serverMsg || 'No pudimos crear tu cuenta. Revisa los datos e intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-text">Crea tu cuenta</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-subtle">
        Empieza a organizar tu dinero con una cuenta gratuita.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Nombre" error={form.formState.errors.fullName?.message}>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input
              autoComplete="name"
              placeholder="Tu nombre"
              className="h-11 pl-9"
              data-auth-autofocus="true"
              {...fullNameField}
              ref={(element) => {
                fullNameField.ref(element);
                fullNameInputRef.current = element;
              }}
            />
          </div>
        </Field>

        <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              className="h-11 pl-9"
              {...form.register('email')}
            />
          </div>
        </Field>

        <Field label="Contraseña" error={form.formState.errors.password?.message}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="h-11 pl-9 pr-11"
              {...form.register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-text"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field label="Confirmar contraseña" error={form.formState.errors.confirmPassword?.message}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="h-11 pl-9"
              {...form.register('confirmPassword')}
            />
          </div>
        </Field>

        <label className="flex items-start gap-2.5 text-sm text-subtle">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
            {...form.register('acceptedTerms')}
          />
          <span>
            Acepto los{' '}
            <Link className="font-medium text-primary hover:text-primary-strong" to="/terms">
              términos
            </Link>{' '}
            y la{' '}
            <Link className="font-medium text-primary hover:text-primary-strong" to="/privacy">
              privacidad
            </Link>
            .
          </span>
        </label>

        {form.formState.errors.acceptedTerms?.message && (
          <p className="text-sm text-danger">{form.formState.errors.acceptedTerms.message}</p>
        )}

        {error && <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={loading} className="h-11 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Crear cuenta
        </Button>
      </form>

      <FormDivider />
      <SocialAuthButtons
        googleLabel="Registrarme con Google"
        microsoftLabel="Registrarme con Microsoft"
        onSuccess={onOAuthSuccess}
        onError={setError}
      />

      <p className="mt-6 text-center text-sm text-subtle">
        ¿Ya tienes cuenta?{' '}
        <button
          className="font-medium text-primary hover:text-primary-strong"
          onClick={() => onModeChange('login')}
        >
          Inicia sesión
        </button>
      </p>
    </div>
  );
}

// ---

function ForgotPasswordForm({ onModeChange }: { onModeChange: (mode: AuthModalMode) => void }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotValues) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await requestPasswordReset(values.email);
      setMessage(response.message);
    } catch {
      setMessage('Si la cuenta existe, enviaremos instrucciones para continuar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-text">Recupera tu contraseña</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-subtle">
        Escribe tu correo y te ayudaremos a volver a entrar.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
            <Input
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              className="h-11 pl-9"
              {...form.register('email')}
            />
          </div>
        </Field>

        {message && (
          <p className="rounded-xl bg-info/10 p-3 text-sm text-info">{message}</p>
        )}

        <Button type="submit" disabled={loading} className="h-11 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar instrucciones
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-subtle">
        <button
          className="font-medium text-primary hover:text-primary-strong"
          onClick={() => onModeChange('login')}
        >
          Volver a iniciar sesión
        </button>
      </p>
    </div>
  );
}

// ---

function VerifyEmailForm({
  email,
  onModeChange,
  onVerified,
}: {
  email: string;
  onModeChange: (mode: AuthModalMode) => void;
  onVerified: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await verifyEmail({ email, code });
      onVerified();
    } catch {
      setError('El código no es válido o ya expiró. Revisa tu correo e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setMessage('');

    try {
      await resendVerificationCode(email);
      setMessage('Te enviamos un nuevo código. Revisa tu correo.');
    } catch {
      setMessage('Si la cuenta existe, enviamos un nuevo código.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
        <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-text">Revisa tu correo</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-subtle">
        Enviamos un código de 6 dígitos a{' '}
        <span className="font-medium text-text">{email || 'tu correo'}</span>. Intróducelo para
        confirmar tu cuenta.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <input
          id="verification-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="h-14 w-full rounded-xl border border-border bg-surface px-4 text-center text-2xl font-mono tracking-[0.5em] text-text outline-none transition placeholder:text-border focus:border-primary focus:ring-2 focus:ring-primary/15"
        />

        {error && <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        {message && <p className="rounded-xl bg-positive/10 p-3 text-sm text-positive">{message}</p>}

        <Button type="submit" disabled={loading || code.length !== 6} className="h-11 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Verificar cuenta
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          className="text-sm text-subtle transition hover:text-text disabled:opacity-50"
          onClick={handleResend}
          disabled={resendLoading}
        >
          {resendLoading ? 'Enviando...' : '¿No recibiste el código? Reenviar'}
        </button>
      </div>

      <div className="mt-3 text-center">
        <button
          type="button"
          className="text-sm font-medium text-primary hover:text-primary-strong"
          onClick={() => onModeChange('login')}
        >
          Volver a iniciar sesión
        </button>
      </div>
    </div>
  );
}
