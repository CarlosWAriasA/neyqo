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
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/:sessionId`
- `POST /api/auth/sessions/revoke-others`
- `POST /api/auth/sessions/revoke-all`
- `GET /api/auth/me`

Local storage keys:

- `neyqo.access-token`
- `neyqo.session`

Social auth buttons are UI-ready but disabled until provider credentials and server-side OAuth are configured.

The main landing opens authentication in a modal. Direct auth URLs are preserved through query params so shared links still work.

## Theme

Theme preference is persisted in `neyqo.theme` with `light`, `dark`, or `system`. The inline script in `index.html` applies the theme before React renders.

## PWA

The frontend exposes a web app manifest and registers `public/sw.js` only in production builds. The service worker caches the app shell and static assets, but it must not cache `/api` requests or other authenticated backend traffic.

## SEO

- `https://neyqo.xyz/` is the canonical production origin.
- The landing page exposes crawlable fallback content, canonical metadata, social cards, and structured data directly in `index.html`.
- `privacy.html` and `terms.html` are separate Vite HTML entries so direct requests return route-specific metadata before React runs.
- `public/sitemap.xml` contains only public canonical pages and `public/robots.txt` excludes authentication and private app routes.
- Azure, Nginx, and Vercel configuration must keep `X-Robots-Tag: noindex` on `/app/*`, authentication callbacks, and password/account entry routes.
- Update canonical URLs, sitemap entries, and social image URLs together if the production domain changes.

## Container Deployment

- `Dockerfile` builds the Vite application and serves `dist` through Nginx.
- `nginx.conf` provides the React Router SPA fallback and `/healthz` endpoint.
- Production `VITE_*` values are Docker build arguments because Vite embeds them at build time.
- The default production API is `https://neyqo-production.up.railway.app/api`; override `VITE_API_BASE_URL` at image build time for other environments.
- Local Vite development continues to use `frontend/.env` and the `/api` development proxy.

## Rules

- Keep mock data in `src/mocks`.
- Keep colors in `src/styles/tokens.css` and Tailwind config.
- Do not request email-reading permissions during login or registration.
- Do not show technical OAuth, token, scope, consent, or provider-permission copy in public UI.
- Keep business logic out of visual components when adding real endpoints.
- Keep HTTP calls behind `src/api` helpers and consume finance data through TanStack Query hooks in `src/features/finance`.
- Prefer domain hook files such as `accountsHooks.ts`, `transactionsHooks.ts`, `budgetsHooks.ts`, and `scheduledHooks.ts`; keep `hooks.ts` as a compatibility export surface.
- Email sync connection UI starts OAuth from `/app/sync` through `/api/sync/oauth/:provider/start`; do not reuse authentication OAuth routes for mail permissions.
- Respect `prefers-reduced-motion`.
- Update this file when frontend architecture changes.
