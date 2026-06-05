import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from './theme-context';
import { applyTheme, getStoredThemePreference, themeStorageKey, type ThemePreference } from './theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredThemePreference());

  useEffect(() => {
    applyTheme(preference);
    localStorage.setItem(themeStorageKey, preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== 'system') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, [preference]);

  const value = useMemo(
    () => ({
      preference,
      setPreference: setPreferenceState,
    }),
    [preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
