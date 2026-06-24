import { DataSource, QueryFailedError } from 'typeorm';
import { Account } from '../../entities/account.entity';
import { Budget } from '../../entities/budget.entity';
import { Category } from '../../entities/category.entity';
import { ScheduledTransaction } from '../../entities/scheduled-transaction.entity';
import { Transaction } from '../../entities/transaction.entity';
import { AccountsService } from '../accounts/accounts.service';
import { AuthError } from '../auth/auth.service';
import { BudgetsService } from '../budgets/budgets.service';
import { CategoriesService } from '../categories/categories.service';
import { PreferencesService } from '../preferences/preferences.service';
import { ScheduledTransactionsService } from '../scheduled-transactions/scheduled-transactions.service';
import { TransactionsService } from '../transactions/transactions.service';
import type {
  BackupAccount,
  BackupBudget,
  BackupCategory,
  BackupScheduledTransaction,
  BackupTransaction,
  ImportSummary,
  NeyqoBackupDocument,
} from './data-backup.schemas';

const csvColumns = [
  'date',
  'type',
  'status',
  'description',
  'amount',
  'currency',
  'sourceAccount',
  'destinationAccount',
  'destinationAmount',
  'destinationCurrency',
  'exchangeRate',
  'category',
  'note',
  'createdAt',
] as const;

type ImportSummarySection = Exclude<keyof ImportSummary, 'preferences'>;
type TransactionKeyInput = {
  type: Transaction['type'];
  amount: string | number;
  sourceAccountId: string;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  description: string;
  date: string;
  status: Transaction['status'];
};
type BudgetKeyInput = {
  name: string;
  period: Budget['period'];
  categoryId: string;
  startDate?: string | null;
  resetDayOfMonth?: number | null;
  resetDayOfWeek?: number | null;
};
type ScheduledKeyInput = {
  name: string;
  type: ScheduledTransaction['type'];
  amount: string | number;
  sourceAccountId: string;
  categoryId: string;
  frequency: ScheduledTransaction['frequency'];
  startDate: string;
};

