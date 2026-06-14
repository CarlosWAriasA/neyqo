import { LogOut, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface LogoutDialogProps {
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutDialog({ pending, onClose, onConfirm }: LogoutDialogProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-text/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
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
          <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={pending}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {pending ? 'Cerrando...' : 'Cerrar sesión'}
          </Button>
        </div>
      </div>
    </div>
  );
}
