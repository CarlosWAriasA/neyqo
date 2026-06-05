# Neyqo Frontend Context

This is the React web app for Neyqo. It now contains public marketing pages, first-party authentication screens, and the authenticated finance application.

## Stack

- React
- TypeScript strict mode
- Vite
- React Router
- TanStack Query
- Axios
- React Hook Form
- Zod
- Tailwind CSS
- Motion for React
- Local shadcn-inspired reusable components

## Routes

Public:

- `/`
- `/login` redirects to `/?auth=login`
- `/register` redirects to `/?auth=register`
- `/forgot-password` redirects to `/?auth=forgot-password`
- `/reset-password`
- `/privacy`
- `/terms`

Authenticated app:

- `/app/dashboard`
- `/app/accounts`
- `/app/transactions`
- `/app/categories`
- `/app/budgets`
- `/app/scheduled`
- `/app/sync`
- `/app/reports`
- `/app/settings`

## Structure

- `src/api`: HTTP clients and backend integration.
- `src/config`: environment and navigation.
- `src/components`: reusable UI, feedback, forms, and navigation.
- `src/layouts`: public, auth, app, and session layouts.
- `src/modules`: route-level feature modules.
- `src/mocks`: temporary financial and sync data while remaining modules move to backend endpoints.
- `src/styles`: global CSS and design tokens.
- `src/theme`: theme preference and application logic.
- `src/types`: shared contracts for auth and finance.

## Auth Integration

Neyqo React owns the auth screens. It calls the copied Fastify backend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/reset`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Local storage keys:

- `neyqo.access-token`
- `neyqo.session`

Social auth buttons are UI-ready but disabled until provider credentials and server-side OAuth are configured.

The main landing opens authentication in a modal. Direct auth URLs are preserved through query params so shared links still work.

## Theme

Theme preference is persisted in `neyqo.theme` with `light`, `dark`, or `system`. The inline script in `index.html` applies the theme before React renders.

## Rules

- Keep mock data in `src/mocks`.
- Keep colors in `src/styles/tokens.css` and Tailwind config.
- Do not request email-reading permissions during login or registration.
- Do not show technical OAuth, token, scope, consent, or provider-permission copy in public UI.
- Keep business logic out of visual components when adding real endpoints.
- Respect `prefers-reduced-motion`.
- Update this file when frontend architecture changes.
