import { DataSource, type EntityManager, In } from 'typeorm';
import { BudgetPeriodRecord, type BudgetPeriodStatus } from '../../entities/budget-period.entity';
import { Budget, type BudgetPeriod } from '../../entities/budget.entity';
import { Category } from '../../entities/category.entity';
import { Transaction } from '../../entities/transaction.entity';
import { AuthError } from '../auth/auth.service';
import type { CreateBudgetInput, UpdateBudgetInput } from './budgets.schemas';
import { initialBudgetTemplates } from './initial-budgets';

type BudgetProgressStatus = 'normal' | 'moderate-warning' | 'important-warning' | 'exceeded';

interface PeriodRange {
  label: string;
  startDate: string;
  endDate: string;
}

interface ResetConfig {
  resetDayOfMonth: number | null;
  resetDayOfWeek: number | null;
}

interface PeriodSummary {
  id: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  budgetedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: BudgetPeriodStatus;
  closedAt?: string;
}

export interface BudgetResponse {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  categoryIds: string[];
  categories: Array<{ id: string; name: string; icon: string }>;
  maxAmount: number;
  month: number;
  year: number;
  period: BudgetPeriod;
  startDate: string;
  resetDayOfMonth: number | null;
  resetDayOfWeek: number | null;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  periodHistory: PeriodSummary[];
  currentExpenses: Array<{ id: string; description: string; date: string; amount: number; category: string }>;
  daysRemaining: number;
  spentAmount: number;
  percentageUsed: number;
  remainingAmount: number;
  status: BudgetProgressStatus;
  recordStatus: Budget['status'];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export class BudgetsService {
  constructor(private readonly dataSource: DataSource) {}

  async list(userId: string): Promise<BudgetResponse[]> {
    const budgets = await this.dataSource.getRepository(Budget).find({
      where: { userId },
      relations: {
        categories: true,
      },
      order: {
        status: 'ASC',
        createdAt: 'ASC',
      },
    });

    return Promise.all(budgets.map((budget) => this.toResponse(budget)));
  }

  async getById(userId: string, budgetId: string): Promise<BudgetResponse> {
    const budget = await this.findOwnedBudget(userId, budgetId);
    return this.toResponse(budget);
  }

  async create(userId: string, payload: CreateBudgetInput): Promise<BudgetResponse> {
    const category = await this.resolveSingleExpenseCategory(userId, this.getRequestedCategoryId(payload));
    const now = new Date();
    const resetConfig = this.resolveResetConfig(payload.period, payload);
    const activeRange = this.resolveRangeForDate(payload.period, now, resetConfig);
    await this.assertNoActiveOverlap(userId, category.id, activeRange);

    const budget = this.dataSource.getRepository(Budget).create({
      userId,
      name: payload.name,
      maxAmount: this.formatMoney(payload.maxAmount),
      month: this.getPeriodMonth(activeRange),
      year: this.getPeriodYear(activeRange),
      period: payload.period,
      startDate: payload.startDate ?? this.toDateOnly(now),
      resetDayOfMonth: resetConfig.resetDayOfMonth,
      resetDayOfWeek: resetConfig.resetDayOfWeek,
      status: 'active',
      description: payload.description || null,
      categories: [category],
    });

    const savedBudget = await this.dataSource.getRepository(Budget).save(budget);
    await this.ensurePeriodsUpToCurrent(savedBudget);
    return this.getById(userId, savedBudget.id);
  }

  async update(userId: string, budgetId: string, payload: UpdateBudgetInput): Promise<BudgetResponse> {
    const budget = await this.findOwnedBudget(userId, budgetId);
    const nextPeriod = payload.period ?? budget.period;
    const nextResetConfig = this.resolveResetConfig(nextPeriod, {
      resetDayOfMonth: payload.resetDayOfMonth ?? budget.resetDayOfMonth,
      resetDayOfWeek: payload.resetDayOfWeek ?? budget.resetDayOfWeek,
    });
    const requestedCategoryId =
      payload.categoryId ?? (payload.categoryIds !== undefined ? this.getRequestedCategoryId(payload) : budget.categories[0]?.id);

    if (!requestedCategoryId) {
      throw new AuthError(400, 'Selecciona una categoría.');
    }

    const nextCategory = await this.resolveSingleExpenseCategory(userId, requestedCategoryId);
    const activeRange = this.resolveRangeForDate(nextPeriod, new Date(), nextResetConfig);
    await this.assertNoActiveOverlap(userId, nextCategory.id, activeRange, budget.id);

    if (payload.name !== undefined) {
      budget.name = payload.name;
    }

    if (payload.maxAmount !== undefined) {
      budget.maxAmount = this.formatMoney(payload.maxAmount);
    }

    if (payload.period !== undefined) {
      budget.period = payload.period;
    }

    if (payload.startDate !== undefined) {
      budget.startDate = payload.startDate;
    }

    if (
      payload.period !== undefined ||
      payload.resetDayOfMonth !== undefined ||
      payload.resetDayOfWeek !== undefined
    ) {
      budget.resetDayOfMonth = nextResetConfig.resetDayOfMonth;
      budget.resetDayOfWeek = nextResetConfig.resetDayOfWeek;
    }

    if (payload.description !== undefined) {
      budget.description = payload.description || null;
    }

    if (payload.categoryId !== undefined || payload.categoryIds !== undefined) {
      budget.categories = [nextCategory];
    }

    const currentRange = this.resolveRangeForDate(budget.period, new Date(), this.getBudgetResetConfig(budget));
    budget.month = this.getPeriodMonth(currentRange);
    budget.year = this.getPeriodYear(currentRange);

    const savedBudget = await this.dataSource.getRepository(Budget).save(budget);
    await this.ensurePeriodsUpToCurrent(savedBudget);
    return this.getById(userId, savedBudget.id);
  }

  async deactivate(userId: string, budgetId: string): Promise<BudgetResponse> {
    const budget = await this.findOwnedBudget(userId, budgetId);
    budget.status = 'inactive';

    const savedBudget = await this.dataSource.getRepository(Budget).save(budget);
    return this.getById(userId, savedBudget.id);
  }

  async reactivate(userId: string, budgetId: string): Promise<BudgetResponse> {
    const budget = await this.findOwnedBudget(userId, budgetId);
    const categoryId = budget.categories[0]?.id;

    if (!categoryId) {
      throw new AuthError(400, 'El presupuesto no tiene categoría asociada.');
    }

    const activeRange = this.resolveRangeForDate(budget.period, new Date(), this.getBudgetResetConfig(budget));
    await this.assertNoActiveOverlap(userId, categoryId, activeRange, budget.id);

    budget.status = 'active';
    const savedBudget = await this.dataSource.getRepository(Budget).save(budget);
    await this.ensurePeriodsUpToCurrent(savedBudget);
    return this.getById(userId, savedBudget.id);
  }

  async createInitialBudgets(userId: string): Promise<BudgetResponse[]> {
    const now = new Date();
    const createdBudgets: BudgetResponse[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (const template of initialBudgetTemplates) {
        const category = await manager.findOne(Category, {
          where: {
            userId,
            type: 'expense',
            status: 'active',
            name: template.categoryName,
          },
        });

        if (!category) {
          continue;
        }

        const existingBudget = await this.findBudgetForCategory(manager, userId, category.id);

        if (existingBudget) {
          continue;
        }

        const resetConfig = this.resolveResetConfig(template.period, {
          resetDayOfMonth: now.getDate(),
          resetDayOfWeek: now.getDay(),
        });
        const activeRange = this.resolveRangeForDate(template.period, now, resetConfig);
        const budget = manager.create(Budget, {
          userId,
          name: template.name,
          maxAmount: this.formatMoney(template.maxAmount),
          month: this.getPeriodMonth(activeRange),
          year: this.getPeriodYear(activeRange),
          period: template.period,
          startDate: activeRange.startDate,
          resetDayOfMonth: resetConfig.resetDayOfMonth,
          resetDayOfWeek: resetConfig.resetDayOfWeek,
          status: 'active',
          description: null,
          categories: [category],
        });

        const savedBudget = await manager.save(Budget, budget);
        await this.ensurePeriodsUpToCurrent(savedBudget, manager);
        createdBudgets.push(await this.toResponse(await this.findOwnedBudget(userId, savedBudget.id, manager)));
      }
    });

    return createdBudgets;
  }

