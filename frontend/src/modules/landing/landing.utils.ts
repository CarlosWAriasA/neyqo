export function coerceAuthMode(value: string | null): 'login' | 'register' | 'forgot-password' | null {
  return value === 'login' || value === 'register' || value === 'forgot-password' ? value : null;
}
