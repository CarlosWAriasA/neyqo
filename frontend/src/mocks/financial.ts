import type {
  Account,
  Category,
  EmailSyncRun,
  ExternalConnection,
  ScheduledMovement,
} from '../types/financial';

export const mockAccounts: Account[] = [
  {
    id: 'acc-bank',
    name: 'Cuenta de Banco',
    type: 'bank',
    currency: 'DOP',
    initialBalance: 100000,
    currentBalance: 134250,
    description: 'Cuenta principal para ingresos, pagos y transferencias.',
    status: 'active',
    createdAt: '2026-05-01',
  },
  {
    id: 'acc-cash',
    name: 'Efectivo',
    type: 'cash',
    currency: 'DOP',
    initialBalance: 8000,
    currentBalance: 12500,
    description: 'Dinero disponible para gastos diarios.',
    status: 'active',
    createdAt: '2026-05-01',
  },
  {
    id: 'acc-credit-card',
    name: 'Tarjeta de credito',
    type: 'credit_card',
    currency: 'DOP',
    initialBalance: 0,
    currentBalance: -28500,
    description: 'Tarjeta para compras, pagos recurrentes y consumos pendientes.',
    status: 'active',
    createdAt: '2026-05-02',
  },
];

export const mockCategories: Category[] = [
  { id: 'cat-salary', name: 'Salario', type: 'income', icon: 'briefcase', priority: 10, status: 'active', createdAt: '2026-05-01' },
  { id: 'cat-food', name: 'Alimentación', type: 'expense', icon: 'utensils', priority: 10, status: 'active', createdAt: '2026-05-01' },
  { id: 'cat-transport', name: 'Transporte', type: 'expense', icon: 'car', priority: 30, status: 'active', createdAt: '2026-05-01' },
  { id: 'cat-services', name: 'Servicios', type: 'expense', icon: 'receipt', priority: 50, status: 'active', createdAt: '2026-05-01' },
  { id: 'cat-freelance', name: 'Trabajo independiente', type: 'income', icon: 'laptop', priority: 20, status: 'active', createdAt: '2026-05-05' },
];

export const mockScheduledMovements: ScheduledMovement[] = [
  {
    id: 'sch-salary',
    type: 'income',
    name: 'Salario',
    description: 'Ingreso recurrente de nómina.',
    amount: 84000,
    account: 'Cuenta de Banco',
    category: 'Salario',
    frequency: 'monthly',
    nextRunAt: '2026-06-27',
    nextExecutionDate: '2026-06-27',
    startDate: '2026-01-27',
    daysOfMonth: [27],
    startsAt: '2026-01-27',
    status: 'active',
  },
  {
    id: 'sch-rent',
    type: 'expense',
    name: 'Alquiler',
    description: 'Pago mensual de vivienda.',
    amount: 32000,
    account: 'Cuenta de Banco',
    category: 'Vivienda',
    frequency: 'monthly',
    nextRunAt: '2026-06-01',
    nextExecutionDate: '2026-06-01',
    startDate: '2026-01-01',
    daysOfMonth: [1],
    startsAt: '2026-01-01',
    status: 'active',
  },
  {
    id: 'sch-streaming',
    type: 'expense',
    name: 'Suscripción de streaming',
    amount: 650,
    account: 'Tarjeta de credito',
    category: 'Suscripciones',
    frequency: 'monthly',
    nextRunAt: '2026-06-08',
    nextExecutionDate: '2026-06-08',
    startDate: '2026-03-08',
    daysOfMonth: [8],
    startsAt: '2026-03-08',
    status: 'paused',
  },
];

export const mockExternalConnections: ExternalConnection[] = [
  {
    id: 'gmail-prep',
    provider: 'gmail',
    email: '',
    status: 'preparing',
    scopes: [],
    createdAt: '2026-05-30',
  },
  {
    id: 'outlook-prep',
    provider: 'outlook',
    email: '',
    status: 'preparing',
    scopes: [],
    createdAt: '2026-05-30',
  },
];

export const mockEmailSyncRuns: EmailSyncRun[] = [];
