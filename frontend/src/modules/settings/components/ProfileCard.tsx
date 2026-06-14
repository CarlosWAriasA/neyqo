import { UserRound } from 'lucide-react';
import type { AuthUser } from '../../../types/auth';
import { Field } from '../../../components/forms/Field';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';

interface ProfileCardProps {
  user: AuthUser | null;
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
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
  );
}
