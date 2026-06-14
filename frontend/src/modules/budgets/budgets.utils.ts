import type { AxiosError } from 'axios';
import type { BudgetPayload } from '../../api/financial';
import type { Budget } from '../../types/financial';
import { formatDate } from '../../utils/format';
import { weekDayOptions } from './budgets.constants';
import type { BudgetFormSubmitValues, BudgetFormValues } from './budgets.schema';

export function toBudgetPayload(values: BudgetFormSubmitValues): BudgetPayload {
  return {
    ...values,
    resetDayOfMonth: values.period === 'weekly' ? null : values.resetDayOfMonth,
    resetDayOfWeek: values.period === 'weekly' ? values.resetDayOfWeek : null,
    categoryIds: [values.categoryId],
    description: values.description?.trim() || undefined,
  };
}

export function toBudgetFormValues(budget: Budget): BudgetFormValues {
  return {
    name: budget.name,
    maxAmount: budget.maxAmount,
    period: budget.period,
    resetDayOfMonth: budget.resetDayOfMonth ?? new Date().getDate(),
    resetDayOfWeek: budget.resetDayOfWeek ?? new Date().getDay(),
    categoryId: budget.categoryId ?? budget.categoryIds[0] ?? '',
    description: budget.description ?? '',
  };
}

export function getBudgetPeriodPreview(
  period: Budget['period'],
  resetDayOfMonth?: number,
  resetDayOfWeek?: number,
) {
  const now = new Date();
  const range =
    period === 'weekly'
      ? resolveWeeklyPreview(now, resetDayOfWeek ?? now.getDay())
      : period === 'biweekly'
        ? resolveBiweeklyPreview(now, resetDayOfMonth ?? now.getDate())
        : resolveMonthlyPreview(now, resetDayOfMonth ?? now.getDate());

  if (period === 'weekly') {
    const weekDay = weekDayOptions.find((day) => day.value === (resetDayOfWeek ?? now.getDay()))?.label ?? 'este día';
    return `Este presupuesto se reiniciará cada ${weekDay.toLowerCase()}. Período actual: ${formatDate(range.startDate)} al ${formatDate(range.endDate)}.`;
  }

  const resetDay = resetDayOfMonth ?? now.getDate();
  return `Este presupuesto se reiniciará cada día ${resetDay}. Período actual: ${formatDate(range.startDate)} al ${formatDate(range.endDate)}.`;
}

export function getBudgetErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}

function resolveWeeklyPreview(date: Date, resetDayOfWeek: number) {
  const target = parseLocalDate(toDateOnly(date));
  const daysSinceReset = (target.getDay() - resetDayOfWeek + 7) % 7;
  const start = addDays(target, -daysSinceReset);
  const end = addDays(start, 6);

  return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
}

function resolveBiweeklyPreview(date: Date, resetDayOfMonth: number) {
  const target = parseLocalDate(toDateOnly(date));
  const candidates = [
    getMonthResetDate(target.getFullYear(), target.getMonth() - 1, resetDayOfMonth),
    addDays(getMonthResetDate(target.getFullYear(), target.getMonth() - 1, resetDayOfMonth), 15),
    getMonthResetDate(target.getFullYear(), target.getMonth(), resetDayOfMonth),
    addDays(getMonthResetDate(target.getFullYear(), target.getMonth(), resetDayOfMonth), 15),
    getMonthResetDate(target.getFullYear(), target.getMonth() + 1, resetDayOfMonth),
  ].sort((first, second) => first.getTime() - second.getTime());

  for (let index = 0; index < candidates.length - 1; index += 1) {
    const start = candidates[index];
    const end = addDays(candidates[index + 1], -1);

    if (target >= start && target <= end) {
      return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
    }
  }

  return { startDate: toDateOnly(candidates[0]), endDate: toDateOnly(addDays(candidates[1], -1)) };
}

function resolveMonthlyPreview(date: Date, resetDayOfMonth: number) {
  const target = parseLocalDate(toDateOnly(date));
  let start = getMonthResetDate(target.getFullYear(), target.getMonth(), resetDayOfMonth);

  if (target < start) {
    start = getMonthResetDate(target.getFullYear(), target.getMonth() - 1, resetDayOfMonth);
  }

  const nextStart = getMonthResetDate(start.getFullYear(), start.getMonth() + 1, resetDayOfMonth);
  const end = addDays(nextStart, -1);

  return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
}

function getMonthResetDate(year: number, month: number, requestedDay: number) {
  const normalizedMonth = new Date(year, month, 1);
  const lastDay = new Date(normalizedMonth.getFullYear(), normalizedMonth.getMonth() + 1, 0).getDate();
  return new Date(normalizedMonth.getFullYear(), normalizedMonth.getMonth(), Math.min(requestedDay, lastDay));
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + days);
  return nextDate;
}

function parseLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateOnly(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
