package com.neyqo.android.data.api

import android.content.Context
import com.neyqo.android.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    private var tokenProvider: (() -> String?)? = null

    fun setTokenProvider(provider: () -> String?) {
        tokenProvider = provider
    }

    private val authInterceptor = Interceptor { chain ->
        val token = tokenProvider?.invoke()
        val request = if (token != null) {
            chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }
        chain.proceed(request)
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL + "/")
        .client(httpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val financial: FinancialApi = retrofit.create(FinancialApi::class.java)
    val auth: AuthApi = retrofit.create(AuthApi::class.java)
}