  async getPeriodHistory(userId: string, budgetId: string): Promise<PeriodSummary[]> {
    const budget = await this.findOwnedBudget(userId, budgetId);
    await this.ensurePeriodsUpToCurrent(budget);
    return this.buildPeriodHistory(budget);
  }

  async getCurrentExpenses(userId: string, budgetId: string): Promise<BudgetResponse['currentExpenses']> {
    const budget = await this.findOwnedBudget(userId, budgetId);
    const currentRange = this.resolveRangeForDate(budget.period, new Date(), this.getBudgetResetConfig(budget));
    return this.getExpensesForRange(budget, currentRange);
  }

  private async resolveSingleExpenseCategory(userId: string, categoryId: string): Promise<Category> {
    const category = await this.dataSource.getRepository(Category).findOne({
      where: {
        id: categoryId,
        userId,
      },
    });

    if (!category) {
      throw new AuthError(404, 'No encontramos esa categoría.');
    }

    if (category.type !== 'expense' || category.status !== 'active') {
      throw new AuthError(400, 'Los presupuestos solo aceptan categorías de gasto activas.');
    }

    return category;
  }

  private getRequestedCategoryId(payload: CreateBudgetInput | UpdateBudgetInput): string {
    const categoryId = payload.categoryId ?? payload.categoryIds?.[0];

    if (!categoryId) {
      throw new AuthError(400, 'Selecciona una categoría.');
    }

    return categoryId;
  }

