import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/button';

const confirmationPhrase = 'ELIMINAR MI CUENTA';

interface DeleteAccountDialogProps {
  pending: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    confirmationText: string;
    acceptedIrreversibleDeletion: boolean;
  }) => void;
}

export function DeleteAccountDialog({ pending, onClose, onConfirm }: DeleteAccountDialogProps) {
  const [acceptedIrreversibleDeletion, setAcceptedIrreversibleDeletion] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const canConfirm = useMemo(
    () => acceptedIrreversibleDeletion && confirmationText.trim() === confirmationPhrase,
    [acceptedIrreversibleDeletion, confirmationText],
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-text/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-panel bg-surface p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-panel bg-danger/10 text-danger">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="delete-account-title" className="text-lg font-semibold text-text">
                Eliminar cuenta permanentemente
              </h2>
              <p className="mt-2 text-sm leading-6 text-subtle">
                Esta acción borra tu cuenta de Neyqo y no se puede deshacer.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose} disabled={pending}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-5 rounded-panel border border-danger/30 bg-danger/5 p-4 text-sm leading-6 text-subtle">
          <p className="font-medium text-text">Al eliminar tu cuenta:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Se borrarán tus cuentas financieras, balances, categorías, presupuestos y movimientos.</li>
            <li>Se eliminarán movimientos programados, reglas de importación, conexiones de correo y datos importados.</li>
            <li>Se cerrará tu sesión actual y perderás acceso inmediato a Neyqo.</li>
            <li>No podremos restaurar la información después de confirmar la eliminación.</li>
            <li>Si vuelves a registrarte con el mismo correo, empezarás con una cuenta nueva sin historial anterior.</li>
          </ul>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-panel border border-border bg-muted/30 p-4">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 rounded border-border accent-danger"
            checked={acceptedIrreversibleDeletion}
            onChange={(event) => setAcceptedIrreversibleDeletion(event.target.checked)}
            disabled={pending}
          />
          <span className="text-sm leading-6 text-subtle">
            Leí todo lo anterior y acepto eliminar mi cuenta y toda la información asociada de forma permanente.
          </span>
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-text">
            Escribe <span className="font-semibold">{confirmationPhrase}</span> para confirmar
          </span>
          <input
            className="mt-2 h-11 w-full rounded-panel border border-border bg-surface px-3 text-sm text-text outline-none transition placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            disabled={pending}
            autoComplete="off"
          />
        </label>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm({ confirmationText, acceptedIrreversibleDeletion })}
            disabled={!canConfirm || pending}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {pending ? 'Eliminando...' : 'Eliminar cuenta'}
          </Button>
        </div>
      </div>
    </div>
  );
}
