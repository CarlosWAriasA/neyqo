package com.neyqo.android.data.model

import com.google.gson.annotations.SerializedName

data class ScheduledMovement(
    val id: String,
    val type: String,
    val name: String,
    val description: String? = null,
    val amount: Double,
    @SerializedName("sourceAccountId") val sourceAccountId: String? = null,
    val account: String = "",
    @SerializedName("categoryId") val categoryId: String? = null,
    val category: String = "",
    @SerializedName("categoryIcon") val categoryIcon: String? = null,
    val frequency: String = "monthly",
    @SerializedName("dayOfWeek") val dayOfWeek: Int? = null,
    @SerializedName("daysOfMonth") val daysOfMonth: List<Int>? = null,
    @SerializedName("monthOfYear") val monthOfYear: Int? = null,
    @SerializedName("nextExecutionDate") val nextExecutionDate: String? = null,
    @SerializedName("nextRunAt") val nextRunAt: String? = null,
    @SerializedName("startDate") val startDate: String = "",
    @SerializedName("startsAt") val startsAt: String? = null,
    @SerializedName("endDate") val endDate: String? = null,
    @SerializedName("endsAt") val endsAt: String? = null,
    val status: String = "active",
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null,
)

data class UpcomingScheduledMovement(
    val id: String,
    @SerializedName("scheduledTransactionId") val scheduledTransactionId: String,
    val type: String,
    val name: String,
    val amount: Double,
    val category: String,
    val account: String,
    val date: String,
)

data class ScheduledSummary(
    @SerializedName("expenseTotal") val expenseTotal: Double,
    @SerializedName("incomeTotal") val incomeTotal: Double,
    val balance: Double,
)

data class CreateScheduledMovementPayload(
    val type: String,
    val name: String,
    val description: String? = null,
    val amount: Double,
    @SerializedName("sourceAccountId") val sourceAccountId: String,
    @SerializedName("categoryId") val categoryId: String,
    val frequency: String,
    @SerializedName("dayOfWeek") val dayOfWeek: Int? = null,
    @SerializedName("daysOfMonth") val daysOfMonth: List<Int>? = null,
    @SerializedName("monthOfYear") val monthOfYear: Int? = null,
    @SerializedName("startDate") val startDate: String,
    @SerializedName("endDate") val endDate: String? = null,
)

data class ScheduledMovementsResponse(val scheduledTransactions: List<ScheduledMovement>)
data class UpcomingResponse(val upcoming: List<UpcomingScheduledMovement>)
data class ScheduledSummaryResponse(val summary: ScheduledSummary)
