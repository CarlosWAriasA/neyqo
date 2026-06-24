import { apiClient, authStorage, clearSilentRefresh, scheduleSilentRefresh } from './client';
import type { AuthSession, AuthSessionDevice, AuthUser } from '../types/auth';
import { queryClient } from '../app/providers/queryClient';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthActionResponse {
  message: string;
  email?: string;
}

function persistSession(session: AuthSession, remember = true, options?: { clearQueryCache?: boolean }) {
  if (options?.clearQueryCache) {
    queryClient.clear();
  }

  authStorage.setSession(session.accessToken, session.user, remember);
  scheduleSilentRefresh(session.accessToken);
  return session.user;
}

export async function login(payload: LoginPayload, options?: { remember?: boolean }) {
  const { data } = await apiClient.post<AuthSession>('/auth/login', payload);
  if (options?.remember ?? true) {
    authStorage.setRememberedEmail(payload.email);
  } else {
    authStorage.clearRememberedEmail();
  }
  return persistSession(data, options?.remember ?? true, { clearQueryCache: true });
}

export async function register(payload: RegisterPayload) {
  const { data } = await apiClient.post<AuthActionResponse>('/auth/register', payload);
  return data;
}

export async function requestPasswordReset(email: string) {
  const { data } = await apiClient.post<AuthActionResponse>('/auth/password/forgot', { email });
  return data;
}

export async function resetPassword(payload: { email: string; code: string; password: string }) {
  const { data } = await apiClient.post<AuthActionResponse>('/auth/password/reset', payload);
  return data;
}

export async function refreshSession() {
  const { data } = await apiClient.post<AuthSession>('/auth/refresh');
  return persistSession(data, authStorage.isRemembered());
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me');
  authStorage.setUser(data.user);
  scheduleSilentRefresh(authStorage.getAccessToken());
  return data.user;
}

export async function initializeUserData() {
  const { data } = await apiClient.post<{ user: AuthUser }>('/auth/initialize-data');
  authStorage.setUser(data.user);
  return data.user;
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    clearSilentRefresh();
    authStorage.clear();
    queryClient.clear();
    localStorage.removeItem('neyqo.oauth-result');
  }
}

export async function getAuthSessions() {
  const { data } = await apiClient.get<{ sessions: AuthSessionDevice[] }>('/auth/sessions');
  return data.sessions;
}

export async function revokeAuthSession(sessionId: string) {
  const { data } = await apiClient.delete<{ revokedCurrentSession: boolean }>(
    `/auth/sessions/${sessionId}`,
  );

  if (data.revokedCurrentSession) {
    clearSilentRefresh();
    authStorage.clear();
    queryClient.clear();
    localStorage.removeItem('neyqo.oauth-result');
  }

  return data;
}

export async function revokeOtherAuthSessions() {
  const { data } = await apiClient.post<{ revokedCount: number }>('/auth/sessions/revoke-others');
  return data;
}

export async function revokeAllAuthSessions() {
  try {
    const { data } = await apiClient.post<{ revokedCount: number }>('/auth/sessions/revoke-all');
    return data;
  } finally {
    clearSilentRefresh();
    authStorage.clear();
    queryClient.clear();
    localStorage.removeItem('neyqo.oauth-result');
  }
}

export async function deleteAccount(payload: {
  confirmationText: string;
  acceptedIrreversibleDeletion: boolean;
}) {
  try {
    await apiClient.delete('/auth/account', { data: payload });
  } finally {
    clearSilentRefresh();
    authStorage.clear();
    queryClient.clear();
    localStorage.removeItem('neyqo.oauth-result');
  }
}

export function restoreStoredUser(): AuthUser | null {
  const rawSession = authStorage.getSession();

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthUser;
  } catch {
    authStorage.clear();
    return null;
  }
}

export async function verifyEmail(payload: { email: string; code: string }) {
  const { data } = await apiClient.post<AuthSession>('/auth/verify-email', payload);
  queryClient.clear();
  authStorage.setSession(data.accessToken, data.user);
  scheduleSilentRefresh(data.accessToken);
  return data.user;
}

export async function resendVerificationCode(email: string) {
  const { data } = await apiClient.post<AuthActionResponse>('/auth/verify-email/resend', { email });
  return data;
}