  private async assertNoActiveOverlap(
    userId: string,
    categoryId: string,
    range: PeriodRange,
    exceptBudgetId?: string,
  ): Promise<void> {
    const activeBudget = await this.findActiveBudgetForCategory(this.dataSource.manager, userId, categoryId, exceptBudgetId);

    if (!activeBudget) {
      return;
    }

    const activeBudgetRange = this.resolveRangeForDate(
      activeBudget.period,
      this.parseDate(range.startDate),
      this.getBudgetResetConfig(activeBudget),
    );

    if (this.rangesOverlap(range, activeBudgetRange)) {
      throw new AuthError(409, 'Ya existe un presupuesto activo para esa categoría en este período.');
    }
  }

  private async findActiveBudgetForCategory(
    manager: EntityManager,
    userId: string,
    categoryId: string,
    exceptBudgetId?: string,
  ): Promise<Budget | null> {
    const budgets = await manager.find(Budget, {
      where: {
        userId,
        status: 'active',
      },
      relations: {
        categories: true,
      },
    });

    return (
      budgets.find(
        (budget) => budget.id !== exceptBudgetId && budget.categories.some((category) => category.id === categoryId),
      ) ?? null
    );
  }

  private async findBudgetForCategory(
    manager: EntityManager,
    userId: string,
    categoryId: string,
  ): Promise<Budget | null> {
    const budgets = await manager.find(Budget, {
      where: {
        userId,
      },
      relations: {
        categories: true,
      },
    });

    return budgets.find((budget) => budget.categories.some((category) => category.id === categoryId)) ?? null;
  }

