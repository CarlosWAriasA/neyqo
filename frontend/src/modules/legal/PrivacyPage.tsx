import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export function PrivacyPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6 px-4 py-12 md:px-8">
      <PageHeader title="Privacidad" description="Documento inicial para la política de privacidad de Neyqo." />
      <Card className="grid gap-4 text-sm leading-7 text-subtle">
        <p>Neyqo debe tratar los datos financieros con cuidado, transparencia y control del usuario.</p>
        <p>La lectura de correos para sincronización será opcional y requerirá consentimiento separado.</p>
        <p>No deben almacenarse secretos ni tokens externos en texto plano.</p>
      </Card>
      <Link to="/">
        <Button variant="secondary">Volver</Button>
      </Link>
    </div>
  );
}
