# SEO

The canonical public origin is `https://neyqo.xyz/`.

## Indexable pages

- `/`
- `/privacy`
- `/terms`

Authentication, OAuth callback, password recovery, and `/app/*` pages must remain `noindex` because they do not provide useful public search content and can expose duplicate app-shell URLs.

## Search metadata

The landing page owns the primary query targets:

- `Neyqo`
- `Neyqo finanzas personales`
- `app de finanzas personales`

`frontend/index.html` contains the initial title, description, canonical link, Open Graph/Twitter metadata, crawlable landing copy, and `WebSite` plus `SoftwareApplication` structured data. React updates metadata after client-side navigation through `SeoMetadata`.

## Discovery files

- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml`
- `frontend/public/staticwebapp.config.json`
- `frontend/public/og-image.png`

Update `lastmod` only when the corresponding page has a meaningful content change.

## Deployment checklist

1. Deploy the frontend and confirm `https://neyqo.xyz/robots.txt` and `https://neyqo.xyz/sitemap.xml` return `200` without the SPA HTML fallback.
2. Confirm direct requests to `/privacy` and `/terms` return their own title and canonical metadata in the raw response.
3. Confirm `/app/dashboard` and `/reset-password` return the `X-Robots-Tag: noindex, nofollow, noarchive` response header.
4. In Google Search Console, submit `https://neyqo.xyz/sitemap.xml` and request indexing for the home page.
5. Keep the Azure default hostname redirected to the custom domain when platform configuration permits; canonical metadata remains `https://neyqo.xyz/`.
