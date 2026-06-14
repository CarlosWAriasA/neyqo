package com.neyqo.android.util

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Currency
import java.util.Locale

fun formatCurrency(amount: Double, currency: String = "DOP"): String {
    val locale = Locale("es", "DO")
    val format = NumberFormat.getCurrencyInstance(locale).apply {
        maximumFractionDigits = 0
        minimumFractionDigits = 0
        this.currency = Currency.getInstance(currency)
    }
    return format.format(amount)
}

fun formatDate(isoDate: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val outputFormat = SimpleDateFormat("dd MMM yyyy", Locale("es", "DO"))
        val date = inputFormat.parse(isoDate)
        if (date != null) outputFormat.format(date) else isoDate
    } catch (e: Exception) {
        isoDate
    }
}

fun formatPercent(value: Int): String {
    return "$value%"
}
