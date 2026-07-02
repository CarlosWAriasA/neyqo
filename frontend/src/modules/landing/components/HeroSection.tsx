import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { AuthModalMode } from '../../../components/forms/AuthModal';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { DashboardPreview } from './DashboardPreview';

interface HeroSectionProps {
  onAuthOpen: (mode: AuthModalMode) => void;
}

export function HeroSection({ onAuthOpen }: HeroSectionProps) {
  return (
    <section
      id="inicio"
      className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-4 py-14 md:px-8 lg:grid-cols-[1fr_0.95fr]"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
      >
        <Badge tone="transfer">Finanzas personales simples</Badge>
        <h1 className="mt-6 text-4xl font-semibold leading-tight text-text md:text-6xl">
          Neyqo: toma el control de tus finanzas personales.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-subtle">
          Registra tus ingresos y gastos, organiza tus cuentas y entiende mejor en qué estás
          utilizando tu dinero.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => onAuthOpen('register')}>
            Crear cuenta gratis
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="secondary" onClick={() => onAuthOpen('login')}>
            Iniciar sesión
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.42, ease: 'easeOut' }}
      >
        <DashboardPreview />
      </motion.div>
    </section>
  );
}
