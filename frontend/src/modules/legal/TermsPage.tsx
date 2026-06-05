import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export function TermsPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-12 md:px-8">
      <PageHeader title="Términos" description="Documento inicial para los términos de uso de Neyqo." />
      <Card className="grid gap-4 text-sm leading-7 text-subtle">
        <p>Neyqo ayuda a organizar información financiera personal, pero no reemplaza asesoría financiera profesional.</p>
        <p>Las integraciones externas dependerán de configuración, consentimiento y disponibilidad de proveedores.</p>
        <p>Estos términos deberán revisarse antes de publicar el producto.</p>
      </Card>
      <Link to="/">
        <Button variant="secondary">Volver</Button>
      </Link>
    </div>
  );
}
