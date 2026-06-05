import type { EntityManager } from 'typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { Account } from '../../entities/account.entity';
import { Category } from '../../entities/category.entity';
import { Transaction } from '../../entities/transaction.entity';
import { AuthError } from '../auth/auth.service';
import type {
  CreateInternalTransactionInput,
  CreateTransactionInput,
  UpdateTransactionInput,
} from './transactions.schemas';

export interface TransactionResponse {
  id: string;
  type: Transaction['type'];
  amount: number;
  currency: string;
  sourceAccountId: string;
  sourceAccount: string;
  destinationAccountId?: string;
  destinationAccount?: string;
  categoryId?: string;
  category?: string;
  categoryIcon?: string;
  description: string;
  date: string;
  status: Transaction['status'];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternalTransactionResponse {
  transaction: TransactionResponse;
  duplicate: boolean;
}

interface ResolvedTransactionInput {
  type: Transaction['type'];
  amount: string;
  sourceAccount: Account;
  destinationAccount: Account | null;
  category: Category | null;
  description: string;
  date: string;
  status: Transaction['status'];
  note: string | null;
}

export class TransactionsService {
  constructor(private readonly dataSource: DataSource) {}

  async list(userId: string): Promise<TransactionResponse[]> {
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
      },
    });

    return transactions.map((transaction) => this.toResponse(transaction));
  }

  async getById(userId: string, transactionId: string): Promise<TransactionResponse> {
    const transaction = await this.findOwnedTransaction(userId, transactionId);
    return this.toResponse(transaction);
  }

  async create(userId: string, payload: CreateTransactionInput): Promise<TransactionResponse> {
    return this.createWithMetadata(userId, payload, {
      source: 'manual',
      scheduledTransactionId: null,
      scheduledExecutionDate: null,
      processedAt: null,
    });
  }

  async createInternal(payload: CreateInternalTransactionInput): Promise<InternalTransactionResponse> {
    if (
      payload.source === 'scheduled_transaction' &&
      payload.scheduledTransactionId &&
      payload.scheduledExecutionDate
    ) {
      const existingTransaction = await this.findByScheduledExecution(
        payload.scheduledTransactionId,
        payload.scheduledExecutionDate,
      );

      if (existingTransaction) {
        return {
          transaction: this.toResponse(existingTransaction),
          duplicate: true,
        };
      }
    }

    try {
      const transaction = await this.createWithMetadata(payload.userId, payload, {
        source: payload.source,
        scheduledTransactionId: payload.scheduledTransactionId ?? null,
        scheduledExecutionDate: payload.scheduledExecutionDate ?? null,
        processedAt: payload.processedAt ? new Date(payload.processedAt) : new Date(),
      });

      return {
        transaction,
        duplicate: false,
      };
    } catch (error) {
      if (
        this.isUniqueViolation(error) &&
        payload.source === 'scheduled_transaction' &&
        payload.scheduledTransactionId &&
        payload.scheduledExecutionDate
      ) {
        const existingTransaction = await this.findByScheduledExecution(
          payload.scheduledTransactionId,
          payload.scheduledExecutionDate,
        );

        if (existingTransaction) {
          return {
            transaction: this.toResponse(existingTransaction),
            duplicate: true,
          };
        }
      }

      throw error;
    }
  }

  private async createWithMetadata(
    userId: string,
    payload: CreateTransactionInput,
    metadata: Pick<Transaction, 'source' | 'scheduledTransactionId' | 'scheduledExecutionDate' | 'processedAt'>,
  ): Promise<TransactionResponse> {
    return this.dataSource.transaction(async (manager) => {
      const resolved = await this.resolveInput(manager, userId, payload);
      const transaction = manager.create(Transaction, {
        userId,
        type: resolved.type,
        amount: resolved.amount,
        currency: resolved.sourceAccount.currency,
        sourceAccountId: resolved.sourceAccount.id,
        destinationAccountId: resolved.destinationAccount?.id ?? null,
        categoryId: resolved.category?.id ?? null,
        description: resolved.description,
        date: resolved.date,
        status: resolved.status,
        source: metadata.source,
        scheduledTransactionId: metadata.scheduledTransactionId,
        scheduledExecutionDate: metadata.scheduledExecutionDate,
        processedAt: metadata.processedAt,
        note: resolved.note,
      });

      if (transaction.status === 'completed') {
        await this.applyBalanceDelta(manager, resolved);
      }

      const savedTransaction = await manager.save(Transaction, transaction);
      return this.toResponse(await this.findOwnedTransaction(userId, savedTransaction.id, manager));
    });
  }

  async update(
    userId: string,
    transactionId: string,
    payload: UpdateTransactionInput,
  ): Promise<TransactionResponse> {
    return this.dataSource.transaction(async (manager) => {
      const transaction = await this.findOwnedTransaction(userId, transactionId, manager);

      if (transaction.status === 'completed') {
        await this.reverseTransactionBalance(manager, transaction);
      }

      const nextType = payload.type ?? transaction.type;
      const typeChanged = nextType !== transaction.type;
      const nextInput = {
        type: nextType,
        amount: payload.amount ?? Number(transaction.amount),
        sourceAccountId: payload.sourceAccountId ?? transaction.sourceAccountId,
        destinationAccountId: this.resolveNextDestinationAccountId(payload, transaction, nextType),
        categoryId: this.resolveNextCategoryId(payload, transaction, nextType, typeChanged),
        description: payload.description ?? transaction.description,
        date: payload.date ?? transaction.date,
        status: payload.status ?? transaction.status,
        note: payload.note === undefined ? transaction.note ?? undefined : payload.note,
      };
      const resolved = await this.resolveInput(manager, userId, nextInput);

      transaction.type = resolved.type;
      transaction.amount = resolved.amount;
      transaction.currency = resolved.sourceAccount.currency;
      transaction.sourceAccountId = resolved.sourceAccount.id;
      transaction.destinationAccountId = resolved.destinationAccount?.id ?? null;
      transaction.categoryId = resolved.category?.id ?? null;
      transaction.description = resolved.description;
      transaction.date = resolved.date;
      transaction.status = resolved.status;
      transaction.note = resolved.note;

      if (transaction.status === 'completed') {
        await this.applyBalanceDelta(manager, resolved);
      }

      const savedTransaction = await manager.save(Transaction, transaction);
      return this.toResponse(await this.findOwnedTransaction(userId, savedTransaction.id, manager));
    });
  }

  async delete(userId: string, transactionId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const transaction = await this.findOwnedTransaction(userId, transactionId, manager);

      if (transaction.status === 'completed') {
        await this.reverseTransactionBalance(manager, transaction);
      }

      await manager.delete(Transaction, { id: transaction.id });
    });
  }

  private async resolveInput(
    manager: EntityManager,
    userId: string,
    payload: CreateTransactionInput,
  ): Promise<ResolvedTransactionInput> {
    const sourceAccount = await this.findActiveAccount(manager, userId, payload.sourceAccountId, 'origen');
    const destinationAccount = payload.destinationAccountId
      ? await this.findActiveAccount(manager, userId, payload.destinationAccountId, 'destino')
      : null;
    let category: Category | null = null;

    if (payload.type === 'transfer') {
      if (!destinationAccount) {
        throw new AuthError(400, 'Selecciona una cuenta destino para la transferencia.');
      }

      if (destinationAccount.id === sourceAccount.id) {
        throw new AuthError(400, 'La cuenta destino debe ser diferente a la cuenta origen.');
      }

      if (destinationAccount.currency !== sourceAccount.currency) {
        throw new AuthError(400, 'Solo puedes transferir entre cuentas con la misma moneda.');
      }
    } else {
      if (destinationAccount) {
        throw new AuthError(400, 'La cuenta destino solo se usa en transferencias.');
      }

      if (!payload.categoryId) {
        throw new AuthError(400, 'Selecciona una categoría.');
      }

      category = await this.findActiveCategory(manager, userId, payload.categoryId, payload.type);
    }

    return {
      type: payload.type,
      amount: this.formatMoney(payload.amount),
      sourceAccount,
      destinationAccount,
      category,
      description: payload.description,
      date: payload.date,
      status: payload.status,
      note: payload.note || null,
    };
  }

  private resolveNextDestinationAccountId(
    payload: UpdateTransactionInput,
    transaction: Transaction,
    nextType: Transaction['type'],
  ): string | undefined {
    if (nextType !== 'transfer') {
      return undefined;
    }

    return payload.destinationAccountId === undefined
      ? transaction.destinationAccountId ?? undefined
      : payload.destinationAccountId;
  }

  private resolveNextCategoryId(
    payload: UpdateTransactionInput,
    transaction: Transaction,
    nextType: Transaction['type'],
    typeChanged: boolean,
  ): string | undefined {
    if (nextType === 'transfer') {
      return undefined;
    }

    if (payload.categoryId !== undefined) {
      return payload.categoryId;
    }

    return typeChanged ? undefined : transaction.categoryId ?? undefined;
  }

  private async findActiveAccount(
    manager: EntityManager,
    userId: string,
    accountId: string,
    label: string,
  ): Promise<Account> {
    const account = await manager.findOne(Account, {
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new AuthError(404, `No encontramos la cuenta ${label}.`);
    }

    if (account.status !== 'active') {
      throw new AuthError(400, `La cuenta ${label} está inactiva.`);
    }

    return account;
  }

  private async findActiveCategory(
    manager: EntityManager,
    userId: string,
    categoryId: string,
    type: 'income' | 'expense',
  ): Promise<Category> {
    const category = await manager.findOne(Category, {
      where: {
        id: categoryId,
        userId,
      },
    });

    if (!category) {
      throw new AuthError(404, 'No encontramos esa categoría.');
    }

    if (category.status !== 'active') {
      throw new AuthError(400, 'La categoría está inactiva.');
    }

    if (category.type !== type) {
      throw new AuthError(400, 'La categoría no coincide con el tipo de transacción.');
    }

    return category;
  }

  private async findOwnedTransaction(
    userId: string,
    transactionId: string,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<Transaction> {
    const transaction = await manager.findOne(Transaction, {
      where: {
        id: transactionId,
        userId,
      },
      relations: {
        sourceAccount: true,
        destinationAccount: true,
        category: true,
      },
    });

    if (!transaction) {
      throw new AuthError(404, 'No encontramos esa transacción.');
    }

    return transaction;
  }

  private async findByScheduledExecution(
    scheduledTransactionId: string,
    scheduledExecutionDate: string,
  ): Promise<Transaction | null> {
    return this.dataSource.getRepository(Transaction).findOne({
      where: {
        scheduledTransactionId,
        scheduledExecutionDate,
      },
      relations: {
        sourceAccount: true,
        destinationAccount: true,
        category: true,
      },
    });
  }

  private async applyBalanceDelta(
    manager: EntityManager,
    transaction: ResolvedTransactionInput,
  ): Promise<void> {
    const amount = Number(transaction.amount);

    if (transaction.type === 'income') {
      await this.updateAccountBalance(manager, transaction.sourceAccount, amount);
      return;
    }

    if (transaction.type === 'expense') {
      await this.updateAccountBalance(manager, transaction.sourceAccount, -amount);
      return;
    }

    await this.updateAccountBalance(manager, transaction.sourceAccount, -amount);
    await this.updateAccountBalance(manager, transaction.destinationAccount!, amount);
  }

  private async reverseTransactionBalance(
    manager: EntityManager,
    transaction: Transaction,
  ): Promise<void> {
    const amount = Number(transaction.amount);

    if (transaction.type === 'income') {
      await this.updateAccountBalance(manager, transaction.sourceAccount, -amount);
      return;
    }

    if (transaction.type === 'expense') {
      await this.updateAccountBalance(manager, transaction.sourceAccount, amount);
      return;
    }

    if (!transaction.destinationAccount) {
      throw new AuthError(400, 'La transferencia no tiene cuenta destino.');
    }

    await this.updateAccountBalance(manager, transaction.sourceAccount, amount);
    await this.updateAccountBalance(manager, transaction.destinationAccount, -amount);
  }

  private async updateAccountBalance(
    manager: EntityManager,
    account: Account,
    delta: number,
  ): Promise<void> {
    account.currentBalance = this.formatMoney(Number(account.currentBalance) + delta);
    await manager.save(Account, account);
  }

  private formatMoney(value: number): string {
    return value.toFixed(2);
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      typeof error.driverError === 'object' &&
      error.driverError !== null &&
      'code' in error.driverError &&
      error.driverError.code === '23505'
    );
  }

  private toResponse(transaction: Transaction): TransactionResponse {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      sourceAccountId: transaction.sourceAccountId,
      sourceAccount: transaction.sourceAccount.name,
      destinationAccountId: transaction.destinationAccountId ?? undefined,
      destinationAccount: transaction.destinationAccount?.name,
      categoryId: transaction.categoryId ?? undefined,
      category: transaction.category?.name,
      categoryIcon: transaction.category?.icon,
      description: transaction.description,
      date: transaction.date,
      status: transaction.status,
      note: transaction.note ?? undefined,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }
}
