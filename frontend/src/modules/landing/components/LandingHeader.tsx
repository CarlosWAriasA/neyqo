import { Menu, Moon, Sun, X } from 'lucide-react';
import type { AuthModalMode } from '../../../components/forms/AuthModal';
import { BrandMark } from '../../../components/navigation/BrandMark';
import { Button } from '../../../components/ui/button';
import { landingNavItems } from '../landing.constants';

interface LandingHeaderProps {
  menuOpen: boolean;
  resolvedTheme: 'light' | 'dark';
  onMenuToggle: () => void;
  onThemeToggle: () => void;
  onAuthOpen: (mode: AuthModalMode) => void;
}

export function LandingHeader({
  menuOpen,
  resolvedTheme,
  onMenuToggle,
  onThemeToggle,
  onAuthOpen,
}: LandingHeaderProps) {
  const nav = (
    <>
      {landingNavItems.map((item) => (
        <a key={item.href} href={item.href} className="text-sm font-medium text-subtle transition hover:text-text">
          {item.label}
        </a>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
        <a href="#inicio" aria-label="Inicio de Neyqo">
          <BrandMark />
        </a>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Navegación de landing">
          {nav}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button
            className="sm:[&>svg]:h-6 sm:[&>svg]:w-6"
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            aria-label={resolvedTheme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button variant="ghost" onClick={() => onAuthOpen('login')}>
            Iniciar sesión
          </Button>
          <Button onClick={() => onAuthOpen('register')}>Crear cuenta</Button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={onThemeToggle} aria-label="Cambiar tema">
            {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onMenuToggle} aria-label="Abrir menú">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {menuOpen ? (
        <div className="grid gap-3 border-t border-border bg-surface px-4 py-4 md:hidden">
          {nav}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="secondary" onClick={() => onAuthOpen('login')}>
              Iniciar sesión
            </Button>
            <Button onClick={() => onAuthOpen('register')}>Crear cuenta</Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
