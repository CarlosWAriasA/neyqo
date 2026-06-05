# Neyqo Architecture

## Responsibilities

Neyqo is split into three active pieces:

- Neyqo backend in `neyqo/backend`: Fastify backend that provides authentication, session, financial APIs, and protected internal endpoints.
- Neyqo React frontend in `neyqo/frontend`: public landing, authentication screens, and authenticated finance experience.
- Neyqo worker in `neyqo/neyqo-worker`: independent periodic job runner for scheduled transactions and future email sync work.

`generic-login` remains read-only reference only and is not part of the active Neyqo flow.

## Auth Flow

The React app owns the auth screens and stores the session using these keys:

- `neyqo.access-token`
- `neyqo.session`

On startup protected routes:

1. Reads the access token and stored user.
2. Calls `GET /api/auth/me` when an access token exists.
3. Calls `POST /api/auth/refresh` when a stored user exists but the access token is missing.
4. Shows a session-expired state and links to `VITE_AUTH_LOGIN_URL` when recovery fails.
5. Redirect unauthenticated users from `/app/*` to `/login`.
6. Calls `POST /api/auth/logout` for logout.

## Backend

The backend uses Fastify, TypeORM, PostgreSQL, Zod, JWT access tokens, and an HTTP-only refresh cookie. It currently exposes health, authentication, account, category, transaction, budget, preference, and protected internal endpoints.

Financial modules should be added as isolated modules under `backend/src/modules`, with entities under `backend/src/entities` and DTO validation through Zod.

## Worker Boundary

`neyqo-worker` runs periodic jobs independently from the API process. It can read and update operational tables such as `scheduled_transactions`, `worker_job_runs`, `worker_job_errors`, and `email_synced_messages`.

When the worker needs to create a normal financial transaction, it calls `POST /internal/transactions` with `X-Internal-Service-Secret`. The API validates `INTERNAL_SERVICE_SECRET` and reuses `TransactionsService` so validation and balance updates stay centralized.

## User Preferences

User preferences are persisted server-side so web and future mobile clients share the same settings.

- `GET /api/preferences` returns the authenticated user's preferences, creating defaults when none exist.
- `PATCH /api/preferences` updates one or more preferences after Zod validation.

Current fields:

- `primaryCurrency`: `DOP`, `USD`, or `EUR`
- `dateFormat`: `dd-mm-yyyy` or `yyyy-mm-dd`
- `weekStartsOn`: `monday` or `sunday`
- `theme`: `light`, `dark`, or `system`
- `hideBalances`
- `budgetAlerts`

## Frontend Structure

- `src/api`: Axios client, auth helpers, and temporary finance data access.
- `src/components`: reusable UI, navigation, forms, and feedback.
- `src/config`: environment and navigation configuration.
- `src/layouts`: app shell and authenticated session wrapper.
- `src/modules`: route-level feature modules.
- `src/mocks`: temporary data until real finance endpoints exist.
- `src/styles`: CSS variables and global Tailwind layers.
- `src/theme`: persisted light/dark/system theme handling.
- `src/types`: auth and finance contracts.

## Routes

Public routes are `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/privacy`, and `/terms`.

Authenticated app routes live under `/app`.

`/login`, `/register`, and `/forgot-password` redirect to `/` with `auth` query params and open the corresponding modal. This keeps the landing visible behind authentication while preserving direct-link compatibility.

Unauthenticated users who enter `/app/*` are redirected to `/`. Unknown public routes also redirect to `/`. Unknown routes inside `/app/*` redirect to `/app/dashboard` after session validation.

## Client HTTP

`src/api/client.ts` centralizes Axios configuration. It attaches the current access token, uses credentials for refresh cookies, and emits a session-expired event on `401`.

## Error Handling

The initial app includes a general error component and a session-expired banner. Feature-level server errors should use TanStack Query status and keep messages friendly, specific, and non-technical.

Backend errors are written as JSON Lines when `FILE_LOGGING_ENABLED=true`:

- `backend/logs/errors.log` for unhandled API errors and startup failures.
- `backend/logs/app.log` for lifecycle events such as backend startup.

The log directory can be changed with `LOG_DIR`.

## Mock Data Strategy

Mocks live only in `frontend/src/mocks`. `src/api/financial.ts` wraps them behind async functions so the UI can later switch to real API calls without changing visual components.

## Future React Native Strategy

Do not share web visual components with React Native. Share concepts instead:

- DTO names
- endpoint names
- validation rules where practical
- domain types
- business rules
- documentation of expected responses

If contracts become stable, consider a small shared package for generated API types or schema-derived DTOs.

## Email Sync Boundary

Authentication OAuth is separate from email sync OAuth. Google or Microsoft login must use identity scopes only. Gmail or Outlook mail-reading permissions belong to `/app/sync` and future sync-specific backend endpoints.

Email sync worker contracts exist in `neyqo-worker/src/jobs/email-sync`, but provider token storage and bank email parsing remain pending. External provider tokens must be encrypted and must never be logged.
