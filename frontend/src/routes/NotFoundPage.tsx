import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/button';

export function NotFoundPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Página no encontrada"
        description="La ruta que intentaste abrir no existe en Neyqo."
      />
      <Link to="/app/dashboard">
        <Button variant="secondary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al dashboard
        </Button>
      </Link>
    </div>
  );
}
