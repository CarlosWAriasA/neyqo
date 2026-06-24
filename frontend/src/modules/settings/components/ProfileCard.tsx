import { KeyRound, MailCheck, Trash2, UserRound } from 'lucide-react';
import type { AuthUser } from '../../../types/auth';
import { Field } from '../../../components/forms/Field';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';

interface ProfileCardProps {
  user: AuthUser | null;
  onDeleteAccountClick: () => void;
}

const providerLabels: Record<AuthUser['providers'][number], string> = {
  email: 'Correo y contraseña',
  google: 'Google / Gmail',
  microsoft: 'Outlook / Microsoft',
};

function getConnectedProviderLabels(user: AuthUser | null) {
  return (user?.providers ?? []).filter((provider) => provider !== 'email').map((provider) => providerLabels[provider]);
}

export function ProfileCard({ user, onDeleteAccountClick }: ProfileCardProps) {
  const connectedProviderLabels = getConnectedProviderLabels(user);

  return (
    <Card className="content-start">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-text">Cuenta</h2>
        </div>
        <Badge tone={user?.emailVerified ? 'income' : 'warning'}>
          {user?.emailVerified ? 'Verificada' : 'Pendiente'}
        </Badge>
      </div>
      <div className="mt-5 grid gap-4">
        <Field label="Nombre">
          <Input defaultValue={user?.fullName || 'Usuario'} disabled />
        </Field>
        <Field label="Correo">
          <Input defaultValue={user?.email || ''} disabled />
        </Field>
        <div className="grid gap-3">
          <div className="flex items-start gap-3 rounded-panel border border-border bg-muted/30 p-4">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-text">Estado del correo</p>
              <p className="mt-1 text-sm leading-6 text-subtle">
                {user?.emailVerified
                  ? 'Correo verificado.'
                  : 'Verificación pendiente.'}
              </p>
            </div>
          </div>
          {user?.hasPasswordAccess ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-border bg-muted/30 p-4">
              <span className="flex gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-medium text-text">Contraseña</span>
                  <span className="mt-1 block text-sm leading-6 text-subtle">Acceso por correo.</span>
                </span>
              </span>
              <Button variant="secondary" disabled>
                Cambiar
              </Button>
            </div>
          ) : (
            <div className="rounded-panel border border-border bg-muted/30 p-4">
              <div className="flex gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-text">Acceso conectado</p>
                  <p className="mt-1 text-sm leading-6 text-subtle">
                    {connectedProviderLabels.length > 0 ? connectedProviderLabels.join(', ') : 'Proveedor conectado'}.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {connectedProviderLabels.map((label) => (
                      <Badge key={label} tone="transfer">
                        Conectado con {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-danger/30 bg-danger/5 p-4">
            <span className="flex gap-3">
              <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium text-text">Eliminar cuenta</span>
                <span className="mt-1 block text-sm leading-6 text-subtle">Borra la cuenta y su información.</span>
              </span>
            </span>
            <Button variant="danger" onClick={onDeleteAccountClick}>
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
