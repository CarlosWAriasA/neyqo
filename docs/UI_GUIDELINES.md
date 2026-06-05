# Neyqo UI Guidelines

## Brand

Neyqo should feel modern, minimal, clear, professional, light, trustworthy, and easy to use.

Public UI copy must be written for customers. Do not mention OAuth, tokens, scopes, staged development, future implementation details, or internal permission architecture in landing or auth screens.

## Colors

Use centralized tokens in `frontend/src/styles/tokens.css`.

- Primary: `#0F766E`
- Primary strong: `#115E59`
- Primary soft: `#CCFBF1`
- Main background: `#F8FAFC`
- Secondary background: `#F1F5F9`
- Surface: `#FFFFFF`
- Text: `#0F172A`
- Secondary text: `#64748B`
- Border: `#E2E8F0`
- Positive and income: `#16A34A`
- Expense and errors: `#DC2626`
- Warning: `#D97706`
- Info: `#2563EB`

## Typography

Use system sans-serif with Inter as the preferred font. Keep headings clear and restrained inside app surfaces.

## Spacing And Shapes

- Use consistent gaps: 8, 12, 16, 20, 24, and 32px.
- Cards use 8px radius.
- Buttons and inputs use 8px radius.
- Shadows should be subtle.

## Components

- Buttons use icons when they represent actions.
- Forms should be short, grouped, and easy to scan.
- Tables are for desktop; use cards/lists on mobile.
- Modals or side panels are appropriate for create/edit flows.
- Empty states should explain what is missing and offer one clear action.
- Skeletons should be used for initial loading of dense views.

## Financial Conventions

- Income: green.
- Expense: red.
- Transfer: blue.
- Warning budget: amber.
- Exceeded budget: red.

## Responsive Design

- Desktop uses a sidebar.
- Mobile uses a collapsible top navigation.
- Avoid horizontal tables on mobile.
- Keep primary actions easy to reach.

## Accessibility

- Maintain visible focus states.
- Use adequate contrast.
- Give icon-only buttons labels.
- Keep copy direct and non-technical.

## Dark Mode

Dark mode uses the same semantic tokens as light mode. Do not branch component styles by theme unless a specific visual element needs it. Prefer `bg-surface`, `bg-canvas`, `text-text`, `text-subtle`, and `border-border`.

## Motion

Use short, subtle animations for entrance, hover, panel opening, and progress changes. Prefer opacity and transform. Respect `prefers-reduced-motion`.

Landing anchors use smooth scrolling with `scroll-margin-top` to account for the sticky header. Reduced-motion users should get minimal movement.
