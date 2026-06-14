package com.neyqo.android.data.model

data class UserPreferences(
    val primaryCurrency: String = "DOP",
    val dateFormat: String = "dd-mm-yyyy",
    val weekStartsOn: String = "monday",
    val theme: String = "system",
    val hideBalances: Boolean = false,
    val budgetAlerts: Boolean = true,
)

data class UserPreferencesResponse(val preferences: UserPreferences)
