package com.neyqo.android.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.neyqo.android.ui.accounts.AccountsScreen
import com.neyqo.android.ui.budgets.BudgetsScreen
import com.neyqo.android.ui.categories.CategoriesScreen
import com.neyqo.android.ui.dashboard.DashboardScreen
import com.neyqo.android.ui.reports.ReportsScreen
import com.neyqo.android.ui.scheduled.ScheduledScreen
import com.neyqo.android.ui.settings.SettingsScreen
import com.neyqo.android.ui.sync.SyncScreen
import com.neyqo.android.ui.transactions.TransactionsScreen

@Composable
fun NeyqoNavGraph(
    navController: NavHostController,
    modifier: Modifier = Modifier,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onLogout: () -> Unit,
) {
    NavHost(
        navController = navController,
        startDestination = "dashboard",
        modifier = modifier,
    ) {
        composable("dashboard") { DashboardScreen() }
        composable("accounts") { AccountsScreen() }
        composable("transactions") { TransactionsScreen() }
        composable("budgets") { BudgetsScreen() }
        composable("settings") {
            SettingsScreen(
                isDarkTheme = isDarkTheme,
                onToggleTheme = onToggleTheme,
                onLogout = onLogout,
            )
        }
        composable("categories") { CategoriesScreen() }
        composable("scheduled") { ScheduledScreen() }
        composable("sync") { SyncScreen() }
        composable("reports") { ReportsScreen() }
    }
}

@Composable
fun PlaceholderScreen(
    title: String,
    description: String = "Próximamente",
    icon: ImageVector = Icons.Default.Construction,
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp),
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = description,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}
