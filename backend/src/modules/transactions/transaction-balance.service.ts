import type { EntityManager } from 'typeorm';
import { Account } from '../../entities/account.entity';
import { Transaction } from '../../entities/transaction.entity';
import { AuthError } from '../auth/auth.service';
import { formatMoney } from '../shared/money';

export interface BalanceTransactionInput {
  type: Transaction['type'];
  amount: string;
  destinationAmount: string | null;
  sourceAccount: Account;
  destinationAccount: Account | null;
}

export class TransactionBalanceService {
  async apply(manager: EntityManager, transaction: BalanceTransactionInput): Promise<void> {
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
    await this.updateAccountBalance(manager, transaction.destinationAccount!, resolveDestinationAmount(transaction));
  }

  async reverse(manager: EntityManager, transaction: Transaction): Promise<void> {
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
    await this.updateAccountBalance(manager, transaction.destinationAccount, -resolveDestinationAmount(transaction));
  }

  private async updateAccountBalance(manager: EntityManager, account: Account, delta: number): Promise<void> {
    account.currentBalance = formatMoney(Number(account.currentBalance) + delta);
    await manager.save(Account, account);
  }
}

function resolveDestinationAmount(transaction: BalanceTransactionInput | Transaction): number {
  return Number(transaction.destinationAmount ?? transaction.amount);
}
