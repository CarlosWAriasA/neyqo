import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Algo no salió bien',
  description = 'Intenta nuevamente en unos minutos.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-panel border border-danger/20 bg-danger/5 p-5 text-danger">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5" aria-hidden="true" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm">{description}</p>
          {onRetry ? (
            <Button variant="secondary" className="mt-4" onClick={onRetry}>
              Reintentar
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
