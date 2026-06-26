# Neyqo

Neyqo is a personal finance web app for understanding balances, income, expenses, categories, budgets, recurring movements, and future email-based consumption sync.

## Structure

```text
neyqo/
  backend/       Fastify auth and finance API.
  frontend/      React app with landing, auth, and authenticated finance UI.
  neyqo-worker/  Independent worker for periodic internal jobs.
  docs/          Architecture, auth, sync, roadmap, theme, worker, and backend analysis.
```

## Routes

Public: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/privacy`, `/terms`.

Authenticated: `/app/dashboard`, `/app/accounts`, `/app/transactions`, `/app/categories`, `/app/budgets`, `/app/scheduled`, `/app/sync`, `/app/reports`, `/app/settings`.

## Install

```bash
npm --prefix backend install
npm --prefix frontend install
npm --prefix neyqo-worker install
```

## Run

```bash
npm run backend:dev
npm run frontend:dev
npm run worker:dev
```

## Build And Lint

```bash
npm run backend:build
npm run frontend:build
npm run worker:build
npm run frontend:lint
```

## Current Status

- Landing page exists.
- React auth screens exist for email/password registration, login, password recovery, and reset.
- Social login buttons are UI-ready but require provider configuration.
- Email sync UI, mail OAuth separation, import rules, detected transaction review, and initial Gmail/Outlook worker fetching exist.
- Sync run history is still mocked while user-facing manual sync and run history endpoints are defined.
- Dark mode is implemented with persisted preference.
- The first worker service exists for scheduled transactions and future email sync jobs.
- Programados now uses backend scheduled transaction endpoints.
