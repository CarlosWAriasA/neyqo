package com.neyqo.android.data.model

import com.google.gson.annotations.SerializedName

data class Budget(
    val id: String,
    val name: String,
    val category: String = "",
    @SerializedName("categoryId") val categoryId: String? = null,
    @SerializedName("categoryIds") val categoryIds: List<String> = emptyList(),
    val categories: List<BudgetCategory> = emptyList(),
    @SerializedName("maxAmount") val maxAmount: Double = 0.0,
    val month: Int = 0,
    val year: Int = 0,
    val period: String = "monthly",
    @SerializedName("startDate") val startDate: String = "",
    @SerializedName("resetDayOfMonth") val resetDayOfMonth: Int? = null,
    @SerializedName("resetDayOfWeek") val resetDayOfWeek: Int? = null,
    @SerializedName("periodLabel") val periodLabel: String = "",
    @SerializedName("periodStart") val periodStart: String = "",
    @SerializedName("periodEnd") val periodEnd: String = "",
    @SerializedName("daysRemaining") val daysRemaining: Int = 0,
    @SerializedName("spentAmount") val spentAmount: Double = 0.0,
    @SerializedName("percentageUsed") val percentageUsed: Int = 0,
    @SerializedName("remainingAmount") val remainingAmount: Double = 0.0,
    val status: String = "normal",
    @SerializedName("recordStatus") val recordStatus: String = "active",
    val description: String? = null,
    @SerializedName("createdAt") val createdAt: String = "",
    @SerializedName("updatedAt") val updatedAt: String = "",
)

data class BudgetCategory(
    val id: String,
    val name: String,
    val icon: String = "",
)

data class CreateBudgetPayload(
    val name: String,
    @SerializedName("maxAmount") val maxAmount: Double,
    val period: String,
    @SerializedName("categoryId") val categoryId: String? = null,
    @SerializedName("categoryIds") val categoryIds: List<String>? = null,
    val month: Int? = null,
    val year: Int? = null,
    @SerializedName("startDate") val startDate: String? = null,
    @SerializedName("resetDayOfMonth") val resetDayOfMonth: Int? = null,
    @SerializedName("resetDayOfWeek") val resetDayOfWeek: Int? = null,
    val description: String? = null,
)

data class BudgetsResponse(val budgets: List<Budget>)
data class BudgetResponse(val budget: Budget)

object BudgetStatus {
    const val NORMAL = "normal"
    const val MODERATE_WARNING = "moderate-warning"
    const val IMPORTANT_WARNING = "important-warning"
    const val EXCEEDED = "exceeded"
}
