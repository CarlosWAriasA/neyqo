import { Link } from 'react-router-dom';

interface LandingFooterProps {
  year: number;
}

export function LandingFooter({ year }: LandingFooterProps) {
  return (
    <footer className="border-t border-border bg-surface py-8">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 text-sm text-subtle md:grid-cols-[1fr_auto] md:items-center md:px-8">
        <div>
          <p className="font-semibold text-text">Neyqo</p>
          <p className="mt-1">Finanzas personales claras para decisiones más simples. © {year}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="#beneficios">Beneficios</a>
          <a href="#funcionalidades">Funcionalidades</a>
          <Link to="/privacy">Privacidad</Link>
          <Link to="/terms">Términos</Link>
          <a href="mailto:contacto@neyqo.app">Contacto</a>
        </div>
      </div>
    </footer>
  );
}
