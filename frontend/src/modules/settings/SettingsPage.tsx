import { Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { deleteAccount, logout, restoreStoredUser } from '../../api/auth';
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
import { financeQueryKeys } from '../../features/finance/queryKeys';
import { useTheme } from '../../theme/theme-context';
import { LegalCard } from './components/LegalCard';
import { LogoutDialog } from './components/LogoutDialog';
import { CurrencyCard } from './components/CurrencyCard';
import { DataBackupCard } from './components/DataBackupCard';
import { DeleteAccountDialog } from './components/DeleteAccountDialog';
import { IntegrationsSettingsCard } from './components/IntegrationsSettingsCard';
import { NotificationSettingsCard } from './components/NotificationSettingsCard';
import { PreferencesCard } from './components/PreferencesCard';
import { ProfileCard } from './components/ProfileCard';
import { SecurityPrivacyCard } from './components/SecurityPrivacyCard';
import { SessionCard } from './components/SessionCard';
import { getAccountActionErrorMessage, getPreferenceErrorMessage, toUserPreferences } from './settings.utils';

export function SettingsPage() {
  const { preference, setPreference } = useTheme();
  const queryClient = useQueryClient();
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
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const savePreferencesMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: (serverPreferences) => {
      const nextPreferences = toUserPreferences(serverPreferences);
      queryClient.setQueryData(financeQueryKeys.preferences, serverPreferences);
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
  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success('Tu cuenta fue eliminada.');
      window.location.href = '/';
    },
    onError: (error) => {
      toast.error(getAccountActionErrorMessage(error));
    },
  });

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
        description="Cuenta, preferencias y seguridad."
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
          description="Puedes seguir usando tus ajustes guardados y reintentar en unos segundos."
          onRetry={() => void preferencesQuery.refetch()}
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <ProfileCard user={user} onDeleteAccountClick={() => setDeleteAccountOpen(true)} />
        <PreferencesCard preferences={preferences} onChange={updatePreference} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <CurrencyCard preferences={preferences} onChange={updatePreference} />
        <DataBackupCard />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SecurityPrivacyCard preferences={preferences} onChange={updatePreference} />
        <NotificationSettingsCard preferences={preferences} onChange={updatePreference} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <IntegrationsSettingsCard />
        <SessionCard onLogoutClick={() => setLogoutOpen(true)} />
      </section>

      <section>
        <LegalCard />
      </section>

      {logoutOpen ? (
        <LogoutDialog
          pending={logoutPending}
          onClose={() => setLogoutOpen(false)}
          onConfirm={() => void handleLogout()}
        />
      ) : null}

      {deleteAccountOpen ? (
        <DeleteAccountDialog
          pending={deleteAccountMutation.isPending}
          onClose={() => setDeleteAccountOpen(false)}
          onConfirm={(payload) => deleteAccountMutation.mutate(payload)}
        />
      ) : null}
    </div>
  );
}
