import type { EntityManager } from 'typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { Account } from '../../entities/account.entity';
import { Category } from '../../entities/category.entity';
import { Transaction } from '../../entities/transaction.entity';
import { AuthError } from '../auth/auth.service';
import { formatMoney } from '../shared/money';
import { TransactionBalanceService } from './transaction-balance.service';
import { TransactionsRepository } from './transactions.repository';
import type {
  CreateInternalTransactionInput,
  CreateTransactionInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from './transactions.schemas';
import type { PaginatedResponse } from '../../utils/pagination';

export interface TransactionResponse {
  id: string;
  type: Transaction['type'];
  amount: number;
  currency: string;
  destinationAmount?: number;
  destinationCurrency?: string;
  exchangeRate?: number;
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
  destinationAmount: string | null;
  destinationCurrency: string | null;
  exchangeRate: string | null;
  sourceAccount: Account;
  destinationAccount: Account | null;
  category: Category | null;
  description: string;
  date: string;
  status: Transaction['status'];
  note: string | null;
}

export class TransactionsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly transactionsRepository = new TransactionsRepository(dataSource),
    private readonly balanceService = new TransactionBalanceService(),
  ) {}

  async list(userId: string, filters: ListTransactionsQuery): Promise<PaginatedResponse<TransactionResponse>> {
    const transactions = await this.transactionsRepository.list(userId, filters);

    return {
      items: transactions.items.map((transaction) => this.toResponse(transaction)),
      pageInfo: transactions.pageInfo,
    };
  }

  async getById(userId: string, transactionId: string): Promise<TransactionResponse> {
    const transaction = await this.transactionsRepository.findOwnedTransaction(userId, transactionId);
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
      const existingTransaction = await this.transactionsRepository.findByScheduledExecution(
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
        const existingTransaction = await this.transactionsRepository.findByScheduledExecution(
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
        destinationAmount: resolved.destinationAmount,
        destinationCurrency: resolved.destinationCurrency,
        exchangeRate: resolved.exchangeRate,
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
        await this.balanceService.apply(manager, resolved);
      }

      const savedTransaction = await manager.save(Transaction, transaction);
      return this.toResponse(await this.transactionsRepository.findOwnedTransaction(userId, savedTransaction.id, manager));
    });
  }

  async update(
    userId: string,
    transactionId: string,
    payload: UpdateTransactionInput,
  ): Promise<TransactionResponse> {
    return this.dataSource.transaction(async (manager) => {
      const transaction = await this.transactionsRepository.findOwnedTransaction(userId, transactionId, manager);

      if (transaction.status === 'completed') {
        await this.balanceService.reverse(manager, transaction);
      }

      const nextType = payload.type ?? transaction.type;
      const typeChanged = nextType !== transaction.type;
      const nextInput = {
        type: nextType,
        amount: payload.amount ?? Number(transaction.amount),
        destinationAmount: payload.destinationAmount ?? (
          transaction.destinationAmount === null ? undefined : Number(transaction.destinationAmount)
        ),
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
      transaction.destinationAmount = resolved.destinationAmount;
      transaction.destinationCurrency = resolved.destinationCurrency;
      transaction.exchangeRate = resolved.exchangeRate;
      transaction.sourceAccountId = resolved.sourceAccount.id;
      transaction.destinationAccountId = resolved.destinationAccount?.id ?? null;
      transaction.categoryId = resolved.category?.id ?? null;
      transaction.description = resolved.description;
      transaction.date = resolved.date;
      transaction.status = resolved.status;
      transaction.note = resolved.note;

      if (transaction.status === 'completed') {
        await this.balanceService.apply(manager, resolved);
      }

      const savedTransaction = await manager.save(Transaction, transaction);
      return this.toResponse(await this.transactionsRepository.findOwnedTransaction(userId, savedTransaction.id, manager));
    });
  }

  async delete(userId: string, transactionId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const transaction = await this.transactionsRepository.findOwnedTransaction(userId, transactionId, manager);

      if (transaction.status === 'completed') {
        await this.balanceService.reverse(manager, transaction);
      }

      await manager.delete(Transaction, { id: transaction.id });
    });
  }

  private async resolveInput(
    manager: EntityManager,
    userId: string,
    payload: CreateTransactionInput,
  ): Promise<ResolvedTransactionInput> {
    this.assertCompletedTransactionDateIsNotFuture(payload);
    const sourceAccount = await this.transactionsRepository.findActiveAccount(manager, userId, payload.sourceAccountId, 'origen');
    const destinationAccount = payload.destinationAccountId
      ? await this.transactionsRepository.findActiveAccount(manager, userId, payload.destinationAccountId, 'destino')
      : null;
    let category: Category | null = null;

    if (payload.type === 'transfer') {
      if (payload.categoryId) {
        throw new AuthError(400, 'Las transferencias no usan categoría.');
      }

      if (!destinationAccount) {
        throw new AuthError(400, 'Selecciona una cuenta destino para la transferencia.');
      }

      if (destinationAccount.id === sourceAccount.id) {
        throw new AuthError(400, 'La cuenta destino debe ser diferente a la cuenta origen.');
      }

      const destinationAmount = this.resolveDestinationAmount(payload, sourceAccount, destinationAccount);

      return {
        type: payload.type,
        amount: formatMoney(payload.amount),
        destinationAmount: formatMoney(destinationAmount),
        destinationCurrency: destinationAccount.currency,
        exchangeRate: formatExchangeRate(destinationAmount / payload.amount),
        sourceAccount,
        destinationAccount,
        category,
        description: payload.description,
        date: payload.date,
        status: payload.status,
        note: payload.note || null,
      };
    } else {
      if (destinationAccount) {
        throw new AuthError(400, 'La cuenta destino solo se usa en transferencias.');
      }

      if (payload.destinationAmount !== undefined) {
        throw new AuthError(400, 'El monto destino solo se usa en transferencias entre monedas diferentes.');
      }

      if (!payload.categoryId) {
        throw new AuthError(400, 'Selecciona una categoría.');
      }

      category = await this.transactionsRepository.findActiveCategory(manager, userId, payload.categoryId, payload.type);
    }

    return {
      type: payload.type,
      amount: formatMoney(payload.amount),
      destinationAmount: null,
      destinationCurrency: null,
      exchangeRate: null,
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

  private resolveDestinationAmount(
    payload: CreateTransactionInput,
    sourceAccount: Account,
    destinationAccount: Account,
  ): number {
    if (sourceAccount.currency === destinationAccount.currency) {
      if (payload.destinationAmount !== undefined && payload.destinationAmount !== payload.amount) {
        throw new AuthError(400, 'En transferencias de la misma moneda, el monto recibido debe ser igual al enviado.');
      }

      return payload.amount;
    }

    if (!payload.destinationAmount) {
      throw new AuthError(400, 'Indica el monto que recibirá la cuenta destino.');
    }

    return payload.destinationAmount;
  }

  private assertCompletedTransactionDateIsNotFuture(payload: Pick<CreateTransactionInput, 'date' | 'status'>): void {
    if (payload.status !== 'completed') {
      return;
    }

    if (payload.date > todayDateKey()) {
      throw new AuthError(400, 'Una transacción futura debe quedar pendiente hasta que ocurra.');
    }
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
      destinationAmount: transaction.destinationAmount === null ? undefined : Number(transaction.destinationAmount),
      destinationCurrency: transaction.destinationCurrency ?? undefined,
      exchangeRate: transaction.exchangeRate === null ? undefined : Number(transaction.exchangeRate),
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

function formatExchangeRate(value: number): string {
  return value.toFixed(8);
}

function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}
