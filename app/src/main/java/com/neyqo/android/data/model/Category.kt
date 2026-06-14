package com.neyqo.android.data.model

import com.google.gson.annotations.SerializedName

data class Category(
    val id: String,
    val name: String,
    val type: String,
    val icon: String = "circle-ellipsis",
    val description: String? = null,
    @SerializedName("isDefault") val isDefault: Boolean = false,
    val priority: Int = 0,
    val status: String = "active",
    @SerializedName("createdAt") val createdAt: String = "",
    @SerializedName("updatedAt") val updatedAt: String? = null,
)

data class CreateCategoryPayload(
    val name: String,
    val type: String,
    val icon: String,
    val priority: Int,
    val description: String? = null,
)

data class CategoriesResponse(val categories: List<Category>)
data class CategoryResponse(val category: Category)

object CategoryType {
    const val INCOME = "income"
    const val EXPENSE = "expense"
}
