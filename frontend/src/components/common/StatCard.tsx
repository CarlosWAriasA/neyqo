import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/card';

interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: 'neutral' | 'positive' | 'danger' | 'warning' | 'info';
}

const toneClass = {
  neutral: 'bg-muted text-subtle',
  positive: 'bg-positive/10 text-positive',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

export function StatCard({ label, value, helper, icon: Icon, tone = 'neutral' }: StatCardProps) {
  return (
    <Card className="min-h-36">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-subtle">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-text">{value}</p>
        </div>
        <span className={`rounded-panel p-2 ${toneClass[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-sm text-subtle">{helper}</p>
    </Card>
  );
}
