import type { AxiosError } from 'axios';
import type { AccountPayload } from '../../api/financial';
import type { Account } from '../../types/financial';
import type { AccountFormSubmitValues, AccountFormValues } from './accounts.schema';

export function toAccountPayload(values: AccountFormSubmitValues): AccountPayload {
  return {
    ...values,
    institutionName: values.institutionName?.trim() || undefined,
    lastFour: values.lastFour?.trim() || undefined,
    description: values.description?.trim() || undefined,
  };
}

export function toAccountFormValues(account: Account): AccountFormValues {
  return {
    name: account.name,
    type: account.type,
    currency: account.currency,
    institutionName: account.institutionName ?? '',
    lastFour: account.lastFour ?? '',
    initialBalance: account.initialBalance,
    description: account.description ?? '',
  };
}

export function getAccountErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
}
