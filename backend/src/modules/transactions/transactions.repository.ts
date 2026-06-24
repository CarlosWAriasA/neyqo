import type { EntityManager } from 'typeorm';
import { Brackets, DataSource } from 'typeorm';
import { z } from 'zod';
import { Account } from '../../entities/account.entity';
import { Category } from '../../entities/category.entity';
import { Transaction } from '../../entities/transaction.entity';
import { decodeCursor, encodeCursor, type PaginatedResponse, toPaginatedResponse } from '../../utils/pagination';
import { AuthError } from '../auth/auth.service';
import type { ListTransactionsQuery } from './transactions.schemas';

const transactionCursorSchema = z.object({
  date: z.string(),
  createdAt: z.string(),
  id: z.uuid(),
});

export class TransactionsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async list(userId: string, filters: ListTransactionsQuery): Promise<PaginatedResponse<Transaction>> {
    const cursor = decodeCursor(filters.cursor, transactionCursorSchema);
    const query = this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.sourceAccount', 'sourceAccount')
      .leftJoinAndSelect('transaction.destinationAccount', 'destinationAccount')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.userId = :userId', { userId });

    if (filters.type && filters.type !== 'all') {
      query.andWhere('transaction.type = :type', { type: filters.type });
    }

    if (filters.status && filters.status !== 'all') {
      query.andWhere('transaction.status = :status', { status: filters.status });
    }

    if (filters.dateFrom) {
      query.andWhere('transaction.date >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('transaction.date <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.accountId) {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where('transaction.sourceAccountId = :accountId', { accountId: filters.accountId })
            .orWhere('transaction.destinationAccountId = :accountId', { accountId: filters.accountId });
        }),
      );
    }

    if (filters.categoryId) {
      query.andWhere('transaction.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.query) {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where('LOWER(transaction.description) LIKE :query', { query: `%${filters.query!.toLowerCase()}%` })
            .orWhere('LOWER(transaction.note) LIKE :query', { query: `%${filters.query!.toLowerCase()}%` })
            .orWhere('LOWER(sourceAccount.name) LIKE :query', { query: `%${filters.query!.toLowerCase()}%` })
            .orWhere('LOWER(destinationAccount.name) LIKE :query', { query: `%${filters.query!.toLowerCase()}%` })
            .orWhere('LOWER(category.name) LIKE :query', { query: `%${filters.query!.toLowerCase()}%` });
        }),
      );
    }

    if (cursor) {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where('transaction.date < :cursorDate', { cursorDate: cursor.date })
            .orWhere(
              new Brackets((sameDate) => {
                sameDate
                  .where('transaction.date = :cursorDate', { cursorDate: cursor.date })
                  .andWhere('transaction.createdAt < :cursorCreatedAt', {
                    cursorCreatedAt: cursor.createdAt,
                  });
              }),
            )
            .orWhere(
              new Brackets((sameDateAndCreatedAt) => {
                sameDateAndCreatedAt
                  .where('transaction.date = :cursorDate', { cursorDate: cursor.date })
                  .andWhere('transaction.createdAt = :cursorCreatedAt', {
                    cursorCreatedAt: cursor.createdAt,
                  })
                  .andWhere('transaction.id < :cursorId', { cursorId: cursor.id });
              }),
            );
        }),
      );
    }

    const rows = await query
      .orderBy('transaction.date', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .addOrderBy('transaction.id', 'DESC')
      .take(filters.limit + 1)
      .getMany();

    return toPaginatedResponse(rows, filters.limit, (transaction) =>
      encodeCursor({
        date: transaction.date,
        createdAt: transaction.createdAt.toISOString(),
        id: transaction.id,
      }),
    );
  }

  async findOwnedTransaction(
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

  async findByScheduledExecution(
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

  async findActiveAccount(
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

  async findActiveCategory(
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
}
