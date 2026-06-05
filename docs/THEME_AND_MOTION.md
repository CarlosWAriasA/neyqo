# Theme And Motion

## Themes

Neyqo supports Light, Dark, and System preferences.

The preference is stored in `neyqo.theme`. `frontend/index.html` applies the resolved theme before React renders to avoid flashing.

The landing header exposes a quick light/dark toggle. The authenticated app keeps the full `Claro`, `Oscuro`, and `Sistema` preference in `/app/settings`.

## Tokens

Theme colors are centralized in `frontend/src/styles/tokens.css`. Components should use Tailwind token names rather than raw hex values.

## Motion

Motion for React is used for subtle transitions:

- landing hero entrance
- card appearance
- authentication modal opening and closing
- progress bars
- side panel opening
- hover elevation

Landing section links use smooth scrolling and section scroll margins.

Allowed motion: opacity, transform, scale, and translate.

Avoid expensive layout/repaint-heavy animations.

## Accessibility

The global CSS respects `prefers-reduced-motion` by reducing transition and animation durations.

Maintain visible focus styles and readable contrast in both themes.
