import { describe, expect, it } from 'vitest';
import type { ScheduledTransactionRecord } from '../../src/jobs/scheduled-transactions/types';
import { resolveDueExecutionDates, resolveNextExecutionDate } from '../../src/jobs/scheduled-transactions/date-utils';

function schedule(overrides: Partial<ScheduledTransactionRecord>): ScheduledTransactionRecord {
  return {
    id: 'scheduled-1',
    userId: 'user-1',
    type: 'expense',
    name: 'Netflix',
    description: 'Netflix',
    amount: '650.00',
    sourceAccountId: 'account-1',
    categoryId: 'category-1',
    frequency: 'monthly',
    dayOfWeek: null,
    daysOfMonth: [15],
    monthOfYear: null,
    startDate: '2026-01-01',
    endDate: null,
    nextExecutionDate: '2026-06-15',
    lastExecutionDate: null,
    status: 'active',
    lockedBy: null,
    lockedUntil: null,
    lastError: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('scheduled transaction date utilities', () => {
  it('procesa un gasto mensual pendiente', () => {
    const dueDates = resolveDueExecutionDates(schedule({ nextExecutionDate: '2026-06-15' }), '2026-06-17', 100);

    expect(dueDates).toEqual(['2026-06-15']);
    expect(resolveNextExecutionDate(schedule({ daysOfMonth: [15] }), '2026-06-15')).toBe('2026-07-15');
  });

  it('procesa un ingreso quincenal pendiente', () => {
    const dueDates = resolveDueExecutionDates(
      schedule({
        type: 'income',
        frequency: 'biweekly',
        daysOfMonth: [15, 30],
        nextExecutionDate: '2026-06-15',
      }),
      '2026-06-30',
      100,
    );

    expect(dueDates).toEqual(['2026-06-15', '2026-06-30']);
  });

  it('registra correctamente una ejecución semanal', () => {
    const next = resolveNextExecutionDate(
      schedule({
        frequency: 'weekly',
        dayOfWeek: 1,
        daysOfMonth: null,
      }),
      '2026-06-08',
    );

    expect(next).toBe('2026-06-15');
  });

  it('registra correctamente una ejecución anual', () => {
    const next = resolveNextExecutionDate(
      schedule({
        frequency: 'yearly',
        daysOfMonth: [10],
        monthOfYear: 1,
      }),
      '2026-01-10',
    );

    expect(next).toBe('2027-01-10');
  });

  it('resuelve el día 31 en febrero usando el último día disponible', () => {
    const next = resolveNextExecutionDate(schedule({ daysOfMonth: [31] }), '2026-01-31');

    expect(next).toBe('2026-02-28');
  });

  it('recupera varias ejecuciones atrasadas con sus fechas originales', () => {
    const dueDates = resolveDueExecutionDates(
      schedule({
        daysOfMonth: [15],
        nextExecutionDate: '2026-04-15',
      }),
      '2026-06-17',
      100,
    );

    expect(dueDates).toEqual(['2026-04-15', '2026-05-15', '2026-06-15']);
  });

  it('aplica el límite de seguridad para atrasos', () => {
    const dueDates = resolveDueExecutionDates(
      schedule({
        frequency: 'weekly',
        dayOfWeek: 1,
        daysOfMonth: null,
        nextExecutionDate: '2026-01-05',
      }),
      '2026-03-30',
      3,
    );

    expect(dueDates).toHaveLength(3);
  });
});
