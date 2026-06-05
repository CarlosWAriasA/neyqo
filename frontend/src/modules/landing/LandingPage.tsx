import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Menu,
  Moon,
  PieChart,
  ReceiptText,
  RefreshCw,
  Sun,
  Tags,
  WalletCards,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthModal, type AuthModalMode } from '../../components/forms/AuthModal';
import { BrandMark } from '../../components/navigation/BrandMark';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { useTheme } from '../../theme/theme-context';
import { resolveTheme } from '../../theme/theme';
import { formatCurrency } from '../../utils/format';

const benefits = [
  {
    title: 'Registra tus gastos',
    icon: ReceiptText,
    text: 'Anota tus compras y pagos fácilmente para saber exactamente en qué se va tu dinero.',
  },
  {
    title: 'Controla tus ingresos',
    icon: WalletCards,
    text: 'Registra tu salario, trabajos adicionales y cualquier entrada de dinero en un solo lugar.',
  },
  {
    title: 'Organiza tus cuentas',
    icon: CreditCard,
    text: 'Mantén separadas tus cuentas bancarias, tarjetas, efectivo y billeteras digitales.',
  },
  {
    title: 'Crea presupuestos',
    icon: PieChart,
    text: 'Define límites mensuales y revisa cuánto puedes gastar antes de excederte.',
  },
  {
    title: 'Programa movimientos',
    icon: CalendarClock,
    text: 'Automatiza registros frecuentes como tu salario, alquiler, servicios o suscripciones.',
  },
  {
    title: 'Analiza tus hábitos',
    icon: BarChart3,
    text: 'Consulta reportes sencillos y entiende cómo cambian tus finanzas con el tiempo.',
  },
];

const navItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Automatización', href: '#automatizacion' },
];

function coerceMode(value: string | null): 'login' | 'register' | 'forgot-password' | null {
  return value === 'login' || value === 'register' || value === 'forgot-password' ? value : null;
}

