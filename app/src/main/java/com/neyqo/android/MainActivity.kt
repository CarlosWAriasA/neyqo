package com.neyqo.android

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.google.gson.Gson
import com.neyqo.android.navigation.BottomNavBar
import com.neyqo.android.navigation.NeyqoNavGraph
import com.neyqo.android.ui.auth.AuthEntryMode
import com.neyqo.android.ui.auth.AuthScreen
import com.neyqo.android.ui.landing.LandingScreen
import com.neyqo.android.ui.theme.NeyqoTheme
import com.neyqo.android.data.model.AuthSession
import com.neyqo.android.data.api.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    private val gson = Gson()
    private var oauthSession by mutableStateOf<AuthSession?>(null)
    private var oauthError by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        handleOAuthIntent(intent)

        val app = application as NeyqoApplication

        setContent {
            val systemDarkTheme = isSystemInDarkTheme()
            var isDarkTheme by rememberSaveable { mutableStateOf(systemDarkTheme) }

            NeyqoTheme(darkTheme = isDarkTheme) {
                val navController = rememberNavController()
                val coroutineScope = rememberCoroutineScope()
                var isAuthenticated by remember { mutableStateOf(false) }
                var isLoading by remember { mutableStateOf(true) }
                var authMode by remember { mutableStateOf<AuthEntryMode?>(null) }

                LaunchedEffect(oauthSession) {
                    val session = oauthSession ?: return@LaunchedEffect
                    withContext(Dispatchers.IO) {
                        app.sessionRepository.saveSession(session.accessToken, session.user)
                    }
                    oauthSession = null
                    oauthError = null
                    authMode = null
                    isAuthenticated = true
                }

                LaunchedEffect(oauthError) {
                    if (oauthError != null) {
                        authMode = AuthEntryMode.Login
                    }
                }

                LaunchedEffect(Unit) {
                    withContext(Dispatchers.IO) {
                        isAuthenticated = app.sessionRepository.isAuthenticated()
                        app.themeRepository.getDarkThemePreference()?.let { storedTheme ->
                            isDarkTheme = storedTheme
                        }
                    }
                    isLoading = false
                }

                val toggleTheme: () -> Unit = {
                    val nextTheme = !isDarkTheme
                    isDarkTheme = nextTheme
                    coroutineScope.launch {
                        withContext(Dispatchers.IO) {
                            app.themeRepository.saveDarkThemePreference(nextTheme)
                        }
                    }
                }

                if (isLoading) {
                    Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                        androidx.compose.foundation.layout.Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding),
                            contentAlignment = androidx.compose.ui.Alignment.Center,
                        ) {
                            androidx.compose.material3.CircularProgressIndicator()
                        }
                    }
                } else if (!isAuthenticated) {
                    if (authMode == null) {
                        LandingScreen(
                            onLoginClick = { authMode = AuthEntryMode.Login },
                            onRegisterClick = { authMode = AuthEntryMode.Register },
                            isDarkTheme = isDarkTheme,
                            onToggleTheme = toggleTheme,
                        )
                    } else {
                        AuthScreen(
                            initialMode = authMode ?: AuthEntryMode.Login,
                            onBack = { authMode = null },
                            onLoginSuccess = { isAuthenticated = true },
                            oauthError = oauthError,
                            onOAuthErrorShown = { oauthError = null },
                            isDarkTheme = isDarkTheme,
                            onToggleTheme = toggleTheme,
                        )
                    }
                } else {
                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        bottomBar = { BottomNavBar(navController) },
                    ) { innerPadding ->
                        NeyqoNavGraph(
                            navController = navController,
                            modifier = Modifier.padding(innerPadding),
                            isDarkTheme = isDarkTheme,
                            onToggleTheme = toggleTheme,
                            onLogout = {
                                coroutineScope.launch {
                                    withContext(Dispatchers.IO) {
                                        runCatching { ApiClient.auth.logout() }
                                        app.sessionRepository.clearSession()
                                    }
                                    authMode = null
                                    isAuthenticated = false
                                }
                            },
                        )
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleOAuthIntent(intent)
    }

    private fun handleOAuthIntent(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme != "neyqo" || data.host != "auth" || data.path != "/oauth/callback") {
            return
        }

        val error = data.getQueryParameter("error")
        if (error != null) {
            oauthError = mapOAuthError(error)
            return
        }

        val encodedSession = data.getQueryParameter("session")
        if (encodedSession.isNullOrBlank()) {
            oauthError = "No pudimos completar la autenticación con el proveedor."
            return
        }

        oauthSession = runCatching {
            val decoded = Base64.decode(encodedSession, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
            gson.fromJson(String(decoded, Charsets.UTF_8), AuthSession::class.java)
        }.getOrElse {
            oauthError = "No pudimos leer la sesión del proveedor."
            null
        }
    }

    private fun mapOAuthError(error: String): String {
        return when (error) {
            "account_exists" -> "Ya existe una cuenta con ese correo. Inicia sesión con tu contraseña."
            "access_denied" -> "La autenticación fue cancelada."
            else -> "No pudimos completar la autenticación con el proveedor."
        }
    }
}
