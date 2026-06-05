import { WalletMinimal } from 'lucide-react';
import { env } from '../../config/env';

export function BrandMark() {
  return (
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
}
