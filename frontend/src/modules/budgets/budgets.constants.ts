import type { Budget } from '../../types/financial';

export const budgetStatusCopy = {
  normal: { label: 'Normal', tone: 'income' as const, bar: 'bg-positive' },
  'moderate-warning': { label: 'Advertencia moderada', tone: 'warning' as const, bar: 'bg-warning' },
  'important-warning': { label: 'Advertencia importante', tone: 'warning' as const, bar: 'bg-warning' },
  exceeded: { label: 'Excedido', tone: 'expense' as const, bar: 'bg-danger' },
} satisfies Record<
  Budget['status'],
  { label: string; tone: 'income' | 'warning' | 'expense'; bar: string }
>;

export const budgetPeriodCopy = {
  monthly: 'Mensual',
  biweekly: 'Quincenal',
  weekly: 'Semanal',
} satisfies Record<Budget['period'], string>;

export const weekDayOptions = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];
