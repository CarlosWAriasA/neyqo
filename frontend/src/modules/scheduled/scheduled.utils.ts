import type { AxiosError } from 'axios';
import type { ScheduledTransactionPayload } from '../../api/financial';
import type { ScheduledMovement } from '../../types/financial';
import { formatCurrency, formatDate } from '../../utils/format';
import { months, weekDays } from './scheduled.constants';
import type { ScheduledFormSubmitValues, ScheduledFormValues } from './scheduled.schema';

export function toScheduledPayload(values: ScheduledFormSubmitValues): ScheduledTransactionPayload {
  return {
    type: values.type,
    name: values.name.trim(),
    amount: values.amount,
    sourceAccountId: values.sourceAccountId,
    categoryId: values.categoryId,
    frequency: values.frequency,
    dayOfWeek: values.frequency === 'weekly' ? values.dayOfWeek : undefined,
    daysOfMonth: getDaysOfMonth(values),
    monthOfYear: values.frequency === 'yearly' ? values.monthOfYear : undefined,
    startDate: values.startDate,
    endDate: values.endDate || undefined,
    description: values.description?.trim() || undefined,
  };
}

export function toFormValues(item: ScheduledMovement): ScheduledFormValues {
  return {
    type: item.type,
    name: item.name,
    amount: item.amount,
    sourceAccountId: item.sourceAccountId ?? '',
    categoryId: item.categoryId ?? '',
    frequency: item.frequency,
    dayOfWeek: item.dayOfWeek ?? 1,
    firstDayOfMonth: item.daysOfMonth?.[0] ?? 15,
    secondDayOfMonth: item.daysOfMonth?.[1] ?? 30,
    monthOfYear: item.monthOfYear ?? 1,
    startDate: item.startDate,
    endDate: item.endDate ?? '',
    description: item.description ?? '',
  };
}

export function formatFrequency(item: ScheduledMovement) {
  if (item.frequency === 'weekly') {
    return `Semanal · cada ${weekDays.find((day) => day.value === item.dayOfWeek)?.label.toLowerCase() ?? 'semana'}`;
  }

  if (item.frequency === 'biweekly') {
    return `Quincenal · días ${(item.daysOfMonth ?? []).join(' y ')}`;
  }

  if (item.frequency === 'monthly') {
    return `Mensual · cada día ${item.daysOfMonth?.[0] ?? 1}`;
  }

  return `Anual · cada ${item.daysOfMonth?.[0] ?? 1} de ${months[(item.monthOfYear ?? 1) - 1].toLowerCase()}`;
}

export function buildPreview(params: {
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  frequency: ScheduledMovement['frequency'];
  startDate: string;
  dayOfWeek: number;
  firstDayOfMonth: number;
  secondDayOfMonth: number;
  monthOfYear: number;
}) {
  const typeLabel = params.type === 'income' ? 'ingreso' : 'gasto';
  const category = params.category ?? 'la categoría seleccionada';
  const amount = params.amount > 0 ? formatCurrency(params.amount) : 'un monto';
  const cadence =
    params.frequency === 'weekly'
      ? `cada ${weekDays.find((day) => day.value === params.dayOfWeek)?.label.toLowerCase() ?? 'semana'}`
      : params.frequency === 'biweekly'
        ? `los días ${params.firstDayOfMonth} y ${params.secondDayOfMonth} de cada mes`
        : params.frequency === 'monthly'
          ? `cada día ${params.firstDayOfMonth} del mes`
          : `cada ${params.firstDayOfMonth} de ${months[params.monthOfYear - 1].toLowerCase()}`;
  const start = params.startDate ? ` a partir del ${formatDate(params.startDate)}` : '';

  return `Se registrará un ${typeLabel} de ${amount} en ${category} ${cadence}${start}.`;
}

export function summarizeUpcoming(upcoming: Array<{ type: 'income' | 'expense'; amount: number }>) {
  const expenseTotal = upcoming
    .filter((item) => item.type === 'expense')
    .reduce((total, item) => total + item.amount, 0);
  const incomeTotal = upcoming
    .filter((item) => item.type === 'income')
    .reduce((total, item) => total + item.amount, 0);

  return {
    expenseTotal,
    incomeTotal,
    balance: incomeTotal - expenseTotal,
  };
}

export function getScheduledErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}

function getDaysOfMonth(values: ScheduledFormSubmitValues) {
  if (values.frequency === 'weekly') {
    return undefined;
  }

  if (values.frequency === 'biweekly') {
    return [values.firstDayOfMonth ?? 15, values.secondDayOfMonth ?? 30];
  }

  return [values.firstDayOfMonth ?? 1];
}
