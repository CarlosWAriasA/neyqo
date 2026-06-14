import type { ScheduledMovement } from '../../types/financial';

export const frequencyLabel = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  yearly: 'Anual',
} satisfies Record<ScheduledMovement['frequency'], string>;

export const statusCopy = {
  active: {
    label: 'Activo',
    description: 'Se registrará automáticamente',
    tone: 'income' as const,
  },
  paused: {
    label: 'Pausado',
    description: 'No se registrará hasta que lo reactives',
    tone: 'warning' as const,
  },
  completed: {
    label: 'Finalizado',
    description: 'Alcanzó su fecha final',
    tone: 'neutral' as const,
  },
  inactive: {
    label: 'Desactivado',
    description: 'Ya no generará movimientos',
    tone: 'neutral' as const,
  },
} satisfies Record<
  ScheduledMovement['status'],
  { label: string; description: string; tone: 'income' | 'warning' | 'neutral' }
>;

export const weekDays = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

export const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
