package com.neyqo.android.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onLogout: () -> Unit,
) {
    var selectedCurrency by remember { mutableStateOf("DOP") }
    var hideBalances by remember { mutableStateOf(false) }
    var budgetAlerts by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Configuración") })
        },
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Profile section
            Card(
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        text = "Perfil",
                        style = MaterialTheme.typography.titleMedium,
                    )
                    HorizontalDivider()
                    Text(
                        text = "Tu perfil se muestra aquí.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            // Preferences section
            Card(
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(
                        text = "Preferencias",
                        style = MaterialTheme.typography.titleMedium,
                    )
                    HorizontalDivider()

                    Text(
                        text = "Moneda principal: $selectedCurrency",
                        style = MaterialTheme.typography.bodyMedium,
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(
                            text = "Ocultar balances",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        Switch(
                            checked = hideBalances,
                            onCheckedChange = { hideBalances = it },
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(
                            text = "Alertas de presupuesto",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        Switch(
                            checked = budgetAlerts,
                            onCheckedChange = { budgetAlerts = it },
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(
                            text = "Modo oscuro",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        Switch(
                            checked = isDarkTheme,
                            onCheckedChange = { onToggleTheme() },
                        )
                    }
                }
            }

            // Session section
            Card(
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(
                        text = "Sesión",
                        style = MaterialTheme.typography.titleMedium,
                    )
                    HorizontalDivider()
                    TextButton(
                        onClick = onLogout,
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.Logout,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Cerrar sesión")
                    }
                }
            }
        }
    }
}
