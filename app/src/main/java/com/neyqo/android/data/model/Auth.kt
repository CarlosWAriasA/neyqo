package com.neyqo.android.data.model

data class AuthUser(
    val id: String,
    val fullName: String,
    val email: String,
    val providers: List<String> = emptyList(),
    val emailVerified: Boolean = false,
    val hasPasswordAccess: Boolean = false,
    val hasGoogleAccess: Boolean = false,
    val avatarUrl: String? = null,
    val createdAt: String = "",
)

data class AuthSession(
    val user: AuthUser,
    val accessToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: String = "",
)
