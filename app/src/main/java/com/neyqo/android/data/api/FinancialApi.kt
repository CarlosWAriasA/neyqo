package com.neyqo.android.data.api

import com.neyqo.android.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface FinancialApi {

    // Accounts
    @GET("accounts")
    suspend fun getAccounts(): Response<AccountsResponse>

    @POST("accounts")
    suspend fun createAccount(@Body payload: CreateAccountPayload): Response<AccountResponse>

    @PATCH("accounts/{id}")
    suspend fun updateAccount(
        @Path("id") id: String,
        @Body payload: CreateAccountPayload,
    ): Response<AccountResponse>

    @PATCH("accounts/{id}/deactivate")
    suspend fun deactivateAccount(@Path("id") id: String): Response<AccountResponse>

    @PATCH("accounts/{id}/reactivate")
    suspend fun reactivateAccount(@Path("id") id: String): Response<AccountResponse>

    // Transactions
    @GET("transactions")
    suspend fun getTransactions(): Response<TransactionsResponse>

    @POST("transactions")
    suspend fun createTransaction(@Body payload: CreateTransactionPayload): Response<TransactionResponse>

    @PATCH("transactions/{id}")
    suspend fun updateTransaction(
        @Path("id") id: String,
        @Body payload: CreateTransactionPayload,
    ): Response<TransactionResponse>

    @DELETE("transactions/{id}")
    suspend fun deleteTransaction(@Path("id") id: String): Response<Unit>

    // Categories
    @GET("categories")
    suspend fun getCategories(): Response<CategoriesResponse>

    @POST("categories")
    suspend fun createCategory(@Body payload: CreateCategoryPayload): Response<CategoryResponse>

    @PATCH("categories/{id}")
    suspend fun updateCategory(
        @Path("id") id: String,
        @Body payload: CreateCategoryPayload,
    ): Response<CategoryResponse>

    @PATCH("categories/{id}/deactivate")
    suspend fun deactivateCategory(@Path("id") id: String): Response<CategoryResponse>

    @PATCH("categories/{id}/reactivate")
    suspend fun reactivateCategory(@Path("id") id: String): Response<CategoryResponse>

    // Budgets
    @GET("budgets")
    suspend fun getBudgets(): Response<BudgetsResponse>

    @POST("budgets")
    suspend fun createBudget(@Body payload: CreateBudgetPayload): Response<BudgetResponse>

    @PATCH("budgets/{id}")
    suspend fun updateBudget(
        @Path("id") id: String,
        @Body payload: CreateBudgetPayload,
    ): Response<BudgetResponse>

    @PATCH("budgets/{id}/deactivate")
    suspend fun deactivateBudget(@Path("id") id: String): Response<BudgetResponse>

    @PATCH("budgets/{id}/reactivate")
    suspend fun reactivateBudget(@Path("id") id: String): Response<BudgetResponse>

    // Scheduled Movements
    @GET("scheduled-transactions")
    suspend fun getScheduledMovements(): Response<ScheduledMovementsResponse>

    @GET("scheduled-transactions/upcoming")
    suspend fun getUpcomingScheduledMovements(): Response<UpcomingResponse>

    @GET("scheduled-transactions/summary")
    suspend fun getScheduledSummary(): Response<ScheduledSummaryResponse>

    @POST("scheduled-transactions")
    suspend fun createScheduledMovement(
        @Body payload: CreateScheduledMovementPayload,
    ): Response<ScheduledMovement>

    @PATCH("scheduled-transactions/{id}/pause")
    suspend fun pauseScheduledMovement(@Path("id") id: String): Response<ScheduledMovement>

    @PATCH("scheduled-transactions/{id}/resume")
    suspend fun resumeScheduledMovement(@Path("id") id: String): Response<ScheduledMovement>

    @PATCH("scheduled-transactions/{id}/deactivate")
    suspend fun deactivateScheduledMovement(@Path("id") id: String): Response<ScheduledMovement>

    // Preferences
    @GET("preferences")
    suspend fun getPreferences(): Response<UserPreferencesResponse>

    @PATCH("preferences")
    suspend fun updatePreferences(
        @Body payload: UserPreferences,
    ): Response<UserPreferencesResponse>
}
