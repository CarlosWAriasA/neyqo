# Neyqo Agent Context

Neyqo is a modern personal finance web app. The project lives in `C:\Users\carlo\Programming\neyqo`.

## Critical Boundary

`C:\Users\carlo\Programming\generic-login` is protected. Do not modify, move, delete, rename, format, install dependencies in, or commit changes inside that folder.

## Current Architecture

- `backend`: Fastify/TypeScript/TypeORM/PostgreSQL backend copied from `generic-login`.
- `frontend`: React/TypeScript/Vite app with landing page, auth screens, and authenticated finance routes.
- `docs`: architecture, roadmap, auth, sync, theme, and backend gap analysis.

## Main Routes

Public:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/privacy`
- `/terms`

Authenticated:

- `/app/dashboard`
- `/app/accounts`
- `/app/transactions`
- `/app/categories`
- `/app/budgets`
- `/app/scheduled`
- `/app/sync`
- `/app/reports`
- `/app/settings`

## Commands

- Install frontend: `npm --prefix frontend install`
- Install backend: `npm --prefix backend install`
- Run frontend: `npm run frontend:dev`
- Run backend: `npm run backend:dev`
- Build frontend: `npm run frontend:build`
- Build backend: `npm run backend:build`
- Lint frontend: `npm run frontend:lint`

## Architecture Rules

- Keep all edits inside `neyqo`.
- Use Neyqo React auth screens, not the old Angular frontend.
- Public auth entry points redirect to landing modals: `/login` -> `/?auth=login`, `/register` -> `/?auth=register`, `/forgot-password` -> `/?auth=forgot-password`.
- Unauthenticated `/app/*` access redirects to `/`.
- Unknown public routes redirect to `/`; unknown authenticated app routes redirect to `/app/dashboard`.
- Keep authentication OAuth separate from email sync OAuth.
- Do not request email-reading permissions during login, registration, recovery, or onboarding.
- Keep mocks centralized in `frontend/src/mocks`.
- Keep design tokens in `frontend/src/styles/tokens.css`.
- Public UI copy must be customer-facing. Keep technical OAuth, token, and provider-permission details in docs only.
- Add real backend endpoints only with Zod DTOs and documented contracts.

## Read First

- `docs/ARCHITECTURE.md`
- `docs/AUTHENTICATION.md`
- `docs/EMAIL_SYNC_DESIGN.md`
- `docs/THEME_AND_MOTION.md`
- `docs/BACKEND_GAP_ANALYSIS.md`
- `frontend/AGENTS.md`
- `backend/AGENTS.md`

## Recommended Next Steps

1. Implement email verification UI inside React or adjust registration policy.
2. Add authenticated backend route guard for financial modules.
3. Add Account and Category entities/endpoints.
4. Add ScheduledMovement entity/endpoints.
5. Implement OAuth provider configuration for social login.
6. Implement separate OAuth flows for Gmail and Outlook sync.
