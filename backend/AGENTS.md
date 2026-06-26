# Neyqo Backend Context

This backend is a copied and isolated version of `generic-login/backend`.

## Scope

- Work only inside `neyqo/backend`.
- Never edit `C:\Users\carlo\Programming\generic-login`.
- Keep Fastify, TypeScript, TypeORM, PostgreSQL, Zod, JWT, and HTTP-only refresh cookies.

## Current Endpoints

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
- `GET /api/sync/external-connections`
- `POST /api/sync/oauth/:provider/start`
- `GET /api/sync/oauth/:provider/callback`
- `GET /api/sync/import-rules`
- `POST /api/sync/import-rules`
- `PATCH /api/sync/import-rules/:id`
- `GET /api/sync/imported-transactions`
- `PATCH /api/sync/imported-transactions/:id`
- `GET /api/scheduled-transactions`
- `POST /api/scheduled-transactions`
- `GET /api/scheduled-transactions/:id`
- `PUT /api/scheduled-transactions/:id`
- `PATCH /api/scheduled-transactions/:id/pause`
- `PATCH /api/scheduled-transactions/:id/resume`
- `PATCH /api/scheduled-transactions/:id/deactivate`
- `POST /internal/transactions`
- `POST /internal/email-sync/imported-transactions`

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Start built app: `npm run start`

## Auth Rules

- Traditional auth is active through existing email/password endpoints.
- Social auth must use identity scopes only.
- Email-reading OAuth must be implemented separately under sync-specific endpoints.
- Never mix Neyqo session tokens with external mail integration tokens.

## Future Modules

- Scheduled transaction automation under `scheduled-transactions` and the independent worker.
- Email sync under a future `sync` module.
- External tokens must be encrypted at rest.

## Rules

- Add database entities under `src/entities`.
- Prefer route schemas with Zod before service logic.
- Use shared route helpers from `src/modules/shared/route-helpers.ts` for authenticated finance routes, internal-service-secret routes, and validation error payloads.
- Keep route handlers focused on HTTP parsing/status codes, services focused on business rules, and repositories focused on non-trivial query/persistence logic.
- Add a `*.repository.ts` when a module has cursor pagination, ownership lookups, duplicate checks, or multi-step persistence queries.
- Keep authentication endpoints protected with route-specific rate limits, progressive abuse controls, and security-event logging.
- Never log passwords, access tokens, refresh tokens, one-time codes, OAuth authorization codes, or provider tokens.
- Protected internal endpoints must use `INTERNAL_SERVICE_SECRET` and must not accept frontend user tokens as service credentials.
- Do not fake external integrations.
- Account balance corrections must preserve ledger math: changing `initialBalance` adjusts `currentBalance` by the difference, and currency changes are blocked once transactions, active scheduled transactions, or active import rules exist.
- Transaction balance effects depend on status: only `completed` applies to balances. Future completed transactions, non-transfer destination fields, transfer categories, same-account transfers, and inconsistent same-currency transfer amounts must be rejected server-side.
- Update this file if backend architecture changes.
