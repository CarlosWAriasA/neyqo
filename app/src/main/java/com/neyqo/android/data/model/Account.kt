package com.neyqo.android.data.model

import com.google.gson.annotations.SerializedName

data class Account(
    val id: String,
    val name: String,
    val type: String,
    val currency: String = "DOP",
    @SerializedName("initialBalance") val initialBalance: Double = 0.0,
    @SerializedName("currentBalance") val currentBalance: Double = 0.0,
    val description: String? = null,
    val status: String = "active",
    @SerializedName("createdAt") val createdAt: String = "",
)

data class CreateAccountPayload(
    val name: String,
    val type: String,
    val currency: String,
    @SerializedName("initialBalance") val initialBalance: Double,
    val description: String? = null,
)

data class AccountsResponse(val accounts: List<Account>)
data class AccountResponse(val account: Account)

object AccountType {
    const val CASH = "cash"
    const val BANK = "bank"
    const val DEBIT_CARD = "debit_card"
    const val CREDIT_CARD = "credit_card"
    const val WALLET = "wallet"
    const val OTHER = "other"

    val labels = mapOf(
        CASH to "Efectivo",
        BANK to "Cuenta bancaria",
        DEBIT_CARD to "Tarjeta de débito",
        CREDIT_CARD to "Tarjeta de crédito",
        WALLET to "Billetera digital",
        OTHER to "Otra cuenta",
    )
}
