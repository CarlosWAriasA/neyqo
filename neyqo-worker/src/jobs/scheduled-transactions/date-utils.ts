import type { ScheduledTransactionRecord } from './types';

const millisecondsPerDay = 86_400_000;

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function toDateOnly(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * millisecondsPerDay);
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function monthExecutionDates(year: number, monthIndex: number, requestedDays: number[]): string[] {
  const lastDay = lastDayOfMonth(year, monthIndex);
  const dates = requestedDays.map((day) => toDateOnly(new Date(Date.UTC(year, monthIndex, Math.min(day, lastDay)))));
  return [...new Set(dates)].sort();
}

export function matchesScheduledDate(schedule: Pick<ScheduledTransactionRecord, 'frequency' | 'dayOfWeek' | 'daysOfMonth' | 'monthOfYear'>, date: Date): boolean {
  if (schedule.frequency === 'weekly') {
    return schedule.dayOfWeek === date.getUTCDay();
  }

  if (schedule.frequency === 'biweekly' || schedule.frequency === 'monthly') {
    const requestedDays = schedule.frequency === 'biweekly' ? (schedule.daysOfMonth ?? []) : [schedule.daysOfMonth?.[0] ?? 1];
    return monthExecutionDates(date.getUTCFullYear(), date.getUTCMonth(), requestedDays).includes(toDateOnly(date));
  }

  const requestedDay = schedule.daysOfMonth?.[0] ?? 1;
  const requestedMonth = (schedule.monthOfYear ?? 1) - 1;

  if (date.getUTCMonth() !== requestedMonth) {
    return false;
  }

  return monthExecutionDates(date.getUTCFullYear(), requestedMonth, [requestedDay]).includes(toDateOnly(date));
}

export function resolveNextExecutionDate(schedule: ScheduledTransactionRecord, afterDate: string): string {
  let cursor = addDays(parseDateOnly(afterDate), 1);

  for (let index = 0; index < 740; index += 1) {
    const candidate = toDateOnly(cursor);

    if (matchesScheduledDate(schedule, cursor) && candidate >= schedule.startDate) {
      return candidate;
    }

    cursor = addDays(cursor, 1);
  }

  throw new Error(`No se pudo calcular la próxima fecha de ejecución para ${schedule.id}.`);
}

export function resolveDueExecutionDates(schedule: ScheduledTransactionRecord, targetDate: string, limit: number): string[] {
  const dueDates: string[] = [];
  let cursor = schedule.nextExecutionDate;

  while (cursor <= targetDate && dueDates.length < limit) {
    if (cursor >= schedule.startDate && (!schedule.endDate || cursor <= schedule.endDate)) {
      dueDates.push(cursor);
    }

    const nextCursor = resolveNextExecutionDate(schedule, cursor);

    if (nextCursor <= cursor) {
      throw new Error(`La frecuencia de ${schedule.id} produjo una fecha no progresiva.`);
    }

    cursor = nextCursor;

    if (schedule.endDate && cursor > schedule.endDate) {
      break;
    }
  }

  return dueDates;
}
