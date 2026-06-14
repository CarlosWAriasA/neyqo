package com.neyqo.android.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.themeDataStore: DataStore<Preferences> by preferencesDataStore(name = "neyqo_theme")

class ThemeRepository(private val context: Context) {
    companion object {
        private val DARK_THEME_KEY = booleanPreferencesKey("dark_theme")
    }

    suspend fun getDarkThemePreference(): Boolean? {
        return context.themeDataStore.data.map { prefs ->
            prefs[DARK_THEME_KEY]
        }.first()
    }

    suspend fun saveDarkThemePreference(isDarkTheme: Boolean) {
        context.themeDataStore.edit { prefs ->
            prefs[DARK_THEME_KEY] = isDarkTheme
        }
    }
}
