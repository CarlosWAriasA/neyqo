import { WalletMinimal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { env } from '../../config/env';

interface BrandMarkProps {
  to?: string;
}

export function BrandMark({ to }: BrandMarkProps) {
  const content = (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-panel bg-primary text-white shadow-panel">
        <WalletMinimal className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-lg font-semibold text-text">{env.appName}</p>
        <p className="text-xs text-subtle">Finanzas claras</p>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} aria-label="Ir al dashboard" className="inline-flex rounded-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        {content}
      </Link>
    );
  }

  return content;
}
