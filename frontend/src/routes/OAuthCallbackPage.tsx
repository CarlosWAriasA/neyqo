import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authStorage } from '../api/client';
import { getCurrentUser } from '../api/auth';
import type { AuthUser } from '../types/auth';

interface OAuthSessionPayload {
  accessToken: string;
  user: AuthUser;
}

type OAuthProvider = 'google' | 'microsoft';
const oauthResultStorageKey = 'neyqo.oauth-result';

interface OAuthMessage {
  type: 'oauth_success' | 'oauth_error';
  provider: OAuthProvider | null;
  token?: string;
  user?: AuthUser;
  error?: string;
}

function getOAuthErrorMessage(error: string) {
  if (error === 'account_exists') {
    return 'Ya existe una cuenta con ese correo. Inicia sesión con tu contraseña.';
  }

  return 'No pudimos completar la autenticación con el proveedor.';
}

function createOAuthChannel() {
  if (typeof BroadcastChannel === 'undefined') {
    return null;
  }

  try {
    return new BroadcastChannel('neyqo-oauth');
  } catch {
    return null;
  }
}

function decodeOAuthSession(rawSession: string): OAuthSessionPayload | null {
  try {
    const base64 = rawSession.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const parsed = JSON.parse(atob(padded)) as Partial<OAuthSessionPayload>;

    if (typeof parsed.accessToken === 'string' && parsed.user) {
      return {
        accessToken: parsed.accessToken,
        user: parsed.user,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function persistOAuthSession(session: OAuthSessionPayload) {
  authStorage.setSession(session.accessToken, session.user);
}

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const session = searchParams.get('session');
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider') as 'google' | 'microsoft' | null;
    const targetOrigin = window.location.origin;
    const channel = createOAuthChannel();

    const notifyParent = (message: OAuthMessage) => {
      try {
        localStorage.setItem(oauthResultStorageKey, JSON.stringify(message));
      } catch {
        // Best effort only; navigation must continue even when browser storage is blocked.
      }

      try {
        window.opener?.postMessage(message, targetOrigin);
      } catch {
        // Best effort only.
      }

      try {
        channel?.postMessage(message);
      } catch {
        // Best effort only.
      }
    };

    const finishOAuthFlow = (fallbackPath: string) => {
      try {
        channel?.close();
      } catch {
        // Best effort only.
      }

      if (window.opener) {
        try {
          window.close();
        } finally {
          window.setTimeout(() => {
            if (!window.closed) {
              window.location.replace(fallbackPath);
            }
          }, 500);
        }
        return;
      }

      window.location.replace(fallbackPath);
    };

    const finishSuccess = (payload: OAuthSessionPayload) => {
      persistOAuthSession(payload);
      notifyParent(
        {
          type: 'oauth_success',
          provider,
          token: payload.accessToken,
          user: payload.user,
        },
      );
      window.setTimeout(() => finishOAuthFlow('/app/dashboard'), 250);
    };

    if (error) {
      notifyParent(
        { type: 'oauth_error', provider, error: getOAuthErrorMessage(error) },
      );
      window.setTimeout(() => finishOAuthFlow('/?auth=login'), 250);
      return;
    }

    if (session) {
      const decodedSession = decodeOAuthSession(session);

      if (decodedSession) {
        finishSuccess(decodedSession);
        return;
      }
    }

    if (!token) {
      notifyParent(
        { type: 'oauth_error', provider, error: 'No pudimos completar la autenticación con el proveedor.' },
      );
      window.setTimeout(() => finishOAuthFlow('/?auth=login'), 250);
      return;
    }

    authStorage.setAccessToken(token);

    getCurrentUser()
      .then((user) => {
        finishSuccess({ accessToken: token, user });
      })
      .catch(() => {
        notifyParent(
          { type: 'oauth_error', provider, error: 'No pudimos verificar tu sesión.' },
        );
        window.setTimeout(() => finishOAuthFlow('/?auth=login'), 250);
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-subtle">Completando autenticación...</p>
      </div>
    </div>
  );
}
