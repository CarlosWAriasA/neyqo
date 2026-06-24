import { EyeOff, KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import type { UserPreferences } from '../../../config/userPreferences';
import type { AuthUser } from '../../../types/auth';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { ToggleRow } from './ToggleRow';

interface SecurityPrivacyCardProps {
  user: AuthUser | null;
  preferences: UserPreferences;
  onChange: <Key extends keyof UserPreferences>(key: Key, value: UserPreferences[Key]) => void;
}

export function SecurityPrivacyCard({ user, preferences, onChange }: SecurityPrivacyCardProps) {
  const canChangePassword = Boolean(user?.hasPasswordAccess);
  const linkedProviders = user?.providers.filter((provider) => provider !== 'email') ?? [];

  return (
    <Card>
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="font-semibold text-text">Seguridad y privacidad</h2>
      </div>
      <div className="mt-5 grid gap-3">
        <ToggleRow
          icon={EyeOff}
          title="Ocultar balances sensibles"
          description="Muestra tus balances en modo privado."
          checked={preferences.hideBalances}
          onChange={(checked) => onChange('hideBalances', checked)}
        />
        {canChangePassword ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-border bg-muted/30 p-4">
            <span className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-medium text-text">Cambiar contraseña</span>
                <span className="mt-1 block text-sm leading-6 text-subtle">Actualiza tu acceso por correo.</span>
              </span>
            </span>
            <Button variant="secondary" onClick={() => { window.location.href = '/forgot-password'; }}>
              Actualizar
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-border bg-muted/30 p-4">
            <span className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-primary-soft text-primary">
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-medium text-text">Acceso vinculado</span>
                <span className="mt-1 block text-sm leading-6 text-subtle">
                  Esta cuenta entra con {formatProviders(linkedProviders)}.
                </span>
              </span>
            </span>
            <Badge tone="neutral">Sin contraseña</Badge>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-danger/30 bg-danger/5 p-4">
          <span className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-danger/10 text-danger">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-medium text-text">Borrar datos financieros</span>
              <span className="mt-1 block text-sm leading-6 text-subtle">Limpia tu historial y conserva el acceso.</span>
            </span>
          </span>
          <Badge tone="warning">En camino</Badge>
        </div>
      </div>
    </Card>
  );
}

function formatProviders(providers: AuthUser['providers']) {
  if (providers.includes('google')) {
    return 'Google';
  }

  if (providers.includes('microsoft')) {
    return 'Microsoft';
  }

  return 'un proveedor externo';
}