export class DataBackupService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly transactionsService: TransactionsService,
    private readonly accountsService: AccountsService,
    private readonly categoriesService: CategoriesService,
    private readonly budgetsService: BudgetsService,
    private readonly scheduledTransactionsService: ScheduledTransactionsService,
    private readonly preferencesService: PreferencesService,
  ) {}

  async exportTransactionsCsv(userId: string): Promise<string> {
    const transactions = await this.dataSource.getRepository(Transaction).find({
      where: { userId },
      relations: {
        sourceAccount: true,
        destinationAccount: true,
        category: true,
      },
      order: {
        date: 'DESC',
        createdAt: 'DESC',
        id: 'DESC',
      },
    });

    const rows = transactions.map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.status,
      transaction.description,
      transaction.amount,
      transaction.currency,
      transaction.sourceAccount.name,
      transaction.destinationAccount?.name ?? '',
      transaction.destinationAmount ?? '',
      transaction.destinationCurrency ?? '',
      transaction.exchangeRate ?? '',
      transaction.category?.name ?? '',
      transaction.note ?? '',
      transaction.createdAt.toISOString(),
    ]);

    return [csvColumns, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  }

  async exportBackup(userId: string): Promise<NeyqoBackupDocument> {
    const [preferences, accounts, categories, transactions, budgets, scheduledTransactions] = await Promise.all([
      this.preferencesService.get(userId),
      this.dataSource.getRepository(Account).find({
        where: { userId },
        order: { createdAt: 'ASC', id: 'ASC' },
      }),
      this.dataSource.getRepository(Category).find({
        where: { userId },
        order: { type: 'ASC', priority: 'ASC', name: 'ASC', id: 'ASC' },
      }),
      this.dataSource.getRepository(Transaction).find({
        where: { userId },
        order: { date: 'ASC', createdAt: 'ASC', id: 'ASC' },
      }),
      this.dataSource.getRepository(Budget).find({
        where: { userId },
        relations: { categories: true },
        order: { createdAt: 'ASC', id: 'ASC' },
      }),
      this.dataSource.getRepository(ScheduledTransaction).find({
        where: { userId },
        order: { createdAt: 'ASC', id: 'ASC' },
      }),
    ]);

    return {
      app: 'neyqo',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        preferences: {
          primaryCurrency: preferences.primaryCurrency,
          dateFormat: preferences.dateFormat,
          weekStartsOn: preferences.weekStartsOn,
          theme: preferences.theme,
          hideBalances: preferences.hideBalances,
          budgetAlerts: preferences.budgetAlerts,
        },
        accounts: accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          currency: account.currency,
          initialBalance: Number(account.initialBalance),
          description: account.description ?? undefined,
          status: account.status,
        })),
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          type: category.type,
          icon: category.icon,
          description: category.description ?? undefined,
          priority: category.priority,
          status: category.status,
        })),
        transactions: transactions.map((transaction) => ({
          id: transaction.id,
          type: transaction.type,
          amount: Number(transaction.amount),
          destinationAmount: transaction.destinationAmount === null ? undefined : Number(transaction.destinationAmount),
          sourceAccountId: transaction.sourceAccountId,
          destinationAccountId: transaction.destinationAccountId ?? undefined,
          categoryId: transaction.categoryId ?? undefined,
          description: transaction.description,
          date: transaction.date,
          status: transaction.status,
          note: transaction.note ?? undefined,
        })),
        budgets: budgets
          .map((budget) => {
            const categoryId = budget.categories[0]?.id;

            if (!categoryId) {
              return null;
            }

            return {
              id: budget.id,
              name: budget.name,
              maxAmount: Number(budget.maxAmount),
              period: budget.period,
              startDate: budget.startDate,
              resetDayOfMonth: budget.resetDayOfMonth,
              resetDayOfWeek: budget.resetDayOfWeek,
              categoryId,
              description: budget.description ?? undefined,
              status: budget.status,
            };
          })
          .filter((budget): budget is NonNullable<typeof budget> => budget !== null),
        scheduledTransactions: scheduledTransactions.map((scheduled) => ({
          id: scheduled.id,
          type: scheduled.type,
          name: scheduled.name,
          description: scheduled.description ?? undefined,
          amount: Number(scheduled.amount),
          sourceAccountId: scheduled.sourceAccountId,
          categoryId: scheduled.categoryId,
          frequency: scheduled.frequency,
          dayOfWeek: scheduled.dayOfWeek ?? undefined,
          daysOfMonth: scheduled.daysOfMonth ?? undefined,
          monthOfYear: scheduled.monthOfYear ?? undefined,
          startDate: scheduled.startDate,
          endDate: scheduled.endDate ?? undefined,
          status: scheduled.status,
        })),
      },
    };
  }

  async importBackup(userId: string, backup: NeyqoBackupDocument): Promise<ImportSummary> {
    const summary = createEmptySummary();
    const accountMap = new Map<string, string>();
    const categoryMap = new Map<string, string>();
    const inactiveAccounts = new Set<string>();
    const inactiveCategories = new Set<string>();
    const inactiveBudgets = new Set<string>();
    const nonActiveScheduled = new Map<string, BackupScheduledTransaction['status']>();

    if (backup.data.preferences) {
      await this.preferencesService.update(userId, backup.data.preferences);
      summary.preferences.updated = true;
    }

    await this.importAccounts(userId, backup.data.accounts, accountMap, inactiveAccounts, summary);
    await this.importCategories(userId, backup.data.categories, categoryMap, inactiveCategories, summary);
    await this.importTransactions(userId, backup.data.transactions, accountMap, categoryMap, summary);
    await this.importBudgets(userId, backup.data.budgets, categoryMap, inactiveBudgets, summary);
    await this.importScheduledTransactions(
      userId,
      backup.data.scheduledTransactions,
      accountMap,
      categoryMap,
      nonActiveScheduled,
      summary,
    );
    await this.applyDeferredStatuses(userId, inactiveAccounts, inactiveCategories, inactiveBudgets, nonActiveScheduled);

    return summary;
  }

  private async importAccounts(
    userId: string,
    accounts: BackupAccount[],
    accountMap: Map<string, string>,
    inactiveAccounts: Set<string>,
    summary: ImportSummary,
  ) {
    const existingAccounts = await this.dataSource.getRepository(Account).find({ where: { userId } });
    const existingByKey = new Map(existingAccounts.map((account) => [accountKey(account), account.id]));

    for (const account of accounts) {
      const key = accountKey(account);
      const existingId = existingByKey.get(key);

      if (existingId) {
        accountMap.set(account.id, existingId);
        summary.accounts.skipped += 1;
        continue;
      }

      try {
        const created = await this.accountsService.create(userId, {
          name: account.name,
          type: account.type,
          currency: account.currency,
          initialBalance: account.initialBalance,
          description: account.description,
        });
        accountMap.set(account.id, created.id);
        existingByKey.set(key, created.id);
        summary.accounts.created += 1;

        if (account.status === 'inactive') {
          inactiveAccounts.add(created.id);
        }
      } catch (error) {
        this.handleImportError(error, summary, 'accounts');
      }
    }
  }

  private async importCategories(
    userId: string,
    categories: BackupCategory[],
    categoryMap: Map<string, string>,
    inactiveCategories: Set<string>,
    summary: ImportSummary,
  ) {
    const existingCategories = await this.dataSource.getRepository(Category).find({ where: { userId } });
    const existingByKey = new Map(existingCategories.map((category) => [categoryKey(category), category.id]));

    for (const category of categories) {
      const key = categoryKey(category);
      const existingId = existingByKey.get(key);

      if (existingId) {
        categoryMap.set(category.id, existingId);
        summary.categories.skipped += 1;
        continue;
      }

      try {
        const created = await this.categoriesService.create(userId, {
          name: category.name,
          type: category.type,
          icon: category.icon,
          priority: category.priority,
          description: category.description,
        });
        categoryMap.set(category.id, created.id);
        existingByKey.set(key, created.id);
        summary.categories.created += 1;

        if (category.status === 'inactive') {
          inactiveCategories.add(created.id);
        }
      } catch (error) {
        this.handleImportError(error, summary, 'categories');
      }
    }
  }

  private async importTransactions(
    userId: string,
    transactions: BackupTransaction[],
    accountMap: Map<string, string>,
    categoryMap: Map<string, string>,
    summary: ImportSummary,
  ) {
    const existingTransactions = await this.dataSource.getRepository(Transaction).find({
      where: { userId },
    });
    const existingKeys = new Set(existingTransactions.map((transaction) => transactionKey(transaction)));

    for (const transaction of transactions) {
      const mapped = this.mapTransaction(transaction, accountMap, categoryMap);

      if (!mapped) {
        summary.transactions.failed += 1;
        continue;
      }

      const key = transactionKey(mapped);

      if (existingKeys.has(key)) {
        summary.transactions.skipped += 1;
        continue;
      }

      try {
        await this.transactionsService.create(userId, mapped);
        existingKeys.add(transactionKey(mapped));
        summary.transactions.created += 1;
      } catch (error) {
        this.handleImportError(error, summary, 'transactions');
      }
    }
  }

  private async importBudgets(
    userId: string,
    budgets: BackupBudget[],
    categoryMap: Map<string, string>,
    inactiveBudgets: Set<string>,
    summary: ImportSummary,
  ) {
    const existingBudgets = await this.dataSource.getRepository(Budget).find({
      where: { userId },
      relations: { categories: true },
    });
    const existingKeys = new Set(existingBudgets.map((budget) => budgetKey({
      name: budget.name,
      period: budget.period,
      categoryId: budget.categories[0]?.id ?? '',
      startDate: budget.startDate,
      resetDayOfMonth: budget.resetDayOfMonth,
      resetDayOfWeek: budget.resetDayOfWeek,
    })));

    for (const budget of budgets) {
      const categoryId = categoryMap.get(budget.categoryId);

      if (!categoryId) {
        summary.budgets.failed += 1;
        continue;
      }

      const key = budgetKey({ ...budget, categoryId });

      if (existingKeys.has(key)) {
        summary.budgets.skipped += 1;
        continue;
      }

      try {
        const created = await this.budgetsService.create(userId, {
          name: budget.name,
          maxAmount: budget.maxAmount,
          period: budget.period,
          startDate: budget.startDate,
          resetDayOfMonth: budget.resetDayOfMonth,
          resetDayOfWeek: budget.resetDayOfWeek,
          categoryId,
          description: budget.description,
        });
        existingKeys.add(key);
        summary.budgets.created += 1;

        if (budget.status === 'inactive') {
          inactiveBudgets.add(created.id);
        }
      } catch (error) {
        this.handleImportError(error, summary, 'budgets');
      }
    }
  }

  private async importScheduledTransactions(
    userId: string,
    scheduledTransactions: BackupScheduledTransaction[],
    accountMap: Map<string, string>,
    categoryMap: Map<string, string>,
    nonActiveScheduled: Map<string, BackupScheduledTransaction['status']>,
    summary: ImportSummary,
  ) {
    const existingScheduled = await this.dataSource.getRepository(ScheduledTransaction).find({
      where: { userId },
    });
    const existingKeys = new Set(existingScheduled.map((scheduled) => scheduledKey(scheduled)));

    for (const scheduled of scheduledTransactions) {
      const sourceAccountId = accountMap.get(scheduled.sourceAccountId);
      const categoryId = categoryMap.get(scheduled.categoryId);

      if (!sourceAccountId || !categoryId) {
        summary.scheduledTransactions.failed += 1;
        continue;
      }

      const mapped = {
        ...scheduled,
        sourceAccountId,
        categoryId,
      };
      const key = scheduledKey(mapped);

      if (existingKeys.has(key)) {
        summary.scheduledTransactions.skipped += 1;
        continue;
      }

      try {
        const created = await this.scheduledTransactionsService.create(userId, mapped);
        existingKeys.add(key);
        summary.scheduledTransactions.created += 1;

        if (scheduled.status !== 'active') {
          nonActiveScheduled.set(created.id, scheduled.status);
        }
      } catch (error) {
        this.handleImportError(error, summary, 'scheduledTransactions');
      }
    }
  }

  private async applyDeferredStatuses(
    userId: string,
    inactiveAccounts: Set<string>,
    inactiveCategories: Set<string>,
    inactiveBudgets: Set<string>,
    nonActiveScheduled: Map<string, BackupScheduledTransaction['status']>,
  ) {
    for (const budgetId of inactiveBudgets) {
      await this.budgetsService.deactivate(userId, budgetId);
    }

    for (const [scheduledId, status] of nonActiveScheduled) {
      if (status === 'paused') {
        await this.scheduledTransactionsService.pause(userId, scheduledId);
      } else if (status === 'inactive' || status === 'completed') {
        await this.scheduledTransactionsService.deactivate(userId, scheduledId);
      }
    }

    for (const categoryId of inactiveCategories) {
      await this.categoriesService.deactivate(userId, categoryId);
    }

    for (const accountId of inactiveAccounts) {
      await this.accountsService.deactivate(userId, accountId);
    }
  }

  private mapTransaction(
    transaction: BackupTransaction,
    accountMap: Map<string, string>,
    categoryMap: Map<string, string>,
  ) {
    const sourceAccountId = accountMap.get(transaction.sourceAccountId);
    const destinationAccountId = transaction.destinationAccountId
      ? accountMap.get(transaction.destinationAccountId)
      : undefined;
    const categoryId = transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined;

    if (!sourceAccountId || (transaction.destinationAccountId && !destinationAccountId) || (transaction.categoryId && !categoryId)) {
      return null;
    }

    return {
      type: transaction.type,
      amount: transaction.amount,
      sourceAccountId,
      destinationAccountId,
      destinationAmount: transaction.destinationAmount,
      categoryId,
      description: transaction.description,
      date: transaction.date,
      status: transaction.status,
      note: transaction.note,
    };
  }

  private handleImportError(error: unknown, summary: ImportSummary, section: ImportSummarySection) {
    if (error instanceof AuthError) {
      summary[section].failed += 1;
      return;
    }

    if (error instanceof QueryFailedError) {
      throw error;
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('No fue posible importar el backup.');
  }
}

