import { Save } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { logout, restoreStoredUser } from '../../api/auth';
import { updateUserPreferences } from '../../api/preferences';
import { PageHeader } from '../../components/common/PageHeader';
import { Skeleton } from '../../components/common/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/ui/button';
import {
  getStoredUserPreferences,
  saveUserPreferences,
  type UserPreferences,
} from '../../config/userPreferences';
import { usePreferences } from '../../features/finance/hooks';
import { useTheme } from '../../theme/theme-context';
import { CalendarInfoCard } from './components/CalendarInfoCard';
import { LogoutDialog } from './components/LogoutDialog';
import { PreferencesCard } from './components/PreferencesCard';
import { ProfileCard } from './components/ProfileCard';
import { SessionCard } from './components/SessionCard';
import { getPreferenceErrorMessage, toUserPreferences } from './settings.utils';

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
  const preferencesQuery = usePreferences();
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
            {preferencesQuery.isLoading ? <Skeleton className="h-10 w-40" /> : null}
            <Button onClick={() => savePreferencesMutation.mutate(preferences)} disabled={!hasChanges || savePreferencesMutation.isPending}>
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
        <ProfileCard user={user} />
        <PreferencesCard preferences={preferences} onChange={updatePreference} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CalendarInfoCard />
        <SessionCard onLogoutClick={() => setLogoutOpen(true)} />
      </section>

      {logoutOpen ? (
        <LogoutDialog
          pending={logoutPending}
          onClose={() => setLogoutOpen(false)}
          onConfirm={() => void handleLogout()}
        />
      ) : null}
    </div>
  );
}
