# Neyqo Android Context

This is the native Android client for Neyqo.

## Scope

- Work only inside `neyqo/app` for Android UI and mobile app code.
- Keep authentication separate from email sync consent.
- Do not request Gmail or Outlook mail-reading permissions during login, registration, recovery, or onboarding.

## Stack

- Gradle Android application module.
- Kotlin.
- Jetpack Compose.
- Material 3.
- Retrofit for backend API calls.
- DataStore for local session storage.

## Simple Architecture

- `MainActivity` owns only top-level screen switching.
- `NeyqoApplication` wires app-level repositories and API token access.
- `data/api` contains Retrofit API contracts.
- `data/model` contains DTOs and domain-facing models.
- `data/repository` contains persistence/session/theme repositories.
- `ui/landing` contains the full-screen unauthenticated carousel landing page.
- `ui/auth` contains login and registration UI state, validation, and backend calls.
- `navigation` contains authenticated app navigation.

## Current Screens

- Full-screen landing screen with a carousel.
- Login form connected to `POST /api/auth/login`.
- Registration form connected to `POST /api/auth/register`.
- Authenticated finance screens for dashboard, accounts, transactions, categories, budgets, scheduled movements, sync, reports, and settings.

## Commands

- Build debug APK from repo root: `gradlew.bat :app:assembleDebug`
- Build through npm from repo root: `npm run android:build`

## Backend Integration

- Debug builds use `BuildConfig.API_BASE_URL`, currently `http://10.0.2.2:3000/api` for Android emulator access to the local backend.
- Login calls `POST /api/auth/login`.
- Registration calls `POST /api/auth/register`.
- Google login starts `GET /api/auth/oauth/google/start` and returns through `neyqo://auth/oauth/callback`.
- Microsoft login starts `GET /api/auth/oauth/microsoft/start` and returns through `neyqo://auth/oauth/callback`.
- Registration currently expects the backend email verification flow to continue after the registration response.
- Theme preference is stored in DataStore through `ThemeRepository`.

## Rules

- Keep public copy customer-facing and non-technical.
- Add API integration against the documented backend auth endpoints.
- Store mobile session tokens with Android-appropriate secure storage when backend integration is added.
- Keep shared business concepts aligned with `docs/ARCHITECTURE.md` and `docs/AUTHENTICATION.md`.