function createEmptySummary(): ImportSummary {
  return {
    accounts: { created: 0, skipped: 0, failed: 0 },
    categories: { created: 0, skipped: 0, failed: 0 },
    transactions: { created: 0, skipped: 0, failed: 0 },
    budgets: { created: 0, skipped: 0, failed: 0 },
    scheduledTransactions: { created: 0, skipped: 0, failed: 0 },
    preferences: { updated: false },
  };
}

function escapeCsvCell(value: unknown): string {
  const stringValue = value === null || value === undefined ? '' : String(value);

  if (!/[",\r\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function accountKey(account: Pick<Account | BackupAccount, 'name' | 'type' | 'currency'>): string {
  return [normalize(account.name), account.type, account.currency].join('|');
}

function categoryKey(category: Pick<Category | BackupCategory, 'name' | 'type'>): string {
  return [normalize(category.name), category.type].join('|');
}

function transactionKey(transaction: TransactionKeyInput): string {
  return [
    transaction.type,
    transaction.date,
    formatNumberKey(transaction.amount),
    transaction.sourceAccountId,
    transaction.destinationAccountId ?? '',
    transaction.categoryId ?? '',
    normalize(transaction.description),
    transaction.status,
  ].join('|');
}

function budgetKey(budget: BudgetKeyInput): string {
  return [
    normalize(budget.name),
    budget.period,
    budget.categoryId,
    budget.startDate ?? '',
    budget.resetDayOfMonth ?? '',
    budget.resetDayOfWeek ?? '',
  ].join('|');
}

function scheduledKey(scheduled: ScheduledKeyInput): string {
  return [
    normalize(scheduled.name),
    scheduled.type,
    formatNumberKey(scheduled.amount),
    scheduled.sourceAccountId,
    scheduled.categoryId,
    scheduled.frequency,
    scheduled.startDate,
  ].join('|');
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatNumberKey(value: string | number): string {
  return Number(value).toFixed(2);
}
