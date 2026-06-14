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
    <Card className="min-h-0 p-3 sm:min-h-36 sm:p-5">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-xs leading-5 text-subtle sm:text-sm">{label}</p>
          <p className="mt-1 text-lg font-semibold text-text sm:mt-3 sm:text-2xl">{value}</p>
        </div>
        <span className={`hidden rounded-panel p-2 sm:inline-flex ${toneClass[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 hidden text-sm text-subtle sm:block">{helper}</p>
    </Card>
  );
}
