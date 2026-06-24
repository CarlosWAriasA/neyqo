# Backend Gap Analysis

## Current Backend Summary

The copied backend is a Fastify application written in TypeScript. It uses TypeORM with PostgreSQL, Zod for request validation, JWT access tokens, and an HTTP-only refresh cookie.

The original source was `C:\Users\carlo\Programming\generic-login\backend`. The Neyqo copy is `C:\Users\carlo\Programming\neyqo\backend`.

## Existing Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/verify-email/resend`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/reset`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/:sessionId`
- `POST /api/auth/sessions/revoke-others`
- `POST /api/auth/sessions/revoke-all`
- `DELETE /api/auth/account`
- `GET /api/auth/me`
- `GET /api/auth/oauth/google/start` placeholder
- `GET /api/auth/oauth/google/callback` placeholder
- `GET /api/auth/oauth/microsoft/start` placeholder
- `GET /api/auth/oauth/microsoft/callback` placeholder
- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/accounts/:id`
- `PATCH /api/accounts/:id`
- `PATCH /api/accounts/:id/deactivate`
- `PATCH /api/accounts/:id/reactivate`
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `PATCH /api/categories/:id/deactivate`
- `PATCH /api/categories/:id/reactivate`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/budgets`
- `POST /api/budgets`
- `PATCH /api/budgets/:id`
- `PATCH /api/budgets/:id/deactivate`
- `PATCH /api/budgets/:id/reactivate`
- `GET /api/preferences`
- `PATCH /api/preferences`
- `GET /api/exchange-rates/quote`
- `POST /internal/transactions`
- `GET /api/scheduled-transactions`
- `GET /api/scheduled-transactions/upcoming`
- `GET /api/scheduled-transactions/summary`
- `GET /api/scheduled-transactions/:id`
- `GET /api/scheduled-transactions/:id/generated-transactions`
- `POST /api/scheduled-transactions`
- `PUT /api/scheduled-transactions/:id`
- `PATCH /api/scheduled-transactions/:id/pause`
- `PATCH /api/scheduled-transactions/:id/resume`
- `PATCH /api/scheduled-transactions/:id/deactivate`

## Existing Authentication Flow

- Email registration creates a pending user and sends a verification code.
- Email verification creates a session.
- Login returns an access token and sets a refresh token cookie.
- Google login validates a Google access token, links or creates an identity, and creates a session.
- Refresh reads the refresh token cookie and returns a new access token.
- Logout clears the persisted refresh token and cookie.
- Current user requires a Bearer access token.

## Middleware And Plugins

- CORS via `@fastify/cors`.
- Cookies via `@fastify/cookie`.
- Helmet via `@fastify/helmet`.
- Rate limiting via `@fastify/rate-limit`.
- Global error handling in `src/app.ts`.

## Database

- PostgreSQL through TypeORM.
- Entities currently loaded: `User`, `AuthIdentity`.
- `DB_SYNCHRONIZE` exists and defaults to true in the copied template. This is convenient locally but should be replaced with migrations before production.

## Environment Variables

See `backend/.env.example`. Important variables:

- `DATABASE_URL`
- `ALLOWED_ORIGINS`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `JWT_REFRESH_COOKIE_NAME`
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `COOKIE_DOMAIN`
- `GOOGLE_CLIENT_ID`
- SMTP settings

## Current Entities

- `User`
- `AuthIdentity`
- `Account`
- `UserPreference`
- `Category`
- `Transaction`
- `Budget`
- `ScheduledTransaction`
- `WorkerJobRun`
- `WorkerJobError`
- `EmailSyncedMessage`

## Reusable Parts

- User identity model.
- Session creation and refresh flow.
- Auth route structure.
- Zod validation style.
- Fastify plugin registration.
- TypeORM data source.
- Global error handler.

## Missing Financial Entities

MVP:

- Scheduled transaction endpoints and worker persistence model now exist.

Later:

- `RecurringTransaction`
- `SavingsGoal`
- `Debt`
- `Notification`
- `ImportedTransaction`
- `Merchant`
- `EmailImportRule`

## Missing Financial Endpoints

Suggested remaining MVP contracts:

- `GET /api/reports/summary`
- `GET /api/reports/cashflow`
- `GET /api/reports/spending-by-category`
- `GET /api/reports/spending-by-account`

## Missing Sync Endpoints

- `GET /api/sync/connections`
- `GET /api/sync/gmail/start`
- `GET /api/sync/gmail/callback`
- `GET /api/sync/outlook/start`
- `GET /api/sync/outlook/callback`
- `DELETE /api/sync/connections/:provider`
- `GET /api/sync/status`
- `POST /api/sync/run`
- `GET /api/sync/runs`
- `GET /api/sync/imported-transactions`

## DTOs Needed

- Scheduled movement create/update/filter DTOs.
- External connection DTOs.
- Email sync run DTOs.
- Report filter DTOs with date ranges and optional account/category filters.

## Migrations Needed

- Add indexes for `user_id`, dates, status, and common filters.
- Add constraints for positive amounts and valid transaction types.

## Technical Risks

- `DB_SYNCHRONIZE=true` can mutate schemas unexpectedly outside development.
- `npm install` currently reports 4 inherited audit findings in the copied backend dependencies.
- Social OAuth placeholders are not functional until provider credentials and server-side token exchange are implemented.
- Email sync must encrypt external provider tokens and avoid storing full email content.
- Currency conversion is not defined yet.
- Authorization must enforce user ownership on every financial resource.
- Report queries may need optimized indexes or materialized summaries later.

## Pending Decisions

- Decimal storage strategy for money.
- Multi-currency conversion rules.
- Whether credit card balances are stored as negative balances or separate liability fields.
- Soft delete versus inactive status for financial records.
- Exact report aggregation shape.
- Migration tool and workflow.

## Recommended Implementation Order

1. Add authenticated route guard/decorator in backend for financial modules.
2. Add dashboard summary endpoint.
3. Add report aggregation endpoints.
4. Replace remaining frontend mocks module by module.
