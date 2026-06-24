import { FileText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/card';

const legalLinks = [
  {
    label: 'Política de privacidad',
    description: 'Cómo Neyqo trata datos financieros y conexiones como Gmail.',
    to: '/privacy',
    icon: ShieldCheck,
  },
  {
    label: 'Términos y condiciones',
    description: 'Reglas de uso y responsabilidades.',
    to: '/terms',
    icon: FileText,
  },
];

export function LegalCard() {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold text-text">Legal</h2>
      </div>
      <p className="mt-4 text-sm leading-6 text-subtle">Privacidad, datos de Google y condiciones de uso.</p>
      <div className="mt-5 grid gap-2">
        {legalLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              state={{ returnTo: '/app/settings' }}
              className="flex items-start gap-3 rounded-panel border border-border bg-muted/30 p-3 transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text">{item.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-subtle">{item.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
