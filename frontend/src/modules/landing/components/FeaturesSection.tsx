import { motion } from 'motion/react';
import { Card } from '../../../components/ui/card';
import { formatCurrency } from '../../../utils/format';
import { featureTransactions } from '../landing.constants';

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold text-text">Una vista clara para cada decisión</h2>
          <p className="mt-3 leading-7 text-subtle">
            Consulta resumen mensual, últimas transacciones, presupuestos, movimientos programados
            y distribución de gastos sin perderte entre datos innecesarios.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm text-subtle">Resumen mensual</p>
            <p className="mt-2 text-2xl font-semibold text-text">{formatCurrency(38100)}</p>
            <p className="mt-2 text-sm text-positive">Diferencia positiva</p>
          </Card>
          <Card>
            <p className="text-sm text-subtle">Últimas transacciones</p>
            <div className="mt-4 grid gap-3 text-sm">
              {featureTransactions.map(([name, amount]) => (
                <span key={name} className="flex justify-between">
                  <b>{name}</b> {formatCurrency(amount)}
                </span>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-sm text-subtle">Presupuesto alimentación</p>
            <div className="mt-4 h-3 rounded-full bg-border">
              <motion.div className="h-3 rounded-full bg-warning" initial={{ width: 0 }} whileInView={{ width: '83%' }} />
            </div>
            <p className="mt-2 text-sm text-subtle">83% utilizado</p>
          </Card>
          <Card>
            <p className="text-sm text-subtle">Programado próximo</p>
            <p className="mt-2 font-semibold text-text">Alquiler</p>
            <p className="mt-1 text-sm text-subtle">{formatCurrency(32000)} · Mensual</p>
          </Card>
        </div>
      </div>
    </section>
  );
}
