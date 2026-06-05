export type ThemePreference = 'light' | 'dark' | 'system';

export const themeStorageKey = 'neyqo.theme';

export function getStoredThemePreference(): ThemePreference {
  const stored = localStorage.getItem(themeStorageKey);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return preference;
}

export function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}
