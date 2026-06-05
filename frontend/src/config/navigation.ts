import {
  Banknote,
  BarChart3,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  Gauge,
  Landmark,
  ListChecks,
  RefreshCw,
  Settings,
  Tags,
  Wallet,
  WalletCards,
} from 'lucide-react';
import type { AccountType } from '../types/financial';
import type { NavigationItem } from '../types/navigation';

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/app/dashboard', icon: Gauge },
  { label: 'Cuentas', path: '/app/accounts', icon: Landmark },
  { label: 'Transacciones', path: '/app/transactions', icon: WalletCards },
  { label: 'Categorías', path: '/app/categories', icon: Tags },
  { label: 'Presupuestos', path: '/app/budgets', icon: ListChecks },
  { label: 'Programados', path: '/app/scheduled', icon: CalendarClock },
  { label: 'Sincronización', path: '/app/sync', icon: RefreshCw },
  { label: 'Reportes', path: '/app/reports', icon: BarChart3 },
  { label: 'Configuración', path: '/app/settings', icon: Settings },
];

export const quickActions = [
  { label: 'Registrar ingreso', tone: 'income' },
  { label: 'Registrar gasto', tone: 'expense' },
  { label: 'Agregar cuenta', tone: 'neutral' },
] as const;

export const accountTypeLabels = {
  cash: 'Efectivo',
  bank: 'Cuenta bancaria',
  debit_card: 'Tarjeta de débito',
  credit_card: 'Tarjeta de crédito',
  wallet: 'Billetera digital',
  other: 'Otra cuenta',
} as const;

export const accountTypeIcons = {
  cash: Banknote,
  bank: Landmark,
  debit_card: WalletCards,
  credit_card: CreditCard,
  wallet: Wallet,
  other: CircleDollarSign,
} as const satisfies Record<AccountType, typeof Banknote>;
