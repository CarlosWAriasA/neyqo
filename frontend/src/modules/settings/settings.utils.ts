import type { AxiosError } from 'axios';
import type { UserPreferences } from '../../config/userPreferences';

export function toUserPreferences(preferences: UserPreferences): UserPreferences {
  return {
    primaryCurrency: preferences.primaryCurrency,
    dateFormat: preferences.dateFormat,
    weekStartsOn: preferences.weekStartsOn,
    theme: preferences.theme,
    hideBalances: preferences.hideBalances,
    budgetAlerts: preferences.budgetAlerts,
  };
}

export function getPreferenceErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || 'No pudimos guardar tus preferencias. Intenta nuevamente.';
}
