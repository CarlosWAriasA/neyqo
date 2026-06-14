package com.neyqo.android.ui.auth

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.neyqo.android.BuildConfig
import com.neyqo.android.NeyqoApplication
import com.neyqo.android.data.api.ApiClient
import com.neyqo.android.data.api.LoginPayload
import com.neyqo.android.data.api.RegisterPayload
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class AuthEntryMode {
    Login,
    Register,
}

@Composable
fun AuthScreen(
    initialMode: AuthEntryMode,
    onBack: () -> Unit,
    onLoginSuccess: () -> Unit,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    oauthError: String? = null,
    onOAuthErrorShown: () -> Unit = {},
) {
    val context = LocalContext.current
    val app = context.applicationContext as NeyqoApplication
    val coroutineScope = rememberCoroutineScope()

    var mode by remember(initialMode) { mutableStateOf(initialMode) }
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var isSuccess by remember { mutableStateOf(false) }

    val isRegister = mode == AuthEntryMode.Register

    LaunchedEffect(oauthError) {
        if (oauthError != null) {
            isSuccess = false
            message = oauthError
            onOAuthErrorShown()
        }
    }

    Scaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Neyqo",
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                IconButton(onClick = onToggleTheme) {
                    Icon(
                        imageVector = if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                        contentDescription = if (isDarkTheme) "Cambiar a tema claro" else "Cambiar a tema oscuro",
                    )
                }
                IconButton(onClick = onBack) {
                    Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            ) {
                Column(
                    modifier = Modifier.padding(22.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Text(
                        text = if (isRegister) "Crear cuenta" else "Iniciar sesión",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Text(
                        text = if (isRegister) {
                            "Empieza con correo y contraseña. La sincronización de correos se configura aparte."
                        } else {
                            "Accede para continuar organizando tus finanzas."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    if (isRegister) {
                        OutlinedTextField(
                            value = fullName,
                            onValueChange = {
                                fullName = it
                                message = null
                            },
                            label = { Text("Nombre completo") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                    }

                    OutlinedTextField(
                        value = email,
                        onValueChange = {
                            email = it
                            message = null
                        },
                        label = { Text("Correo electrónico") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )

                    OutlinedTextField(
                        value = password,
                        onValueChange = {
                            password = it
                            message = null
                        },
                        label = { Text("Contraseña") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )

                    if (isRegister) {
                        OutlinedTextField(
                            value = confirmPassword,
                            onValueChange = {
                                confirmPassword = it
                                message = null
                            },
                            label = { Text("Confirmar contraseña") },
                            visualTransformation = PasswordVisualTransformation(),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                    }

                    message?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = if (isSuccess) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                        )
                    }

                    Button(
                        onClick = {
                            val validationMessage = validateAuthForm(
                                isRegister = isRegister,
                                fullName = fullName,
                                email = email,
                                password = password,
                                confirmPassword = confirmPassword,
                            )
                            if (validationMessage != null) {
                                isSuccess = false
                                message = validationMessage
                                return@Button
                            }

                            isLoading = true
                            message = null
                            coroutineScope.launch {
                                try {
                                    if (isRegister) {
                                        val response = withContext(Dispatchers.IO) {
                                            ApiClient.auth.register(
                                                RegisterPayload(
                                                    fullName = fullName.trim(),
                                                    email = email.trim(),
                                                    password = password,
                                                ),
                                            )
                                        }
                                        isSuccess = response.isSuccessful
                                        message = if (response.isSuccessful) {
                                            response.body()?.message ?: "Cuenta creada. Revisa tu correo para verificarla."
                                        } else {
                                            "No pudimos crear la cuenta con esos datos."
                                        }
                                    } else {
                                        val response = withContext(Dispatchers.IO) {
                                            ApiClient.auth.login(LoginPayload(email.trim(), password))
                                        }
                                        if (response.isSuccessful) {
                                            val session = response.body()
                                            if (session != null) {
                                                withContext(Dispatchers.IO) {
                                                    app.sessionRepository.saveSession(session.accessToken, session.user)
                                                }
                                                onLoginSuccess()
                                            } else {
                                                isSuccess = false
                                                message = "Respuesta inesperada del servidor."
                                            }
                                        } else {
                                            isSuccess = false
                                            message = "Correo o contraseña incorrectos."
                                        }
                                    }
                                } catch (_: Exception) {
                                    isSuccess = false
                                    message = "No pudimos conectar con el servidor."
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        enabled = !isLoading,
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary,
                            )
                        } else {
                            Text(if (isRegister) "Crear cuenta" else "Iniciar sesión")
                        }
                    }

                    SocialAuthButtons(
                        googleLabel = if (isRegister) "Registrarme con Google" else "Continuar con Google",
                        microsoftLabel = if (isRegister) "Registrarme con Microsoft" else "Continuar con Microsoft",
                        enabled = !isLoading,
                        onProviderClick = { provider ->
                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(buildOAuthStartUrl(provider))))
                        },
                    )

                    TextButton(
                        onClick = {
                            mode = if (isRegister) AuthEntryMode.Login else AuthEntryMode.Register
                            message = null
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (isRegister) "Ya tienes cuenta? Iniciar sesión" else "No tienes cuenta? Crear una")
                    }

                    if (!isRegister) {
                        OutlinedButton(
                            onClick = {
                                isSuccess = false
                                message = "Recuperación de contraseña pendiente para el próximo paso."
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("Olvidé mi contraseña")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SocialAuthButtons(
    googleLabel: String,
    microsoftLabel: String,
    enabled: Boolean,
    onProviderClick: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            HorizontalDivider(modifier = Modifier.weight(1f))
            Text(
                text = "  o continúa con  ",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            HorizontalDivider(modifier = Modifier.weight(1f))
        }
        OutlinedButton(
            onClick = { onProviderClick("google") },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            enabled = enabled,
        ) {
            GoogleIcon()
            Spacer(modifier = Modifier.width(10.dp))
            Text(googleLabel)
        }
        OutlinedButton(
            onClick = { onProviderClick("microsoft") },
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            enabled = enabled,
        ) {
            MicrosoftIcon()
            Spacer(modifier = Modifier.width(10.dp))
            Text(microsoftLabel)
        }
    }
}

@Composable
private fun GoogleIcon() {
    Box(
        modifier = Modifier
            .size(22.dp)
            .clip(CircleShape)
            .background(Color.White),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "G",
            color = Color(0xFF4285F4),
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun MicrosoftIcon() {
    Column(
        modifier = Modifier.size(18.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            MicrosoftSquare(Color(0xFFF25022))
            MicrosoftSquare(Color(0xFF7FBA00))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            MicrosoftSquare(Color(0xFF00A4EF))
            MicrosoftSquare(Color(0xFFFFB900))
        }
    }
}

@Composable
private fun MicrosoftSquare(color: Color) {
    Box(
        modifier = Modifier
            .size(8.dp)
            .background(color, RoundedCornerShape(1.dp)),
    )
}

private fun buildOAuthStartUrl(provider: String): String {
    val encodedReturnTo = URLEncoder.encode(BuildConfig.OAUTH_CALLBACK_URL, StandardCharsets.UTF_8.name())
    return "${BuildConfig.API_BASE_URL}/auth/oauth/$provider/start?returnTo=$encodedReturnTo"
}

private fun validateAuthForm(
    isRegister: Boolean,
    fullName: String,
    email: String,
    password: String,
    confirmPassword: String,
): String? {
    if (isRegister && fullName.trim().length < 4) {
        return "Escribe tu nombre completo."
    }
    if (email.isBlank() || !email.contains("@")) {
        return "Escribe un correo válido."
    }
    if (password.length < 6) {
        return "Usa al menos 6 caracteres."
    }
    if (isRegister && password != confirmPassword) {
        return "Las contraseñas no coinciden."
    }
    return null
}
