import type { Repository } from 'typeorm';
import { UserPreference } from '../../entities/user-preference.entity';
import type { UpdateUserPreferencesInput, UserPreferencesInput } from './preferences.schemas';

export interface UserPreferencesResponse extends UserPreferencesInput {
  updatedAt: string;
}

const defaultPreferences: UserPreferencesInput = {
  primaryCurrency: 'DOP',
  dateFormat: 'dd-mm-yyyy',
  weekStartsOn: 'monday',
  theme: 'system',
  hideBalances: false,
  budgetAlerts: true,
};

export class PreferencesService {
  constructor(private readonly preferencesRepository: Repository<UserPreference>) {}

  async get(userId: string): Promise<UserPreferencesResponse> {
    const preferences = await this.findOrCreate(userId);
    return this.toResponse(preferences);
  }

  async createInitialPreferences(userId: string): Promise<void> {
    await this.findOrCreate(userId);
  }

  async update(
    userId: string,
    payload: UpdateUserPreferencesInput,
  ): Promise<UserPreferencesResponse> {
    const preferences = await this.findOrCreate(userId);

    Object.assign(preferences, payload);

    const savedPreferences = await this.preferencesRepository.save(preferences);
    return this.toResponse(savedPreferences);
  }

  private async findOrCreate(userId: string): Promise<UserPreference> {
    const existingPreferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (existingPreferences) {
      return existingPreferences;
    }

    await this.preferencesRepository
      .createQueryBuilder()
      .insert()
      .into(UserPreference)
      .values({
        userId,
        ...defaultPreferences,
      })
      .orIgnore()
      .execute();

    const preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      throw new Error('No fue posible preparar las preferencias del usuario.');
    }

    return preferences;
  }

  private toResponse(preferences: UserPreference): UserPreferencesResponse {
    return {
      primaryCurrency: preferences.primaryCurrency,
      dateFormat: preferences.dateFormat,
      weekStartsOn: preferences.weekStartsOn,
      theme: preferences.theme,
      hideBalances: preferences.hideBalances,
      budgetAlerts: preferences.budgetAlerts,
      updatedAt: preferences.updatedAt.toISOString(),
    };
  }
}
