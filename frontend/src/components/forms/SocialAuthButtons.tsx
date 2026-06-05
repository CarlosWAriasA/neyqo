import { env } from '../../config/env';
import { cn } from '../../utils/cn';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="0" y="0" width="8.5" height="8.5" fill="#F25022"/>
    <rect x="9.5" y="0" width="8.5" height="8.5" fill="#7FBA00"/>
    <rect x="0" y="9.5" width="8.5" height="8.5" fill="#00A4EF"/>
    <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900"/>
  </svg>
);

interface SocialAuthButtonsProps {
  googleLabel: string;
  microsoftLabel: string;
  onSuccess?: (provider: 'google' | 'microsoft') => void;
  onError?: (message: string) => void;
  loading?: boolean;
}

type OAuthProvider = 'google' | 'microsoft';
const oauthResultStorageKey = 'neyqo.oauth-result';

export function SocialAuthButtons({ googleLabel, microsoftLabel, loading }: SocialAuthButtonsProps) {
  const apiBase = env.apiBaseUrl.startsWith('http')
    ? env.apiBaseUrl
    : `${window.location.protocol}//${window.location.hostname}:3000/api`;

  const startOAuthRedirect = (provider: OAuthProvider) => {
    const url = new URL(`${apiBase}/auth/oauth/${provider}/start`);
    url.searchParams.set('returnTo', window.location.origin);
    localStorage.removeItem(oauthResultStorageKey);
    window.location.assign(url.toString());
  };

  const isDisabled = Boolean(loading);

  return (
    <div className="grid gap-3">
      <button
        type="button"
        id="btn-google-auth"
        disabled={isDisabled}
        onClick={() => startOAuthRedirect('google')}
        className={cn(
          'flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text shadow-soft transition',
          'hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <GoogleIcon />
        {googleLabel}
      </button>
      <button
        type="button"
        id="btn-microsoft-auth"
        disabled={isDisabled}
        onClick={() => startOAuthRedirect('microsoft')}
        className={cn(
          'flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text shadow-soft transition',
          'hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        <MicrosoftIcon />
        {microsoftLabel}
      </button>
    </div>
  );
}
