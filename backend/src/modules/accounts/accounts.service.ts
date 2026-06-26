import { Brackets, type DataSource, type EntityManager, type Repository } from 'typeorm';
import { Account } from '../../entities/account.entity';
import { EmailImportRule } from '../../entities/email-import-rule.entity';
import { ScheduledTransaction } from '../../entities/scheduled-transaction.entity';
import { Transaction } from '../../entities/transaction.entity';
import { AuthError } from '../auth/auth.service';
import { formatMoney } from '../shared/money';
import type { CreateAccountInput, UpdateAccountInput } from './accounts.schemas';

export interface AccountResponse {
  id: string;
  name: string;
  type: Account['type'];
  currency: Account['currency'];
  institutionName?: string;
  lastFour?: string;
  initialBalance: number;
  currentBalance: number;
  description?: string;
  status: Account['status'];
  createdAt: string;
  updatedAt: string;
}

export class AccountsService {
  private readonly accountsRepository: Repository<Account>;

  constructor(private readonly dataSource: DataSource) {
    this.accountsRepository = dataSource.getRepository(Account);
  }

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
    const normalizedPayload = this.normalizePayload(payload);
    await this.assertAccountNameIsAvailable(userId, normalizedPayload.name);
    const initialBalance = formatMoney(normalizedPayload.initialBalance);
    const account = this.accountsRepository.create({
      userId,
      name: normalizedPayload.name,
      type: normalizedPayload.type,
      currency: normalizedPayload.currency,
      institutionName: normalizedPayload.institutionName,
      lastFour: normalizedPayload.lastFour,
      initialBalance,
      currentBalance: initialBalance,
      description: normalizedPayload.description,
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
    return this.dataSource.transaction(async (manager) => {
      const account = await this.findOwnedAccount(userId, accountId, manager);
      const normalizedPayload = this.normalizePayload(payload);

      if (normalizedPayload.name !== undefined) {
        await this.assertAccountNameIsAvailable(userId, normalizedPayload.name, account.id, manager);
        account.name = normalizedPayload.name;
      }

      if (normalizedPayload.type !== undefined) {
        account.type = normalizedPayload.type;
      }

      if (normalizedPayload.currency !== undefined && normalizedPayload.currency !== account.currency) {
        await this.assertCurrencyCanChange(userId, account.id, manager);
        account.currency = normalizedPayload.currency;
      }

      if (normalizedPayload.institutionName !== undefined) {
        account.institutionName = normalizedPayload.institutionName;
      }

      if (normalizedPayload.lastFour !== undefined) {
        account.lastFour = normalizedPayload.lastFour;
      }

      if (normalizedPayload.initialBalance !== undefined) {
        const nextInitialBalance = normalizedPayload.initialBalance;
        const balanceDelta = nextInitialBalance - Number(account.initialBalance);

        account.initialBalance = formatMoney(nextInitialBalance);
        account.currentBalance = formatMoney(Number(account.currentBalance) + balanceDelta);
      }

      if (normalizedPayload.description !== undefined) {
        account.description = normalizedPayload.description;
      }

      const savedAccount = await manager.save(Account, account);
      return this.toResponse(savedAccount);
    });
  }

  async deactivate(userId: string, accountId: string): Promise<AccountResponse> {
    const account = await this.findOwnedAccount(userId, accountId);

    if (account.status === 'inactive') {
      return this.toResponse(account);
    }

    await this.assertAccountCanDeactivate(userId, account.id);
    account.status = 'inactive';

    const savedAccount = await this.accountsRepository.save(account);
    return this.toResponse(savedAccount);
  }

  async reactivate(userId: string, accountId: string): Promise<AccountResponse> {
    const account = await this.findOwnedAccount(userId, accountId);

    if (account.status === 'active') {
      return this.toResponse(account);
    }

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
            institutionName: null,
            lastFour: null,
            initialBalance: 0,
            description: 'Cuenta principal para ingresos, pagos y transferencias.',
          },
          {
            name: 'Efectivo',
            type: 'cash' as const,
            currency: 'DOP' as const,
            institutionName: null,
            lastFour: null,
            initialBalance: 0,
            description: 'Dinero disponible para gastos diarios.',
          },
          {
            name: 'Tarjeta de credito',
            type: 'credit_card' as const,
            currency: 'DOP' as const,
            institutionName: null,
            lastFour: null,
            initialBalance: 0,
            description: 'Tarjeta para compras, pagos recurrentes y consumos pendientes.',
          },
        ].map((account) => {
          const initialBalance = formatMoney(account.initialBalance);

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

  private async findOwnedAccount(
    userId: string,
    accountId: string,
    manager?: EntityManager,
  ): Promise<Account> {
    const account = await (manager?.getRepository(Account) ?? this.accountsRepository).findOne({
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

  private normalizePayload<T extends Partial<CreateAccountInput>>(payload: T): T {
    return {
      ...payload,
      name: payload.name?.replace(/\s+/g, ' ').trim(),
      institutionName: normalizeOptionalText(payload.institutionName),
      lastFour: normalizeOptionalText(payload.lastFour),
      description: normalizeOptionalText(payload.description),
    };
  }

  private async assertAccountNameIsAvailable(
    userId: string,
    name: string,
    accountId?: string,
    manager?: EntityManager,
  ): Promise<void> {
    const query = (manager?.getRepository(Account) ?? this.accountsRepository)
      .createQueryBuilder('account')
      .where('account.userId = :userId', { userId })
      .andWhere('LOWER(account.name) = LOWER(:name)', { name });

    if (accountId) {
      query.andWhere('account.id != :accountId', { accountId });
    }

    const duplicateExists = await query.getExists();

    if (duplicateExists) {
      throw new AuthError(409, 'Ya tienes una cuenta con ese nombre.');
    }
  }

  private async assertCurrencyCanChange(
    userId: string,
    accountId: string,
    manager: EntityManager,
  ): Promise<void> {
    const [hasTransactions, hasActiveSchedules, hasActiveImportRules] = await Promise.all([
      manager
        .getRepository(Transaction)
        .createQueryBuilder('transaction')
        .where('transaction.userId = :userId', { userId })
        .andWhere(
          new Brackets((query) => {
            query
              .where('transaction.sourceAccountId = :accountId', { accountId })
              .orWhere('transaction.destinationAccountId = :accountId', { accountId });
          }),
        )
        .getExists(),
      manager.getRepository(ScheduledTransaction).exists({
        where: {
          userId,
          sourceAccountId: accountId,
          status: 'active',
        },
      }),
      manager.getRepository(EmailImportRule).exists({
        where: {
          userId,
          accountId,
          status: 'active',
        },
      }),
    ]);

    if (hasTransactions || hasActiveSchedules || hasActiveImportRules) {
      throw new AuthError(
        409,
        'No puedes cambiar la moneda de una cuenta con movimientos o reglas activas. Crea una cuenta nueva para otra moneda.',
      );
    }
  }

  private async assertAccountCanDeactivate(userId: string, accountId: string): Promise<void> {
    const [hasActiveSchedules, hasActiveImportRules] = await Promise.all([
      this.dataSource.getRepository(ScheduledTransaction).exists({
        where: {
          userId,
          sourceAccountId: accountId,
          status: 'active',
        },
      }),
      this.dataSource.getRepository(EmailImportRule).exists({
        where: {
          userId,
          accountId,
          status: 'active',
        },
      }),
    ]);

    if (hasActiveSchedules) {
      throw new AuthError(409, 'Pausa o mueve los pagos programados activos antes de desactivar esta cuenta.');
    }

    if (hasActiveImportRules) {
      throw new AuthError(409, 'Desactiva o mueve las reglas de importación antes de desactivar esta cuenta.');
    }
  }

  private toResponse(account: Account): AccountResponse {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      institutionName: account.institutionName ?? undefined,
      lastFour: account.lastFour ?? undefined,
      initialBalance: Number(account.initialBalance),
      currentBalance: Number(account.currentBalance),
      description: account.description ?? undefined,
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
  }
}

function normalizeOptionalText(value: string | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.replace(/\s+/g, ' ').trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}
