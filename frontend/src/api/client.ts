import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';

const accessTokenStorageKey = 'neyqo.access-token';
const sessionStorageKey = 'neyqo.session';
const rememberedEmailStorageKey = 'neyqo.remembered-email';

const REFRESH_LEAD_MS = 60_000;
const REFRESH_PATH = '/auth/refresh';

function isRememberedSession() {
  return Boolean(localStorage.getItem(accessTokenStorageKey) || localStorage.getItem(sessionStorageKey));
}

function decodeJwtExpiry(token: string): number | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const payloadSegment = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadSegment.padEnd(payloadSegment.length + ((4 - (payloadSegment.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshInFlight: Promise<string | null> | null = null;

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export function scheduleSilentRefresh(accessToken: string | null | undefined) {
  clearRefreshTimer();

  if (!accessToken) {
    return;
  }

  const expiry = decodeJwtExpiry(accessToken);

  if (!expiry) {
    return;
  }

  const delay = Math.max(expiry - Date.now() - REFRESH_LEAD_MS, 0);

  refreshTimer = setTimeout(() => {
    void silentRefresh();
  }, delay);
}

export function clearSilentRefresh() {
  clearRefreshTimer();
}

async function silentRefresh(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await axios.post<{
        accessToken: string;
        user: unknown;
      }>(`${env.apiBaseUrl}${REFRESH_PATH}`, undefined, {
        withCredentials: true,
      });

      const newToken = response.data.accessToken;

      authStorage.setSession(newToken, response.data.user, authStorage.isRemembered());
      scheduleSilentRefresh(newToken);

      return newToken;
    } catch {
      window.dispatchEvent(new CustomEvent('neyqo:session-expired'));
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = authStorage.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? '';
    const isRefreshCall = requestUrl.includes(REFRESH_PATH);

    if (status === 401 && originalRequest && !isRefreshCall && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await silentRefresh();

      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    if (status === 401) {
      window.dispatchEvent(new CustomEvent('neyqo:session-expired'));
    }

    return Promise.reject(error);
  },
);

export const authStorage = {
  accessTokenKey: accessTokenStorageKey,
  sessionKey: sessionStorageKey,
  rememberedEmailKey: rememberedEmailStorageKey,
  getAccessToken() {
    return localStorage.getItem(accessTokenStorageKey) ?? sessionStorage.getItem(accessTokenStorageKey);
  },
  getSession() {
    return localStorage.getItem(sessionStorageKey) ?? sessionStorage.getItem(sessionStorageKey);
  },
  isRemembered() {
    return isRememberedSession();
  },
  setSession(token: string, user: unknown, remember = true) {
    const targetStorage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    otherStorage.removeItem(accessTokenStorageKey);
    otherStorage.removeItem(sessionStorageKey);
    targetStorage.setItem(accessTokenStorageKey, token);
    targetStorage.setItem(sessionStorageKey, JSON.stringify(user));
  },
  setAccessToken(token: string, remember = true) {
    const targetStorage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    otherStorage.removeItem(accessTokenStorageKey);
    targetStorage.setItem(accessTokenStorageKey, token);
  },
  setUser(user: unknown, remember = isRememberedSession()) {
    const targetStorage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    otherStorage.removeItem(sessionStorageKey);
    targetStorage.setItem(sessionStorageKey, JSON.stringify(user));
  },
  getRememberedEmail() {
    return localStorage.getItem(rememberedEmailStorageKey) ?? '';
  },
  setRememberedEmail(email: string) {
    localStorage.setItem(rememberedEmailStorageKey, email);
  },
  clearRememberedEmail() {
    localStorage.removeItem(rememberedEmailStorageKey);
  },
  clear() {
    localStorage.removeItem(accessTokenStorageKey);
    localStorage.removeItem(sessionStorageKey);
    sessionStorage.removeItem(accessTokenStorageKey);
    sessionStorage.removeItem(sessionStorageKey);
  },
};