export function LandingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { preference, setPreference } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const urlMode = coerceMode(searchParams.get('auth'));
  const [localMode, setLocalMode] = useState<AuthModalMode | null>(null);
  const authMode: AuthModalMode | null = localMode ?? urlMode;
  const year = new Date().getFullYear();
  const resolvedTheme = useMemo(() => resolveTheme(preference), [preference]);

  useEffect(() => {
    setMenuOpen(false);
  }, [authMode]);

  const openAuth = (mode: AuthModalMode) => {
    if (mode === 'verify-email') {
      setLocalMode('verify-email');
    } else {
      setLocalMode(null);
      setSearchParams({ auth: mode });
    }
  };

  const closeAuth = () => {
    setLocalMode(null);
    navigate('/', { replace: true });
  };

  const toggleTheme = () => {
    setPreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const nav = (
    <>
      {navItems.map((item) => (
        <a key={item.href} href={item.href} className="text-sm font-medium text-subtle transition hover:text-text">
          {item.label}
        </a>
      ))}
    </>
  );

  return (
    <div className="overflow-hidden">
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
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={resolvedTheme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" onClick={() => openAuth('login')}>Iniciar sesión</Button>
            <Button onClick={() => openAuth('register')}>Crear cuenta</Button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema">
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menú">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {menuOpen ? (
          <div className="grid gap-3 border-t border-border bg-surface px-4 py-4 md:hidden">
            {nav}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="secondary" onClick={() => openAuth('login')}>Iniciar sesión</Button>
              <Button onClick={() => openAuth('register')}>Crear cuenta</Button>
            </div>
          </div>
        ) : null}
      </header>

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
            Toma el control de tu dinero sin complicarte.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-subtle">
            Registra tus ingresos y gastos, organiza tus cuentas y entiende mejor en qué estás
            utilizando tu dinero.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => openAuth('register')}>
              Crear cuenta gratis
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="secondary" onClick={() => openAuth('login')}>Iniciar sesión</Button>
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

      <section id="beneficios" className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-text">Todo lo que necesitas para ordenar tus finanzas</h2>
            <p className="mt-3 leading-7 text-subtle">
              Una forma clara de ver tu dinero, tus hábitos y tus próximos pagos.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
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
                <span className="flex justify-between"><b>Supermercado</b> {formatCurrency(6200)}</span>
                <span className="flex justify-between"><b>Salario</b> {formatCurrency(84000)}</span>
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

      <section id="como-funciona" className="border-y border-border bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-3xl font-semibold text-text">Cómo funciona</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Agrega tus cuentas', 'Registra dónde manejas tu dinero: efectivo, cuentas bancarias, tarjetas o billeteras digitales.'],
              ['Organiza tus movimientos', 'Registra ingresos y gastos manualmente o configura movimientos frecuentes para ahorrar tiempo.'],
              ['Consulta tu progreso', 'Revisa tus presupuestos, reportes y hábitos de consumo desde un panel sencillo.'],
            ].map(([title, text], index) => (
              <Card key={title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-panel bg-primary-soft font-semibold text-primary">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold text-text">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-subtle">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

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
              {['Menos registros manuales', 'Mayor control de tus tarjetas', 'Revisión sencilla de movimientos detectados', 'Conexión opcional y configurable'].map((item) => (
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
              <RefreshCw className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            {[
              ['Restaurante', 1850],
              ['Farmacia', 920],
              ['Gasolina', 2500],
            ].map(([name, amount]) => (
              <div key={name} className="flex items-center justify-between rounded-panel border border-border p-3">
                <span className="font-medium text-text">{name}</span>
                <span className="text-subtle">{formatCurrency(Number(amount))}</span>
              </div>
            ))}
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:px-8">
        <Tags className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
        <h2 className="mt-4 text-3xl font-semibold text-text">Empieza a entender mejor tu dinero</h2>
        <p className="mt-3 text-subtle">Crea tu cuenta y organiza tus finanzas desde una experiencia simple.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => openAuth('register')}>Crear cuenta gratis</Button>
          <Button variant="secondary" onClick={() => openAuth('login')}>Iniciar sesión</Button>
        </div>
      </section>

      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 text-sm text-subtle md:grid-cols-[1fr_auto] md:items-center md:px-8">
          <div>
            <p className="font-semibold text-text">Neyqo</p>
            <p className="mt-1">Finanzas personales claras para decisiones más simples. © {year}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="#beneficios">Beneficios</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <Link to="/privacy">Privacidad</Link>
            <Link to="/terms">Términos</Link>
            <a href="mailto:contacto@neyqo.app">Contacto</a>
          </div>
        </div>
      </footer>

      <AuthModal mode={authMode} onClose={closeAuth} onModeChange={openAuth} />
    </div>
  );
}

function DashboardPreview() {
  return (
    <Card className="relative p-5 shadow-panel">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-subtle">Balance disponible</p>
          <p className="text-3xl font-semibold text-text">{formatCurrency(184250)}</p>
        </div>
        <Badge tone="income">+12.4%</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="bg-muted shadow-none">
          <p className="text-sm text-subtle">Ingresos</p>
          <p className="mt-2 text-xl font-semibold text-positive">{formatCurrency(96500)}</p>
        </Card>
        <Card className="bg-muted shadow-none">
          <p className="text-sm text-subtle">Gastos</p>
          <p className="mt-2 text-xl font-semibold text-danger">{formatCurrency(58400)}</p>
        </Card>
      </div>
      <div className="mt-5 grid gap-3">
        {['Alimentación', 'Transporte', 'Servicios'].map((item, index) => (
          <div key={item}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-text">{item}</span>
              <span className="text-subtle">{[83, 63, 42][index]}%</span>
            </div>
            <div className="h-2 rounded-full bg-border">
              <motion.div
                className="h-2 rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${[83, 63, 42][index]}%` }}
                transition={{ delay: 0.3 + index * 0.08, duration: 0.45 }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
