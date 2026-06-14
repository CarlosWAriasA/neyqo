package com.neyqo.android.data.model

import com.google.gson.annotations.SerializedName

data class Transaction(
    val id: String,
    val type: String,
    val amount: Double,
    val currency: String = "DOP",
    @SerializedName("sourceAccountId") val sourceAccountId: String? = null,
    @SerializedName("sourceAccount") val sourceAccount: String = "",
    @SerializedName("destinationAccountId") val destinationAccountId: String? = null,
    @SerializedName("destinationAccount") val destinationAccount: String? = null,
    @SerializedName("categoryId") val categoryId: String? = null,
    val category: String? = null,
    @SerializedName("categoryIcon") val categoryIcon: String? = null,
    val description: String = "",
    val date: String = "",
    val note: String? = null,
    val status: String = "completed",
    @SerializedName("createdAt") val createdAt: String = "",
    @SerializedName("updatedAt") val updatedAt: String = "",
)

data class CreateTransactionPayload(
    val type: String,
    val amount: Double,
    @SerializedName("sourceAccountId") val sourceAccountId: String,
    @SerializedName("destinationAccountId") val destinationAccountId: String? = null,
    @SerializedName("categoryId") val categoryId: String? = null,
    val description: String,
    val date: String,
    val status: String = "completed",
    val note: String? = null,
)

data class TransactionsResponse(val transactions: List<Transaction>)
data class TransactionResponse(val transaction: Transaction)

object TransactionType {
    const val INCOME = "income"
    const val EXPENSE = "expense"
    const val TRANSFER = "transfer"
}
