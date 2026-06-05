import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

export function SessionExpired() {
  return (
    <div className="rounded-panel border border-warning/20 bg-warning/5 p-4 text-sm text-warning">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>Tu sesión expiró. Vuelve a iniciar sesión para continuar usando Neyqo.</p>
        <Link to="/login">
          <Button variant="secondary">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Iniciar sesión
          </Button>
        </Link>
      </div>
    </div>
  );
}
