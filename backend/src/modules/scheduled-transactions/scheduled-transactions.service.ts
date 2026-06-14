import { DataSource, type EntityManager } from 'typeorm';
import { Brackets } from 'typeorm';
import { Account } from '../../entities/account.entity';
import { Category } from '../../entities/category.entity';
import { ScheduledTransaction } from '../../entities/scheduled-transaction.entity';
import { Transaction } from '../../entities/transaction.entity';
import { AuthError } from '../auth/auth.service';
import type {
  CreateScheduledTransactionInput,
  ListGeneratedTransactionsQuery,
  ListScheduledTransactionsQuery,
  UpdateScheduledTransactionInput,
} from './scheduled-transactions.schemas';
import { decodeCursor, encodeCursor, type PaginatedResponse, toPaginatedResponse } from '../../utils/pagination';
import { z } from 'zod';

interface ScheduleInput {
  frequency: ScheduledTransaction['frequency'];
  dayOfWeek?: number | null;
  daysOfMonth?: number[] | null;
  monthOfYear?: number | null;
  startDate: string;
  endDate?: string | null;
}

export interface ScheduledTransactionResponse {
  id: string;
  type: ScheduledTransaction['type'];
  name: string;
  description?: string;
  amount: number;
  sourceAccountId: string;
  account: string;
  categoryId: string;
  category: string;
  categoryIcon?: string;
  frequency: ScheduledTransaction['frequency'];
  dayOfWeek?: number;
  daysOfMonth?: number[];
  monthOfYear?: number;
  startDate: string;
  endDate?: string;
  nextExecutionDate?: string;
  lastExecutionDate?: string;
  status: ScheduledTransaction['status'] | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingScheduledMovement {
  id: string;
  scheduledTransactionId: string;
  type: ScheduledTransaction['type'];
  name: string;
  amount: number;
  category: string;
  account: string;
  date: string;
}

export interface ScheduledSummary {
  expenseTotal: number;
  incomeTotal: number;
  balance: number;
}

const scheduledCursorSchema = z.object({
  status: z.string(),
  nextExecutionDate: z.string(),
  createdAt: z.string(),
  id: z.uuid(),
});

const generatedTransactionCursorSchema = z.object({
  date: z.string(),
  id: z.uuid(),
});

export class ScheduledTransactionsService {
  constructor(private readonly dataSource: DataSource) {}

