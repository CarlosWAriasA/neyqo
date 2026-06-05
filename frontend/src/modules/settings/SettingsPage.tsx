import {
  CalendarDays,
  Coins,
  EyeOff,
  LogOut,
  Palette,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { logout, restoreStoredUser } from '../../api/auth';
import { getUserPreferences, updateUserPreferences } from '../../api/preferences';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Field } from '../../components/forms/Field';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import {
  getStoredUserPreferences,
  saveUserPreferences,
  type UserPreferences,
} from '../../config/userPreferences';
import { useTheme } from '../../theme/theme-context';

export function SettingsPage() {
  const { preference, setPreference } = useTheme();
  const user = restoreStoredUser();
  const localPreferences = useMemo(
    () => ({
      ...getStoredUserPreferences(),
      theme: preference,
    }),
    [preference],
  );
  const preferencesQuery = useQuery({
    queryKey: ['user-preferences'],
    queryFn: getUserPreferences,
  });
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences>(localPreferences);
  const [preferences, setPreferences] = useState<UserPreferences>(localPreferences);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const savePreferencesMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: (serverPreferences) => {
      const nextPreferences = toUserPreferences(serverPreferences);
      saveUserPreferences(nextPreferences);
      setSavedPreferences(nextPreferences);
      setPreferences(nextPreferences);
      setPreference(nextPreferences.theme);
      toast.success('Preferencias guardadas.');
    },
    onError: (error) => {
      toast.error(getPreferenceErrorMessage(error));
    },
  });
  const hasChanges = JSON.stringify(preferences) !== JSON.stringify(savedPreferences);

  useEffect(() => {
    if (!preferencesQuery.data) {
      return;
    }

    const serverPreferences = toUserPreferences(preferencesQuery.data);
    saveUserPreferences(serverPreferences);
    setSavedPreferences(serverPreferences);
    setPreferences(serverPreferences);
    setPreference(serverPreferences.theme);
  }, [preferencesQuery.data, setPreference]);

  function updatePreference<Key extends keyof UserPreferences>(
    key: Key,
    value: UserPreferences[Key],
  ) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSave() {
    savePreferencesMutation.mutate(preferences);
  }

  async function handleLogout() {
    setLogoutPending(true);

    try {
      await logout();
      window.location.href = '/';
    } finally {
      setLogoutPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Configuración"
        description="Ajusta cómo Neyqo presenta tu información y administra la sesión activa."
        actions={
          <>
            {preferencesQuery.isLoading ? <Badge tone="neutral">Cargando preferencias</Badge> : null}
            <Button onClick={handleSave} disabled={!hasChanges || savePreferencesMutation.isPending}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {savePreferencesMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </>
        }
      />

      {preferencesQuery.isError ? (
        <ErrorState
          title="No pudimos cargar tus preferencias"
          description="Puedes seguir usando la copia local y reintentar cuando el servidor esté disponible."
          onRetry={() => void preferencesQuery.refetch()}
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="content-start">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-text">Perfil básico</h2>
          </div>
          <div className="mt-5 grid gap-4">
            <Field label="Nombre">
              <Input defaultValue={user?.fullName || 'Usuario'} disabled />
            </Field>
            <Field label="Correo">
              <Input defaultValue={user?.email || ''} disabled />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Badge tone={user?.emailVerified ? 'income' : 'warning'}>
                {user?.emailVerified ? 'Correo verificado' : 'Pendiente de verificación'}
              </Badge>
              <Badge tone="neutral">Perfil local</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-text">Preferencias</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Moneda principal">
              <Select
                value={preferences.primaryCurrency}
                onChange={(event) => updatePreference('primaryCurrency', event.target.value as UserPreferences['primaryCurrency'])}
              >
                <option value="DOP">Peso dominicano</option>
                <option value="USD">Dólar estadounidense</option>
                <option value="EUR">Euro</option>
              </Select>
            </Field>
            <Field label="Formato de fecha">
              <Select
                value={preferences.dateFormat}
                onChange={(event) => updatePreference('dateFormat', event.target.value as UserPreferences['dateFormat'])}
              >
                <option value="dd-mm-yyyy">DD/MM/YYYY</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
              </Select>
            </Field>
            <Field label="Primer día de la semana">
              <Select
                value={preferences.weekStartsOn}
                onChange={(event) => updatePreference('weekStartsOn', event.target.value as UserPreferences['weekStartsOn'])}
              >
                <option value="monday">Lunes</option>
                <option value="sunday">Domingo</option>
              </Select>
            </Field>
            <Field label="Tema visual">
              <Select
                value={preferences.theme}
                onChange={(event) => updatePreference('theme', event.target.value as UserPreferences['theme'])}
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
              onChange={(checked) => updatePreference('hideBalances', checked)}
            />
            <ToggleRow
              icon={Coins}
              title="Alertas de presupuesto"
              description="Prepara avisos cuando una categoría se acerque a su límite."
              checked={preferences.budgetAlerts}
              onChange={(checked) => updatePreference('budgetAlerts', checked)}
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-text">Moneda y calendario</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-subtle">
            La moneda principal se usará para resúmenes y reportes. Las cuentas seguirán conservando
            su propia moneda para evitar mezclar balances sin conversión.
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="font-semibold text-text">Sesión</h2>
            </div>
            <Badge tone="neutral">Activa</Badge>
          </div>
          <p className="mt-4 text-sm leading-6 text-subtle">
            Cierra la sesión en este navegador cuando termines de trabajar o compartas el equipo.
          </p>
          <div className="mt-5 flex justify-end">
            <Button variant="danger" onClick={() => setLogoutOpen(true)}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </Button>
          </div>
        </Card>
      </section>

      {logoutOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-text/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !logoutPending) {
              setLogoutOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-panel bg-surface p-5 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-text">Cerrar sesión</h2>
                <p className="mt-2 text-sm leading-6 text-subtle">
                  Se cerrará tu sesión en este navegador y volverás a la página principal.
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setLogoutOpen(false)}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setLogoutOpen(false)} disabled={logoutPending}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleLogout} disabled={logoutPending}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {logoutPending ? 'Cerrando...' : 'Cerrar sesión'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getPreferenceErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || 'No pudimos guardar tus preferencias. Intenta nuevamente.';
}

function toUserPreferences(preferences: UserPreferences): UserPreferences {
  return {
    primaryCurrency: preferences.primaryCurrency,
    dateFormat: preferences.dateFormat,
    weekStartsOn: preferences.weekStartsOn,
    theme: preferences.theme,
    hideBalances: preferences.hideBalances,
    budgetAlerts: preferences.budgetAlerts,
  };
}

interface ToggleRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ icon: Icon, title, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-panel border border-border bg-canvas/50 p-4">
      <span className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-sm font-medium text-text">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-subtle">{description}</span>
        </span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
