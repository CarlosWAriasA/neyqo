# Authentication

Neyqo now owns its authentication screens in the React frontend.

## Traditional Registration

The React register page calls `POST /api/auth/register` with `fullName`, `email`, and `password`.

The current backend sends an email verification code and does not immediately authenticate the user after registration.

## Traditional Login

The React login page calls `POST /api/auth/login` and stores:

- `neyqo.access-token`
- `neyqo.session`

The backend also sets an HTTP-only refresh cookie.

## Password Recovery

- `POST /api/auth/password/forgot`
- `POST /api/auth/password/reset`

## Current User And Refresh

- `GET /api/auth/me` validates the access token.
- `POST /api/auth/refresh` uses the HTTP-only refresh cookie.
- `POST /api/auth/logout` clears the backend refresh token and local client state.

## Social Login

Google and Microsoft buttons exist in the UI but remain disabled until external OAuth credentials and server-side flows are configured.

Social login must request only identity scopes needed to identify the user.

## Critical Separation

Authentication and email sync are separate. Do not request Gmail or Outlook mail-reading permissions during login, registration, password recovery, first access, or onboarding.

Mail-reading consent belongs only in `/app/sync` or a sync-specific flow initiated by the user.

## Variables

Frontend:

- `VITE_GOOGLE_AUTH_ENABLED`
- `VITE_MICROSOFT_AUTH_ENABLED`

Backend:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_AUTH_REDIRECT_URI`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_TENANT_ID`
- `MICROSOFT_AUTH_REDIRECT_URI`

## Pending

- Implement OAuth authorization URL generation.
- Implement OAuth callback token exchange.
- Add Microsoft identity profile handling.
- Add React email verification screen or change backend registration policy.
