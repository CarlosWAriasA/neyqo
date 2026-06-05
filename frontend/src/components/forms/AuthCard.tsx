import type { ReactNode } from 'react';
import { Card } from '../ui/card';

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className="p-6 shadow-panel">
      <h1 className="text-2xl font-semibold text-text">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-subtle">{description}</p>
      <div className="mt-6">{children}</div>
    </Card>
  );
}
