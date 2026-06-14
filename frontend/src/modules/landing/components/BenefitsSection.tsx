import { motion } from 'motion/react';
import { Card } from '../../../components/ui/card';
import { landingBenefits } from '../landing.constants';

export function BenefitsSection() {
  return (
    <section id="beneficios" className="border-y border-border bg-surface py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold text-text">Todo lo que necesitas para ordenar tus finanzas</h2>
          <p className="mt-3 leading-7 text-subtle">
            Una forma clara de ver tu dinero, tus hábitos y tus próximos pagos.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {landingBenefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.03, duration: 0.24 }}
            >
              <Card className="h-full transition hover:-translate-y-1 hover:shadow-panel">
                <benefit.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-semibold text-text">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-subtle">{benefit.text}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
