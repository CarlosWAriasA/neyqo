package com.neyqo.android

import android.app.Application
import com.neyqo.android.data.api.ApiClient
import com.neyqo.android.data.repository.SessionRepository
import com.neyqo.android.data.repository.ThemeRepository

class NeyqoApplication : Application() {

    lateinit var sessionRepository: SessionRepository
        private set
    lateinit var themeRepository: ThemeRepository
        private set

    override fun onCreate() {
        super.onCreate()
        sessionRepository = SessionRepository(this)
        themeRepository = ThemeRepository(this)

        ApiClient.setTokenProvider {
            runBlocking { sessionRepository.getAccessToken() }
        }
    }

    private fun <T> runBlocking(block: suspend () -> T): T {
        return kotlinx.coroutines.runBlocking { block() }
    }
}
