import type { UserPreferences } from '../config/userPreferences';
import { apiClient } from './client';

export interface UserPreferencesResponse extends UserPreferences {
  updatedAt: string;
}

export async function getUserPreferences() {
  const response = await apiClient.get<{ preferences: UserPreferencesResponse }>('/preferences');
  return response.data.preferences;
}

export async function updateUserPreferences(payload: UserPreferences) {
  const response = await apiClient.patch<{ preferences: UserPreferencesResponse }>(
    '/preferences',
    payload,
  );
  return response.data.preferences;
}