  private async findOwnedBudget(
    userId: string,
    budgetId: string,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<Budget> {
    const budget = await manager.findOne(Budget, {
      where: {
        id: budgetId,
        userId,
      },
      relations: {
        categories: true,
      },
    });

    if (!budget) {
      throw new AuthError(404, 'No encontramos ese presupuesto.');
    }

    return budget;
  }

  private async toResponse(budget: Budget): Promise<BudgetResponse> {
    if (budget.status === 'active') {
      await this.ensurePeriodsUpToCurrent(budget);
    }

    const currentRange = this.resolveRangeForDate(budget.period, new Date(), this.getBudgetResetConfig(budget));
    const periodHistory = await this.buildPeriodHistory(budget);
    const spentAmount = await this.calculateSpentAmount(budget, currentRange);
    const currentExpenses = await this.getExpensesForRange(budget, currentRange);
    const maxAmount = Number(budget.maxAmount);
    const percentageUsed = maxAmount > 0 ? Math.round((spentAmount / maxAmount) * 100) : 0;
    const categoryIds = budget.categories.map((category) => category.id);
    const categoryNames = budget.categories.map((category) => category.name);

    return {
      id: budget.id,
      name: budget.name,
      category: categoryNames.join(', '),
      categoryId: categoryIds[0],
      categoryIds,
      categories: budget.categories.map((category) => ({ id: category.id, name: category.name, icon: category.icon })),
      maxAmount,
      month: budget.month,
      year: budget.year,
      period: budget.period,
      startDate: this.getBudgetStartDate(budget),
      resetDayOfMonth: budget.resetDayOfMonth,
      resetDayOfWeek: budget.resetDayOfWeek,
      periodLabel: currentRange.label,
      periodStart: currentRange.startDate,
      periodEnd: currentRange.endDate,
      periodHistory,
      currentExpenses,
      daysRemaining: this.calculateDaysRemaining(currentRange.endDate),
      spentAmount,
      percentageUsed,
      remainingAmount: maxAmount - spentAmount,
      status: this.resolveProgressStatus(percentageUsed),
      recordStatus: budget.status,
      description: budget.description ?? undefined,
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    };
  }

  private async buildPeriodHistory(budget: Budget): Promise<PeriodSummary[]> {
    const periods = await this.dataSource.getRepository(BudgetPeriodRecord).find({
      where: {
        budgetId: budget.id,
        userId: budget.userId,
      },
      order: {
        startDate: 'DESC',
      },
    });

    return Promise.all(
      periods.map(async (period) => {
        const spentAmount = await this.calculateSpentAmount(budget, {
          label: '',
          startDate: period.startDate,
          endDate: period.endDate,
        });
        const budgetedAmount = Number(period.budgetedAmount);
        const percentageUsed = budgetedAmount > 0 ? Math.round((spentAmount / budgetedAmount) * 100) : 0;

        return {
          id: period.id,
          period: period.period,
          startDate: period.startDate,
          endDate: period.endDate,
          budgetedAmount,
          spentAmount,
          remainingAmount: budgetedAmount - spentAmount,
          percentageUsed,
          status: period.status,
          closedAt: period.closedAt?.toISOString(),
        };
      }),
    );
  }

  private async ensurePeriodsUpToCurrent(
    budget: Budget,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<void> {
    if (budget.status !== 'active') {
      return;
    }

    const now = new Date();
    const ranges = this.resolveRangesThroughDate(
      budget.period,
      this.getBudgetStartDate(budget),
      this.getBudgetResetConfig(budget),
      now,
    );
    const existingPeriods = await manager.find(BudgetPeriodRecord, {
      where: {
        budgetId: budget.id,
      },
    });

    for (const range of ranges) {
      const isCurrent = this.dateWithinRange(this.toDateOnly(now), range);
      const existingPeriod = existingPeriods.find(
        (period) => period.startDate === range.startDate && period.endDate === range.endDate,
      );

      if (existingPeriod) {
        const nextStatus: BudgetPeriodStatus = isCurrent ? 'active' : 'closed';
        if (existingPeriod.status !== nextStatus || (!isCurrent && !existingPeriod.closedAt)) {
          existingPeriod.status = nextStatus;
          existingPeriod.closedAt = isCurrent ? null : (existingPeriod.closedAt ?? this.parseDate(range.endDate));
          await manager.save(BudgetPeriodRecord, existingPeriod);
        }
        continue;
      }

      const periodRecord = manager.create(BudgetPeriodRecord, {
        userId: budget.userId,
        budgetId: budget.id,
        period: budget.period,
        startDate: range.startDate,
        endDate: range.endDate,
        budgetedAmount: budget.maxAmount,
        status: isCurrent ? 'active' : 'closed',
        closedAt: isCurrent ? null : this.parseDate(range.endDate),
      });

      await manager.save(BudgetPeriodRecord, periodRecord);
    }
  }

  private async calculateSpentAmount(budget: Budget, range: PeriodRange): Promise<number> {
    const categoryId = budget.categories[0]?.id;

    if (!categoryId) {
      return 0;
    }

    const result = await this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'total')
      .where('transaction.userId = :userId', { userId: budget.userId })
      .andWhere('transaction.type = :type', { type: 'expense' })
      .andWhere('transaction.status = :status', { status: 'completed' })
      .andWhere('transaction.categoryId = :categoryId', { categoryId })
      .andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate: range.startDate,
        endDate: range.endDate,
      })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private async getExpensesForRange(budget: Budget, range: PeriodRange): Promise<BudgetResponse['currentExpenses']> {
    const categoryId = budget.categories[0]?.id;

    if (!categoryId) {
      return [];
    }

    const transactions = await this.dataSource.getRepository(Transaction).find({
      where: {
        userId: budget.userId,
        type: 'expense',
        status: 'completed',
        categoryId,
      },
      relations: {
        category: true,
      },
      order: {
        date: 'DESC',
        createdAt: 'DESC',
      },
    });

    return transactions
      .filter((transaction) => transaction.date >= range.startDate && transaction.date <= range.endDate)
      .map((transaction) => ({
        id: transaction.id,
        description: transaction.description,
        date: transaction.date,
        amount: Number(transaction.amount),
        category: transaction.category?.name ?? budget.categories[0]?.name ?? 'Categoría',
      }));
  }

