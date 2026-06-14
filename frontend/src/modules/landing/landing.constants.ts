import {
  BarChart3,
  CalendarClock,
  CreditCard,
  PieChart,
  ReceiptText,
  RefreshCw,
  Tags,
  WalletCards,
} from 'lucide-react';

export const landingNavItems = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Beneficios', href: '#beneficios' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Automatización', href: '#automatizacion' },
];

export const landingBenefits = [
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

export const howItWorksSteps = [
  ['Agrega tus cuentas', 'Registra dónde manejas tu dinero: efectivo, cuentas bancarias, tarjetas o billeteras digitales.'],
  ['Organiza tus movimientos', 'Registra ingresos y gastos manualmente o configura movimientos frecuentes para ahorrar tiempo.'],
  ['Consulta tu progreso', 'Revisa tus presupuestos, reportes y hábitos de consumo desde un panel sencillo.'],
] as const;

export const automationBenefits = [
  'Menos registros manuales',
  'Mayor control de tus tarjetas',
  'Revisión sencilla de movimientos detectados',
  'Conexión opcional y configurable',
];

export const detectedMovements = [
  ['Restaurante', 1850],
  ['Farmacia', 920],
  ['Gasolina', 2500],
] as const;

export const featureTransactions = [
  ['Supermercado', 6200],
  ['Salario', 84000],
] as const;

export const previewCategories = [
  ['Alimentación', 83],
  ['Transporte', 63],
  ['Servicios', 42],
] as const;

export const ctaIcon = Tags;
export const automationIcon = RefreshCw;