  async list(
    userId: string,
    filters: ListScheduledTransactionsQuery,
  ): Promise<PaginatedResponse<ScheduledTransactionResponse>> {
    const cursor = decodeCursor(filters.cursor, scheduledCursorSchema);
    const query = this.dataSource
      .getRepository(ScheduledTransaction)
      .createQueryBuilder('scheduled')
      .leftJoinAndSelect('scheduled.sourceAccount', 'sourceAccount')
      .leftJoinAndSelect('scheduled.category', 'category')
      .where('scheduled.userId = :userId', { userId });

    if (filters.status && filters.status !== 'all') {
      query.andWhere('scheduled.status = :status', { status: filters.status });
    }

    if (filters.type && filters.type !== 'all') {
      query.andWhere('scheduled.type = :type', { type: filters.type });
    }

    if (filters.query) {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where('LOWER(scheduled.name) LIKE :query', { query: `%${filters.query!.toLowerCase()}%` })
            .orWhere('LOWER(scheduled.description) LIKE :query', { query: `%${filters.query!.toLowerCase()}%` })
            .orWhere('LOWER(sourceAccount.name) LIKE :query', { query: `%${filters.query!.toLowerCase()}%` })
            .orWhere('LOWER(category.name) LIKE :query', { query: `%${filters.query!.toLowerCase()}%` });
        }),
      );
    }

    if (cursor) {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where('scheduled.status > :cursorStatus', { cursorStatus: cursor.status })
            .orWhere(
              new Brackets((sameStatus) => {
                sameStatus
                  .where('scheduled.status = :cursorStatus', { cursorStatus: cursor.status })
                  .andWhere('scheduled.nextExecutionDate > :cursorNextExecutionDate', {
                    cursorNextExecutionDate: cursor.nextExecutionDate,
                  });
              }),
            )
            .orWhere(
              new Brackets((sameStatusAndExecution) => {
                sameStatusAndExecution
                  .where('scheduled.status = :cursorStatus', { cursorStatus: cursor.status })
                  .andWhere('scheduled.nextExecutionDate = :cursorNextExecutionDate', {
                    cursorNextExecutionDate: cursor.nextExecutionDate,
                  })
                  .andWhere('scheduled.createdAt < :cursorCreatedAt', {
                    cursorCreatedAt: cursor.createdAt,
                  });
              }),
            )
            .orWhere(
              new Brackets((sameAll) => {
                sameAll
                  .where('scheduled.status = :cursorStatus', { cursorStatus: cursor.status })
                  .andWhere('scheduled.nextExecutionDate = :cursorNextExecutionDate', {
                    cursorNextExecutionDate: cursor.nextExecutionDate,
                  })
                  .andWhere('scheduled.createdAt = :cursorCreatedAt', {
                    cursorCreatedAt: cursor.createdAt,
                  })
                  .andWhere('scheduled.id < :cursorId', { cursorId: cursor.id });
              }),
            );
        }),
      );
    }

    const scheduledTransactions = await query
      .orderBy('scheduled.status', 'ASC')
      .addOrderBy('scheduled.nextExecutionDate', 'ASC')
      .addOrderBy('scheduled.createdAt', 'DESC')
      .addOrderBy('scheduled.id', 'DESC')
      .take(filters.limit + 1)
      .getMany();

    return toPaginatedResponse(
      scheduledTransactions.map((scheduled) => this.toResponse(scheduled)),
      filters.limit,
      (scheduled) =>
        encodeCursor({
          status: scheduled.status,
          nextExecutionDate: scheduled.nextExecutionDate,
          createdAt: scheduled.createdAt,
          id: scheduled.id,
        }),
    );
  }

  async getById(userId: string, scheduledTransactionId: string): Promise<ScheduledTransactionResponse> {
    return this.toResponse(await this.findOwnedScheduledTransaction(userId, scheduledTransactionId));
  }

  async create(userId: string, payload: CreateScheduledTransactionInput): Promise<ScheduledTransactionResponse> {
    return this.dataSource.transaction(async (manager) => {
      const resolved = await this.resolveInput(manager, userId, payload);
      const scheduled = manager.create(ScheduledTransaction, {
        userId,
        type: payload.type,
        name: payload.name.trim(),
        description: payload.description?.trim() || payload.name.trim(),
        amount: this.formatMoney(payload.amount),
        sourceAccountId: resolved.account.id,
        categoryId: resolved.category.id,
        frequency: payload.frequency,
        dayOfWeek: payload.frequency === 'weekly' ? payload.dayOfWeek ?? null : null,
        daysOfMonth: payload.frequency === 'weekly' ? null : this.normalizeDaysOfMonth(payload),
        monthOfYear: payload.frequency === 'yearly' ? payload.monthOfYear ?? null : null,
        startDate: payload.startDate,
        endDate: payload.endDate ?? null,
        nextExecutionDate: this.resolveFirstExecutionDate(payload),
        lastExecutionDate: null,
        status: 'active',
      });

      const saved = await manager.save(ScheduledTransaction, scheduled);
      return this.toResponse(await this.findOwnedScheduledTransaction(userId, saved.id, manager));
    });
  }

  async update(
    userId: string,
    scheduledTransactionId: string,
    payload: UpdateScheduledTransactionInput,
  ): Promise<ScheduledTransactionResponse> {
    return this.dataSource.transaction(async (manager) => {
      const scheduled = await this.findOwnedScheduledTransaction(userId, scheduledTransactionId, manager);
      const nextPayload = this.mergeSchedulePayload(scheduled, payload);
      const resolved = await this.resolveInput(manager, userId, nextPayload);

      scheduled.type = nextPayload.type;
      scheduled.name = nextPayload.name.trim();
      scheduled.description = nextPayload.description?.trim() || nextPayload.name.trim();
      scheduled.amount = this.formatMoney(nextPayload.amount);
      scheduled.sourceAccountId = resolved.account.id;
      scheduled.categoryId = resolved.category.id;
      scheduled.frequency = nextPayload.frequency;
      scheduled.dayOfWeek = nextPayload.frequency === 'weekly' ? nextPayload.dayOfWeek ?? null : null;
      scheduled.daysOfMonth = nextPayload.frequency === 'weekly' ? null : this.normalizeDaysOfMonth(nextPayload);
      scheduled.monthOfYear = nextPayload.frequency === 'yearly' ? nextPayload.monthOfYear ?? null : null;
      scheduled.startDate = nextPayload.startDate;
      scheduled.endDate = nextPayload.endDate ?? null;
      scheduled.nextExecutionDate = this.resolveFirstExecutionDate(nextPayload, scheduled.lastExecutionDate ?? undefined);
      scheduled.lastError = null;

      const saved = await manager.save(ScheduledTransaction, scheduled);
      return this.toResponse(await this.findOwnedScheduledTransaction(userId, saved.id, manager));
    });
  }

  async pause(userId: string, scheduledTransactionId: string): Promise<ScheduledTransactionResponse> {
    return this.setStatus(userId, scheduledTransactionId, 'paused');
  }

  async resume(userId: string, scheduledTransactionId: string): Promise<ScheduledTransactionResponse> {
    const scheduled = await this.findOwnedScheduledTransaction(userId, scheduledTransactionId);
    scheduled.status = 'active';
    scheduled.nextExecutionDate = this.resolveFirstExecutionDate(this.scheduleToInput(scheduled), scheduled.lastExecutionDate ?? undefined);
    const saved = await this.dataSource.getRepository(ScheduledTransaction).save(scheduled);
    return this.toResponse(await this.findOwnedScheduledTransaction(userId, saved.id));
  }

  async deactivate(userId: string, scheduledTransactionId: string): Promise<ScheduledTransactionResponse> {
    return this.setStatus(userId, scheduledTransactionId, 'inactive');
  }

  async upcoming(userId: string, days = 30): Promise<UpcomingScheduledMovement[]> {
    const schedules = await this.dataSource.getRepository(ScheduledTransaction).find({
      where: { userId, status: 'active' },
      relations: {
        sourceAccount: true,
        category: true,
      },
    });
    const targetDate = this.toDateOnly(this.addDays(new Date(), days));

    return schedules
      .flatMap((schedule) => this.resolveUpcomingForSchedule(schedule, targetDate))
      .sort((first, second) => first.date.localeCompare(second.date))
      .slice(0, 50);
  }

  async summary(userId: string): Promise<ScheduledSummary> {
    const upcoming = await this.upcoming(userId, 30);
    const expenseTotal = upcoming
      .filter((movement) => movement.type === 'expense')
      .reduce((total, movement) => total + movement.amount, 0);
    const incomeTotal = upcoming
      .filter((movement) => movement.type === 'income')
      .reduce((total, movement) => total + movement.amount, 0);

    return {
      expenseTotal,
      incomeTotal,
      balance: incomeTotal - expenseTotal,
    };
  }

  async generatedTransactions(
    userId: string,
    scheduledTransactionId: string,
    filters: ListGeneratedTransactionsQuery,
  ) {
    await this.findOwnedScheduledTransaction(userId, scheduledTransactionId);
    const cursor = decodeCursor(filters.cursor, generatedTransactionCursorSchema);
    const query = this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.sourceAccount', 'sourceAccount')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.scheduledTransactionId = :scheduledTransactionId', { scheduledTransactionId });

    if (cursor) {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where('transaction.date < :cursorDate', { cursorDate: cursor.date })
            .orWhere(
              new Brackets((sameDate) => {
                sameDate
                  .where('transaction.date = :cursorDate', { cursorDate: cursor.date })
                  .andWhere('transaction.id < :cursorId', { cursorId: cursor.id });
              }),
            );
        }),
      );
    }

    const transactions = await query
      .orderBy('transaction.date', 'DESC')
      .addOrderBy('transaction.id', 'DESC')
      .take(filters.limit + 1)
      .getMany();

    return toPaginatedResponse(
      transactions.map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        amount: Number(transaction.amount),
        type: transaction.type,
        account: transaction.sourceAccount.name,
        category: transaction.category?.name,
        status: transaction.status,
      })),
      filters.limit,
      (transaction) =>
        encodeCursor({
          date: transaction.date,
          id: transaction.id,
        }),
    );
  }

  async createInitialScheduledTransactions(userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [
        'neyqo-initial-salary-schedule',
        userId,
      ]);

      const existingSalarySchedules = await manager.find(ScheduledTransaction, {
        where: {
          userId,
          type: 'income',
          name: 'Salario mensual',
        },
        order: {
          createdAt: 'ASC',
        },
      });

      if (existingSalarySchedules.length > 0) {
        await this.cleanupDuplicateInitialSalarySchedules(manager, userId, existingSalarySchedules);
        return;
      }

      const account = await manager.findOne(Account, {
        where: {
          userId,
          name: 'Cuenta de Banco',
          status: 'active',
        },
      });
      const category = await manager.findOne(Category, {
        where: {
          userId,
          name: 'Salario',
          type: 'income',
          status: 'active',
        },
      });

      if (!account || !category) {
        return;
      }

      const startDate = this.toDateOnly(new Date());
      const scheduled = manager.create(ScheduledTransaction, {
        userId,
        type: 'income',
        name: 'Salario mensual',
        description: 'Ingreso recurrente de nómina.',
        amount: this.formatMoney(50000),
        sourceAccountId: account.id,
        categoryId: category.id,
        frequency: 'monthly',
        dayOfWeek: null,
        daysOfMonth: [30],
        monthOfYear: null,
        startDate,
        endDate: null,
        nextExecutionDate: this.resolveFirstExecutionDate({
          frequency: 'monthly',
          daysOfMonth: [30],
          startDate,
        }),
        lastExecutionDate: null,
        status: 'active',
        lockedBy: null,
        lockedUntil: null,
        lastError: null,
      });

      await manager.save(ScheduledTransaction, scheduled);
    });
  }

  private async cleanupDuplicateInitialSalarySchedules(
    manager: EntityManager,
    userId: string,
    schedules: ScheduledTransaction[],
  ): Promise<void> {
    const [, ...duplicates] = schedules;

    for (const duplicate of duplicates) {
      const generatedTransactionCount = await manager.count(Transaction, {
        where: {
          userId,
          scheduledTransactionId: duplicate.id,
        },
      });

      if (generatedTransactionCount === 0) {
        await manager.delete(ScheduledTransaction, {
          id: duplicate.id,
          userId,
        });
        continue;
      }

      if (duplicate.status !== 'inactive') {
        duplicate.status = 'inactive';
        duplicate.lockedBy = null;
        duplicate.lockedUntil = null;
        await manager.save(ScheduledTransaction, duplicate);
      }
    }
  }

  private async setStatus(
    userId: string,
    scheduledTransactionId: string,
    status: ScheduledTransaction['status'],
  ): Promise<ScheduledTransactionResponse> {
    const scheduled = await this.findOwnedScheduledTransaction(userId, scheduledTransactionId);
    scheduled.status = status;
    scheduled.lockedBy = null;
    scheduled.lockedUntil = null;
    const saved = await this.dataSource.getRepository(ScheduledTransaction).save(scheduled);
    return this.toResponse(await this.findOwnedScheduledTransaction(userId, saved.id));
  }

  private async resolveInput(manager: EntityManager, userId: string, payload: CreateScheduledTransactionInput) {
    const account = await manager.findOne(Account, {
      where: {
        id: payload.sourceAccountId,
        userId,
      },
    });

    if (!account) {
      throw new AuthError(404, 'No encontramos esa cuenta.');
    }

    if (account.status !== 'active') {
      throw new AuthError(400, 'Selecciona una cuenta activa.');
    }

    const category = await manager.findOne(Category, {
      where: {
        id: payload.categoryId,
        userId,
      },
    });

    if (!category) {
      throw new AuthError(404, 'No encontramos esa categoría.');
    }

    if (category.status !== 'active' || category.type !== payload.type) {
      throw new AuthError(400, 'Selecciona una categoría activa que coincida con el tipo.');
    }

    return { account, category };
  }

  private async findOwnedScheduledTransaction(
    userId: string,
    scheduledTransactionId: string,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<ScheduledTransaction> {
    const scheduled = await manager.findOne(ScheduledTransaction, {
      where: {
        id: scheduledTransactionId,
        userId,
      },
      relations: {
        sourceAccount: true,
        category: true,
      },
    });

    if (!scheduled) {
      throw new AuthError(404, 'No encontramos ese programado.');
    }

    return scheduled;
  }

  private mergeSchedulePayload(
    scheduled: ScheduledTransaction,
    payload: UpdateScheduledTransactionInput,
  ): CreateScheduledTransactionInput {
    return {
      type: payload.type ?? scheduled.type,
      name: payload.name ?? scheduled.name,
      description: payload.description ?? scheduled.description,
      amount: payload.amount ?? Number(scheduled.amount),
      sourceAccountId: payload.sourceAccountId ?? scheduled.sourceAccountId,
      categoryId: payload.categoryId ?? scheduled.categoryId,
      frequency: payload.frequency ?? scheduled.frequency,
      dayOfWeek: payload.dayOfWeek ?? scheduled.dayOfWeek ?? undefined,
      daysOfMonth: payload.daysOfMonth ?? scheduled.daysOfMonth ?? undefined,
      monthOfYear: payload.monthOfYear ?? scheduled.monthOfYear ?? undefined,
      startDate: payload.startDate ?? scheduled.startDate,
      endDate: payload.endDate ?? scheduled.endDate ?? undefined,
    };
  }

  private normalizeDaysOfMonth(payload: ScheduleInput): number[] | null {
    if (payload.frequency === 'weekly') {
      return null;
    }

    const days = payload.daysOfMonth ?? [1];
    return [...new Set(days)].sort((first, second) => first - second);
  }

  private resolveFirstExecutionDate(payload: ScheduleInput, afterDate?: string): string {
    const baseline = afterDate && afterDate >= payload.startDate ? afterDate : this.toDateOnly(this.addDays(this.parseDate(payload.startDate), -1));
    const next = this.resolveNextExecutionDate(payload, baseline);

    if (payload.endDate && next > payload.endDate) {
      return next;
    }

    return next;
  }

  private resolveUpcomingForSchedule(schedule: ScheduledTransaction, targetDate: string): UpcomingScheduledMovement[] {
    const movements: UpcomingScheduledMovement[] = [];
    let cursor = schedule.nextExecutionDate;

    for (let index = 0; index < 60 && cursor <= targetDate; index += 1) {
      if (!schedule.endDate || cursor <= schedule.endDate) {
        movements.push({
          id: `${schedule.id}:${cursor}`,
          scheduledTransactionId: schedule.id,
          type: schedule.type,
          name: schedule.name,
          amount: Number(schedule.amount),
          category: schedule.category.name,
          account: schedule.sourceAccount.name,
          date: cursor,
        });
      }

      cursor = this.resolveNextExecutionDate(this.scheduleToInput(schedule), cursor);
    }

    return movements;
  }

  private resolveNextExecutionDate(schedule: ScheduleInput, afterDate: string): string {
    let cursor = this.addDays(this.parseDate(afterDate), 1);

    for (let index = 0; index < 740; index += 1) {
      if (this.matchesScheduleDate(schedule, cursor)) {
        return this.toDateOnly(cursor);
      }

      cursor = this.addDays(cursor, 1);
    }

    throw new Error('No se pudo calcular la próxima fecha.');
  }

  private matchesScheduleDate(schedule: ScheduleInput, date: Date): boolean {
    if (schedule.frequency === 'weekly') {
      return schedule.dayOfWeek === date.getDay();
    }

    if (schedule.frequency === 'monthly' || schedule.frequency === 'biweekly') {
      const requestedDays = schedule.frequency === 'monthly' ? [schedule.daysOfMonth?.[0] ?? 1] : (schedule.daysOfMonth ?? []);
      return this.monthExecutionDates(date.getFullYear(), date.getMonth(), requestedDays).includes(this.toDateOnly(date));
    }

    const monthIndex = (schedule.monthOfYear ?? 1) - 1;
    const day = schedule.daysOfMonth?.[0] ?? 1;
    return date.getMonth() === monthIndex && this.monthExecutionDates(date.getFullYear(), monthIndex, [day]).includes(this.toDateOnly(date));
  }

  private monthExecutionDates(year: number, monthIndex: number, requestedDays: number[]): string[] {
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    return [...new Set(requestedDays.map((day) => this.toDateOnly(new Date(year, monthIndex, Math.min(day, lastDay)))))]
      .sort();
  }

  private scheduleToInput(schedule: ScheduledTransaction): ScheduleInput {
    return {
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek,
      daysOfMonth: schedule.daysOfMonth,
      monthOfYear: schedule.monthOfYear,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
    };
  }

  private parseDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private addDays(date: Date, days: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + days);
    return nextDate;
  }

  private toDateOnly(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private formatMoney(value: number): string {
    return value.toFixed(2);
  }

  private toResponse(scheduled: ScheduledTransaction): ScheduledTransactionResponse {
    return {
      id: scheduled.id,
      type: scheduled.type,
      name: scheduled.name,
      description: scheduled.description ?? undefined,
      amount: Number(scheduled.amount),
      sourceAccountId: scheduled.sourceAccountId,
      account: scheduled.sourceAccount.name,
      categoryId: scheduled.categoryId,
      category: scheduled.category.name,
      categoryIcon: scheduled.category.icon,
      frequency: scheduled.frequency,
      dayOfWeek: scheduled.dayOfWeek ?? undefined,
      daysOfMonth: scheduled.daysOfMonth ?? undefined,
      monthOfYear: scheduled.monthOfYear ?? undefined,
      startDate: scheduled.startDate,
      endDate: scheduled.endDate ?? undefined,
      nextExecutionDate: scheduled.nextExecutionDate,
      lastExecutionDate: scheduled.lastExecutionDate ?? undefined,
      status: scheduled.status,
      createdAt: scheduled.createdAt.toISOString(),
      updatedAt: scheduled.updatedAt.toISOString(),
    };
  }
}