  private resolveRangesThroughDate(
    period: BudgetPeriod,
    startDate: string,
    resetConfig: ResetConfig,
    targetDate: Date,
  ): PeriodRange[] {
    const targetDateOnly = this.toDateOnly(targetDate);
    const ranges: PeriodRange[] = [];
    let cursor = this.resolveRangeForDate(period, this.parseDate(startDate), resetConfig);

    for (let index = 0; index < 240; index += 1) {
      ranges.push(cursor);

      if (targetDateOnly <= cursor.endDate) {
        break;
      }

      cursor = this.getNextRange(period, cursor, resetConfig);
    }

    return ranges;
  }

  private resolveRangeForDate(period: BudgetPeriod, date: Date, resetConfig: ResetConfig): PeriodRange {
    if (period === 'weekly') {
      return this.resolveWeeklyRange(date, resetConfig.resetDayOfWeek ?? date.getDay());
    }

    if (period === 'biweekly') {
      return this.resolveBiweeklyRange(date, resetConfig.resetDayOfMonth ?? date.getDate());
    }

    return this.resolveMonthlyRange(date, resetConfig.resetDayOfMonth ?? date.getDate());
  }

  private resolveWeeklyRange(date: Date, resetDayOfWeek: number): PeriodRange {
    const target = this.parseDate(this.toDateOnly(date));
    const daysSinceReset = (target.getDay() - resetDayOfWeek + 7) % 7;
    const periodStart = new Date(target);
    periodStart.setDate(target.getDate() - daysSinceReset);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6);

