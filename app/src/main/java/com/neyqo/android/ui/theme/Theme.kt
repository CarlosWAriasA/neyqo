package com.neyqo.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = NeyqoPrimary,
    onPrimary = NeyqoSurface,
    primaryContainer = NeyqoPrimarySoft,
    onPrimaryContainer = NeyqoPrimaryStrong,
    secondary = NeyqoInfo,
    onSecondary = NeyqoSurface,
    secondaryContainer = NeyqoMuted,
    onSecondaryContainer = NeyqoText,
    tertiary = NeyqoWarning,
    onTertiary = NeyqoSurface,
    background = NeyqoCanvas,
    onBackground = NeyqoText,
    surface = NeyqoSurface,
    onSurface = NeyqoText,
    surfaceVariant = NeyqoSurfaceVariant,
    onSurfaceVariant = NeyqoSubtle,
    outline = NeyqoBorder,
    error = NeyqoDanger,
    onError = NeyqoSurface,
    errorContainer = Color(0xFFFEE2E2),
    onErrorContainer = NeyqoDanger,
)

private val DarkColorScheme = darkColorScheme(
    primary = NeyqoPrimaryDark,
    onPrimary = NeyqoCanvasDark,
    primaryContainer = NeyqoPrimarySoftDark,
    onPrimaryContainer = NeyqoPrimaryDark,
    secondary = NeyqoInfoDark,
    onSecondary = NeyqoCanvasDark,
    secondaryContainer = NeyqoSurfaceVariantDark,
    onSecondaryContainer = NeyqoTextDark,
    tertiary = NeyqoWarningDark,
    onTertiary = NeyqoCanvasDark,
    background = NeyqoCanvasDark,
    onBackground = NeyqoTextDark,
    surface = NeyqoSurfaceDark,
    onSurface = NeyqoTextDark,
    surfaceVariant = NeyqoSurfaceVariantDark,
    onSurfaceVariant = NeyqoSubtleDark,
    outline = NeyqoBorderDark,
    error = NeyqoDangerDark,
    onError = NeyqoCanvasDark,
    errorContainer = Color(0xFF450A0A),
    onErrorContainer = NeyqoDangerDark,
)

@Composable
fun NeyqoTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? android.app.Activity)?.window
            if (window != null) {
                window.statusBarColor = colorScheme.primary.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = NeyqoTypography,
        content = content,
    )
}
