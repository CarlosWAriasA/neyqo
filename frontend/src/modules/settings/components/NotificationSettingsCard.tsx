import { Bell, CalendarClock, TrendingUp } from 'lucide-react';
import type { UserPreferences } from '../../../config/userPreferences';
import { Card } from '../../../components/ui/card';
import { ToggleRow } from './ToggleRow';

interface NotificationSettingsCardProps {
  preferences: UserPreferences;
  onChange: <Key extends keyof UserPreferences>(key: Key, value: UserPreferences[Key]) => void;
}

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
        <ToggleRow
          icon={CalendarClock}
          title="Recordatorios de pagos programados"
          description="Avisos antes de tus próximos pagos."
          checked={preferences.scheduledPaymentReminders}
          onChange={(checked) => onChange('scheduledPaymentReminders', checked)}
        />
        <ToggleRow
          icon={TrendingUp}
          title="Gastos inusuales"
          description="Alertas sobre consumos fuera de lo normal."
          checked={preferences.unusualSpendingAlerts}
          onChange={(checked) => onChange('unusualSpendingAlerts', checked)}
        />
      </div>
    </Card>
  );
}
