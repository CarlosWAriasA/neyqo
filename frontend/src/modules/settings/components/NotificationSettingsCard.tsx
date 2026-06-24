import { Bell, CalendarClock, TrendingUp } from 'lucide-react';
import type { UserPreferences } from '../../../config/userPreferences';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { ToggleRow } from './ToggleRow';

interface NotificationSettingsCardProps {
  preferences: UserPreferences;
  onChange: <Key extends keyof UserPreferences>(key: Key, value: UserPreferences[Key]) => void;
}

const upcomingNotifications = [
  {
    title: 'Recordatorios de pagos programados',
    description: 'Avisos antes de tus próximos pagos.',
    icon: CalendarClock,
  },
  {
    title: 'Gastos inusuales',
    description: 'Alertas sobre consumos fuera de lo normal.',
    icon: TrendingUp,
  },
];

export function NotificationSettingsCard({ preferences, onChange }: NotificationSettingsCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold text-text">Notificaciones</h2>
      </div>
      <div className="mt-5 grid gap-3">
        <ToggleRow
          icon={Bell}
          title="Alertas de presupuesto"
          description="Avisos cuando un presupuesto esté cerca del límite."
          checked={preferences.budgetAlerts}
          onChange={(checked) => onChange('budgetAlerts', checked)}
        />
        {upcomingNotifications.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="flex items-start justify-between gap-4 rounded-panel border border-border bg-muted/30 p-4">
              <span className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-text">{item.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-subtle">{item.description}</span>
                </span>
              </span>
              <Badge tone="neutral">En camino</Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