    return {
      label: `${this.formatShortDate(periodStart)} - ${this.formatShortDate(periodEnd)}`,
      startDate: this.toDateOnly(periodStart),
      endDate: this.toDateOnly(periodEnd),
    };
  }

  private resolveBiweeklyRange(date: Date, resetDayOfMonth: number): PeriodRange {
    const target = this.parseDate(this.toDateOnly(date));
    const candidates = [
      this.getMonthResetDate(target.getFullYear(), target.getMonth() - 1, resetDayOfMonth),
      this.addDays(this.getMonthResetDate(target.getFullYear(), target.getMonth() - 1, resetDayOfMonth), 15),
      this.getMonthResetDate(target.getFullYear(), target.getMonth(), resetDayOfMonth),
      this.addDays(this.getMonthResetDate(target.getFullYear(), target.getMonth(), resetDayOfMonth), 15),
      this.getMonthResetDate(target.getFullYear(), target.getMonth() + 1, resetDayOfMonth),
    ].sort((first, second) => first.getTime() - second.getTime());

    for (let index = 0; index < candidates.length - 1; index += 1) {
      const start = candidates[index];
      const nextStart = candidates[index + 1];
      const end = this.addDays(nextStart, -1);

      if (target >= start && target <= end) {
        return {
          label: `${this.formatShortDate(start)} - ${this.formatShortDate(end)}`,
          startDate: this.toDateOnly(start),
          endDate: this.toDateOnly(end),
        };
      }
    }

    const fallbackStart = candidates[0];
    const fallbackEnd = this.addDays(candidates[1], -1);

    return {
      label: `${this.formatShortDate(fallbackStart)} - ${this.formatShortDate(fallbackEnd)}`,
      startDate: this.toDateOnly(fallbackStart),
      endDate: this.toDateOnly(fallbackEnd),
    };
  }

  private resolveMonthlyRange(date: Date, resetDayOfMonth: number): PeriodRange {
    const target = this.parseDate(this.toDateOnly(date));
    let start = this.getMonthResetDate(target.getFullYear(), target.getMonth(), resetDayOfMonth);

    if (target < start) {
      start = this.getMonthResetDate(target.getFullYear(), target.getMonth() - 1, resetDayOfMonth);
    }

    const nextStart = this.getMonthResetDate(start.getFullYear(), start.getMonth() + 1, resetDayOfMonth);
    const end = this.addDays(nextStart, -1);

    return {
      label: `${this.formatShortDate(start)} - ${this.formatShortDate(end)}`,
      startDate: this.toDateOnly(start),
      endDate: this.toDateOnly(end),
    };
  }

  private getNextRange(period: BudgetPeriod, range: PeriodRange, resetConfig: ResetConfig): PeriodRange {
    const nextDate = this.parseDate(range.endDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return this.resolveRangeForDate(period, nextDate, resetConfig);
  }

  private rangesOverlap(first: PeriodRange, second: PeriodRange): boolean {
    return first.startDate <= second.endDate && second.startDate <= first.endDate;
  }

  private dateWithinRange(date: string, range: PeriodRange): boolean {
    return date >= range.startDate && date <= range.endDate;
  }

  private calculateDaysRemaining(endDate: string): number {
    const today = this.parseDate(this.toDateOnly(new Date()));
    const end = this.parseDate(endDate);
    return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));
  }

  private resolveResetConfig(
    period: BudgetPeriod,
    value: { resetDayOfMonth?: number | null; resetDayOfWeek?: number | null },
  ): ResetConfig {
    const today = new Date();

    if (period === 'weekly') {
      return {
        resetDayOfMonth: null,
        resetDayOfWeek: value.resetDayOfWeek ?? today.getDay(),
      };
    }

    return {
      resetDayOfMonth: value.resetDayOfMonth ?? today.getDate(),
      resetDayOfWeek: null,
    };
  }

  private getBudgetResetConfig(budget: Budget): ResetConfig {
    return this.resolveResetConfig(budget.period, {
      resetDayOfMonth: budget.resetDayOfMonth,
      resetDayOfWeek: budget.resetDayOfWeek,
    });
  }

  private getMonthResetDate(year: number, month: number, requestedDay: number): Date {
    const normalizedMonth = new Date(year, month, 1);
    const lastDay = new Date(normalizedMonth.getFullYear(), normalizedMonth.getMonth() + 1, 0).getDate();
    const day = Math.min(requestedDay, lastDay);

    return new Date(normalizedMonth.getFullYear(), normalizedMonth.getMonth(), day);
  }

  private addDays(date: Date, days: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + days);
    return nextDate;
  }

  private getPeriodMonth(period: { startDate: string }): number {
    return Number(period.startDate.slice(5, 7));
  }

  private getPeriodYear(period: { startDate: string }): number {
    return Number(period.startDate.slice(0, 4));
  }

  private getBudgetStartDate(budget: Budget): string {
    return budget.startDate ?? `${budget.year}-${String(budget.month).padStart(2, '0')}-01`;
  }

  private parseDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toDateOnly(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
  }

  private formatShortDate(date: Date): string {
    return `${date.getDate()} ${this.monthNames[date.getMonth()].slice(0, 3).toLowerCase()}`;
  }

  private readonly monthNames = [
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

  private resolveProgressStatus(percentageUsed: number): BudgetProgressStatus {
    if (percentageUsed >= 100) {
      return 'exceeded';
    }

    if (percentageUsed >= 90) {
      return 'important-warning';
    }

    if (percentageUsed >= 75) {
      return 'moderate-warning';
    }

    return 'normal';
  }

  private formatMoney(value: number): string {
    return value.toFixed(2);
  }
}
