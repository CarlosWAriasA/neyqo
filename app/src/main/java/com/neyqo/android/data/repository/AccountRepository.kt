package com.neyqo.android.data.repository

import com.neyqo.android.data.api.ApiClient
import com.neyqo.android.data.model.Account
import com.neyqo.android.data.model.CreateAccountPayload

class AccountRepository {

    private val api = ApiClient.financial

    suspend fun getAccounts(): Result<List<Account>> {
        return try {
            val response = api.getAccounts()
            if (response.isSuccessful) {
                Result.success(response.body()?.accounts ?: emptyList())
            } else {
                Result.failure(Exception("No pudimos cargar tus cuentas."))
            }
        } catch (e: Exception) {
            Result.failure(Exception("No pudimos conectar con el servidor."))
        }
    }

    suspend fun createAccount(payload: CreateAccountPayload): Result<Account> {
        return try {
            val response = api.createAccount(payload)
            if (response.isSuccessful) {
                val account = response.body()?.account
                if (account != null) {
                    Result.success(account)
                } else {
                    Result.failure(Exception("Respuesta inesperada del servidor."))
                }
            } else {
                Result.failure(Exception("No pudimos crear la cuenta."))
            }
        } catch (e: Exception) {
            Result.failure(Exception("No pudimos conectar con el servidor."))
        }
    }

    suspend fun updateAccount(id: String, payload: CreateAccountPayload): Result<Account> {
        return try {
            val response = api.updateAccount(id, payload)
            if (response.isSuccessful) {
                val account = response.body()?.account
                if (account != null) {
                    Result.success(account)
                } else {
                    Result.failure(Exception("Respuesta inesperada del servidor."))
                }
            } else {
                Result.failure(Exception("No pudimos actualizar la cuenta."))
            }
        } catch (e: Exception) {
            Result.failure(Exception("No pudimos conectar con el servidor."))
        }
    }

    suspend fun deactivateAccount(id: String): Result<Account> {
        return try {
            val response = api.deactivateAccount(id)
            if (response.isSuccessful) {
                val account = response.body()?.account
                if (account != null) {
                    Result.success(account)
                } else {
                    Result.failure(Exception("Respuesta inesperada del servidor."))
                }
            } else {
                Result.failure(Exception("No pudimos desactivar la cuenta."))
            }
        } catch (e: Exception) {
            Result.failure(Exception("No pudimos conectar con el servidor."))
        }
    }

    suspend fun reactivateAccount(id: String): Result<Account> {
        return try {
            val response = api.reactivateAccount(id)
            if (response.isSuccessful) {
                val account = response.body()?.account
                if (account != null) {
                    Result.success(account)
                } else {
                    Result.failure(Exception("Respuesta inesperada del servidor."))
                }
            } else {
                Result.failure(Exception("No pudimos reactivar la cuenta."))
            }
        } catch (e: Exception) {
            Result.failure(Exception("No pudimos conectar con el servidor."))
        }
    }
}
