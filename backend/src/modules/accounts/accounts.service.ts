import type { Repository } from 'typeorm';
import { Account } from '../../entities/account.entity';
import { AuthError } from '../auth/auth.service';
import type { CreateAccountInput, UpdateAccountInput } from './accounts.schemas';

export interface AccountResponse {
  id: string;
  name: string;
  type: Account['type'];
  currency: Account['currency'];
  initialBalance: number;
  currentBalance: number;
  description?: string;
  status: Account['status'];
  createdAt: string;
  updatedAt: string;
}

export class AccountsService {
  constructor(private readonly accountsRepository: Repository<Account>) {}

  async list(userId: string): Promise<AccountResponse[]> {
    const accounts = await this.accountsRepository.find({
      where: { userId },
      order: {
        status: 'ASC',
        createdAt: 'ASC',
      },
    });

    return accounts.map((account) => this.toResponse(account));
  }

  async getById(userId: string, accountId: string): Promise<AccountResponse> {
    const account = await this.findOwnedAccount(userId, accountId);
    return this.toResponse(account);
  }

  async create(userId: string, payload: CreateAccountInput): Promise<AccountResponse> {
    const initialBalance = this.formatMoney(payload.initialBalance);
    const account = this.accountsRepository.create({
      userId,
      name: payload.name,
      type: payload.type,
      currency: payload.currency,
      initialBalance,
      currentBalance: initialBalance,
      description: payload.description || null,
      status: 'active',
    });

    const savedAccount = await this.accountsRepository.save(account);
    return this.toResponse(savedAccount);
  }

  async update(
    userId: string,
    accountId: string,
    payload: UpdateAccountInput,
  ): Promise<AccountResponse> {
    const account = await this.findOwnedAccount(userId, accountId);

    if (payload.name !== undefined) {
      account.name = payload.name;
    }

    if (payload.type !== undefined) {
      account.type = payload.type;
    }

    if (payload.currency !== undefined) {
      account.currency = payload.currency;
    }

    if (payload.initialBalance !== undefined) {
      account.initialBalance = this.formatMoney(payload.initialBalance);
    }

    if (payload.description !== undefined) {
      account.description = payload.description || null;
    }

    const savedAccount = await this.accountsRepository.save(account);
    return this.toResponse(savedAccount);
  }

  async deactivate(userId: string, accountId: string): Promise<AccountResponse> {
    const account = await this.findOwnedAccount(userId, accountId);
    account.status = 'inactive';

    const savedAccount = await this.accountsRepository.save(account);
    return this.toResponse(savedAccount);
  }

  async reactivate(userId: string, accountId: string): Promise<AccountResponse> {
    const account = await this.findOwnedAccount(userId, accountId);
    account.status = 'active';

    const savedAccount = await this.accountsRepository.save(account);
    return this.toResponse(savedAccount);
  }

  async createInitialAccounts(userId: string): Promise<void> {
    const existingAccountCount = await this.accountsRepository.count({
      where: { userId },
    });

    if (existingAccountCount > 0) {
      return;
    }

    await this.accountsRepository
      .createQueryBuilder()
      .insert()
      .into(Account)
      .values(
        [
          {
            name: 'Cuenta de Banco',
            type: 'bank' as const,
            currency: 'DOP' as const,
            initialBalance: 0,
            description: 'Cuenta principal para ingresos, pagos y transferencias.',
          },
          {
            name: 'Efectivo',
            type: 'cash' as const,
            currency: 'DOP' as const,
            initialBalance: 0,
            description: 'Dinero disponible para gastos diarios.',
          },
          {
            name: 'Tarjeta de credito',
            type: 'credit_card' as const,
            currency: 'DOP' as const,
            initialBalance: 0,
            description: 'Tarjeta para compras, pagos recurrentes y consumos pendientes.',
          },
        ].map((account) => {
          const initialBalance = this.formatMoney(account.initialBalance);

          return {
            ...account,
            userId,
            initialBalance,
            currentBalance: initialBalance,
            description: account.description ?? null,
            status: 'active' as const,
          };
        }),
      )
      .execute();
  }

  private async findOwnedAccount(userId: string, accountId: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new AuthError(404, 'No encontramos esa cuenta.');
    }

    return account;
  }

  private formatMoney(value: number): string {
    return value.toFixed(2);
  }

  private toResponse(account: Account): AccountResponse {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: Number(account.initialBalance),
      currentBalance: Number(account.currentBalance),
      description: account.description ?? undefined,
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }
}
