import type { AuthModalMode } from '../../../components/forms/AuthModal';
import { Button } from '../../../components/ui/button';
import { ctaIcon } from '../landing.constants';

interface CtaSectionProps {
  onAuthOpen: (mode: AuthModalMode) => void;
}

export function CtaSection({ onAuthOpen }: CtaSectionProps) {
  const CtaIcon = ctaIcon;

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 text-center md:px-8">
      <CtaIcon className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
      <h2 className="mt-4 text-3xl font-semibold text-text">Empieza a entender mejor tu dinero</h2>
      <p className="mt-3 text-subtle">Crea tu cuenta y organiza tus finanzas desde una experiencia simple.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={() => onAuthOpen('register')}>Crear cuenta gratis</Button>
        <Button variant="secondary" onClick={() => onAuthOpen('login')}>
          Iniciar sesión
        </Button>
      </div>
    </section>
  );
}
