import type { CurrencyCode } from '../types/financial';
import type { ThemePreference } from '../theme/theme';

export type DateFormatPreference = 'dd-mm-yyyy' | 'yyyy-mm-dd';
export type WeekStartPreference = 'monday' | 'sunday';

export interface UserPreferences {
  primaryCurrency: CurrencyCode;
  dateFormat: DateFormatPreference;
  weekStartsOn: WeekStartPreference;
  theme: ThemePreference;
  hideBalances: boolean;
  budgetAlerts: boolean;
}

export const userPreferencesStorageKey = 'neyqo.preferences';

export const defaultUserPreferences: UserPreferences = {
  primaryCurrency: 'DOP',
  dateFormat: 'dd-mm-yyyy',
  weekStartsOn: 'monday',
  theme: 'system',
  hideBalances: false,
  budgetAlerts: true,
};

export function getStoredUserPreferences(): UserPreferences {
  const stored = localStorage.getItem(userPreferencesStorageKey);

  if (!stored) {
    return defaultUserPreferences;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<UserPreferences>;

    return {
      primaryCurrency: isCurrency(parsed.primaryCurrency) ? parsed.primaryCurrency : 'DOP',
      dateFormat: parsed.dateFormat === 'yyyy-mm-dd' ? 'yyyy-mm-dd' : 'dd-mm-yyyy',
      weekStartsOn: parsed.weekStartsOn === 'sunday' ? 'sunday' : 'monday',
      theme: isTheme(parsed.theme) ? parsed.theme : 'system',
      hideBalances: Boolean(parsed.hideBalances),
      budgetAlerts: parsed.budgetAlerts !== false,
    };
  } catch {
    return defaultUserPreferences;
  }
}

export function saveUserPreferences(preferences: UserPreferences) {
  localStorage.setItem(userPreferencesStorageKey, JSON.stringify(preferences));
}

function isCurrency(value: unknown): value is CurrencyCode {
  return value === 'DOP' || value === 'USD' || value === 'EUR';
}

function isTheme(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}
