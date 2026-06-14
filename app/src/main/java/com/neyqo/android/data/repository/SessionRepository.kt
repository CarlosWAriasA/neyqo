package com.neyqo.android.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import com.neyqo.android.data.model.AuthUser
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "neyqo_session")

class SessionRepository(private val context: Context) {

    private val gson = Gson()

    companion object {
        private val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
        private val USER_KEY = stringPreferencesKey("user")
    }

    suspend fun saveSession(accessToken: String, user: AuthUser) {
        context.dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN_KEY] = accessToken
            prefs[USER_KEY] = gson.toJson(user)
        }
    }

    suspend fun getAccessToken(): String? {
        return context.dataStore.data.map { prefs ->
            prefs[ACCESS_TOKEN_KEY]
        }.first()
    }

    suspend fun getUser(): AuthUser? {
        return context.dataStore.data.map { prefs ->
            prefs[USER_KEY]?.let { json ->
                gson.fromJson(json, AuthUser::class.java)
            }
        }.first()
    }

    suspend fun isAuthenticated(): Boolean {
        return getAccessToken() != null
    }

    suspend fun clearSession() {
        context.dataStore.edit { prefs ->
            prefs.remove(ACCESS_TOKEN_KEY)
            prefs.remove(USER_KEY)
        }
    }
}
