import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-text">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs font-normal text-danger">{error}</span> : null}
    </label>
  );
}
