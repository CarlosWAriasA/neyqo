import { CheckCircle2 } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { formatCurrency } from '../../../utils/format';
import { automationBenefits, automationIcon, detectedMovements } from '../landing.constants';

export function AutomationSection() {
  const AutomationIcon = automationIcon;

  return (
    <section id="automatizacion" className="bg-primary-soft/45 py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Badge tone="warning">Próximamente</Badge>
          <h2 className="mt-4 text-3xl font-semibold text-text">Dedica menos tiempo a registrar gastos</h2>
          <p className="mt-4 leading-7 text-subtle">
            Conecta tu correo cuando lo necesites y permite que Neyqo identifique consumos enviados
            por tus bancos para ayudarte a mantener tus movimientos organizados.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-text">
            {automationBenefits.map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-positive" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <Card className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-subtle">Movimientos detectados</p>
              <p className="font-semibold text-text">Listos para revisar</p>
            </div>
            <AutomationIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          {detectedMovements.map(([name, amount]) => (
            <div key={name} className="flex items-center justify-between rounded-panel border border-border p-3">
              <span className="font-medium text-text">{name}</span>
              <span className="text-subtle">{formatCurrency(amount)}</span>
            </div>
          ))}
        </Card>
      </div>
    </section>
  );
}
