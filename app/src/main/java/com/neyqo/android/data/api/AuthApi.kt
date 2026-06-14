package com.neyqo.android.data.api

import com.neyqo.android.data.model.AuthSession
import com.neyqo.android.data.model.AuthUser
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

data class LoginPayload(val email: String, val password: String)
data class RegisterPayload(val fullName: String, val email: String, val password: String)
data class AuthActionResponse(val message: String, val email: String? = null)

interface AuthApi {

    @POST("auth/login")
    suspend fun login(@Body payload: LoginPayload): Response<AuthSession>

    @POST("auth/register")
    suspend fun register(@Body payload: RegisterPayload): Response<AuthActionResponse>

    @POST("auth/refresh")
    suspend fun refresh(): Response<AuthSession>

    @POST("auth/logout")
    suspend fun logout(): Response<Unit>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<Map<String, AuthUser>>
}
