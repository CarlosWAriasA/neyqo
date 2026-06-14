import { Coins, EyeOff, Palette } from 'lucide-react';
import type { UserPreferences } from '../../../config/userPreferences';
import { Field } from '../../../components/forms/Field';
import { Card } from '../../../components/ui/card';
import { Select } from '../../../components/ui/select';
import { ToggleRow } from './ToggleRow';

interface PreferencesCardProps {
  preferences: UserPreferences;
  onChange: <Key extends keyof UserPreferences>(key: Key, value: UserPreferences[Key]) => void;
}

export function PreferencesCard({ preferences, onChange }: PreferencesCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <Palette className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold text-text">Preferencias</h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Moneda principal">
          <Select
            value={preferences.primaryCurrency}
            onChange={(event) => onChange('primaryCurrency', event.target.value as UserPreferences['primaryCurrency'])}
          >
            <option value="DOP">Peso dominicano</option>
            <option value="USD">Dólar estadounidense</option>
            <option value="EUR">Euro</option>
          </Select>
        </Field>
        <Field label="Formato de fecha">
          <Select
            value={preferences.dateFormat}
            onChange={(event) => onChange('dateFormat', event.target.value as UserPreferences['dateFormat'])}
          >
            <option value="dd-mm-yyyy">DD/MM/YYYY</option>
            <option value="yyyy-mm-dd">YYYY-MM-DD</option>
          </Select>
        </Field>
        <Field label="Primer día de la semana">
          <Select
            value={preferences.weekStartsOn}
            onChange={(event) => onChange('weekStartsOn', event.target.value as UserPreferences['weekStartsOn'])}
          >
            <option value="monday">Lunes</option>
            <option value="sunday">Domingo</option>
          </Select>
        </Field>
        <Field label="Tema visual">
          <Select
            value={preferences.theme}
            onChange={(event) => onChange('theme', event.target.value as UserPreferences['theme'])}
          >
            <option value="system">Sistema</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </Select>
        </Field>
      </div>
      <div className="mt-5 grid gap-3">
        <ToggleRow
          icon={EyeOff}
          title="Ocultar balances sensibles"
          description="Reduce la exposición de montos cuando uses la app frente a otras personas."
          checked={preferences.hideBalances}
          onChange={(checked) => onChange('hideBalances', checked)}
        />
        <ToggleRow
          icon={Coins}
          title="Alertas de presupuesto"
          description="Prepara avisos cuando una categoría se acerque a su límite."
          checked={preferences.budgetAlerts}
          onChange={(checked) => onChange('budgetAlerts', checked)}
        />
      </div>
    </Card>
  );
}
