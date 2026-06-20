# Reports Screen Design

## Objective

Build the authenticated `/app/reports` experience as a full-stack feature backed by real user data. The page should help users understand where money is coming from, where it is going, which budgets need attention, and how each currency is behaving without mixing incompatible monetary totals.

The default view opens on the current month. Users can switch to `Mes actual`, `Últimos 3 meses`, `Últimos 6 meses`, `Año actual`, or a custom date range.

## Research Notes

The chart set should stay practical and readable:

- Datawrapper's chart type guide recommends line charts for change over time, bars for comparing absolute amounts, and stacked bars or columns when showing breakdowns across periods.
- Datawrapper's pie chart guidance says pie and donut charts work best with only a few shares and are weak for comparing small differences, so Neyqo should prefer ranked bars for category comparisons.
- Personal finance reporting patterns from products such as YNAB center on spending, income versus expense, trends, and net worth. For Neyqo's current product stage, cash flow, category spending, account spending, and budget performance are higher value than complex exploratory visuals.

Sources:

- https://www.datawrapper.de/blog/chart-types-guide
- https://www.datawrapper.de/blog/pie-charts
- https://en.wikipedia.org/wiki/YNAB

## Scope

In scope:

- Backend report module with authenticated endpoints.
- Zod DTOs for report filters and response contracts.
- TypeORM aggregation queries over existing accounts, transactions, categories, and budgets.
- Frontend report API helpers and TanStack Query hooks.
- Recharts-based UI for the reports page.
- Currency-separated summaries and chart series.
- Loading, empty, partial error, and retry states.
- Documentation updates for report contracts.

Out of scope for this first version:

- Currency conversion or exchange rates.
- Net worth history if historical account balance snapshots do not exist.
- Export to PDF/CSV.
- Predictive forecasting.
- Email sync reporting beyond transactions already imported into the normal transaction table.
- Materialized summaries or background report jobs.

## Backend Design

Create `backend/src/modules/reports` with:

- `reports.routes.ts` for HTTP endpoints.
- `reports.schemas.ts` for Zod filter and response schemas.
- `reports.service.ts` for aggregation orchestration.
- `reports.repository.ts` for non-trivial TypeORM query builders.

Register the module in `backend/src/app.ts` under `/api/reports`. Every route uses the shared authenticated route helper so the `userId` is always enforced.

### Filter Contract

All report endpoints accept:

- `preset`: `current-month`, `last-3-months`, `last-6-months`, `year-to-date`, or `custom`.
- `dateFrom`: ISO date string, required for `custom`, optional otherwise.
- `dateTo`: ISO date string, required for `custom`, optional otherwise.
- `accountId`: optional account filter. Must belong to the authenticated user when supplied.
- `categoryId`: optional category filter. Must belong to the authenticated user when supplied.

Date rules:

- `current-month` resolves from the first day of the current calendar month through today.
- `last-3-months` and `last-6-months` are rolling ranges ending today, including today and the same calendar date three or six months earlier.
- `year-to-date` resolves from January 1 of the current year through today.
- `custom` validates `dateFrom <= dateTo`.
- The backend returns `resolvedRange` in every response so the frontend can show exact dates.

### Endpoints

`GET /api/reports/summary`

Returns totals grouped by currency:

- `currency`
- `incomeTotal`
- `expenseTotal`
- `netCashflow`
- `savingsRate`
- `transactionCount`
- `topExpenseCategory`
- `previousPeriodComparison` for income, expenses, and net cashflow

`GET /api/reports/cashflow`

Returns time buckets grouped by currency:

- `bucket`
- `label`
- `currency`
- `income`
- `expenses`
- `net`

Bucket granularity:

- Daily for current month and short custom ranges up to 45 days.
- Weekly for ranges from 46 to 120 days.
- Monthly for longer ranges.

`GET /api/reports/spending-by-category`

Returns expense category totals grouped by currency:

- `categoryId`
- `categoryName`
- `categoryIcon`
- `currency`
- `amount`
- `percentageOfCurrencyExpenses`
- `transactionCount`
- `previousPeriodChange`

Uncategorized expenses are grouped as `Sin categoría`.

`GET /api/reports/spending-by-account`

Returns expense totals grouped by source account and currency:

- `accountId`
- `accountName`
- `accountType`
- `currency`
- `amount`
- `percentageOfCurrencyExpenses`
- `transactionCount`

`GET /api/reports/budget-performance`

Returns active budget performance for the resolved range. Budgets do not currently store a currency, so the report derives currency from completed expenses matched to each budget's categories. If a budget has no matched expenses in the range, it appears once under the user's primary currency.

- `budgetId`
- `budgetName`
- `currency`
- `budgetedAmount`
- `spentAmount`
- `remainingAmount`
- `percentageUsed`
- `status`
- `categoryNames`

Budgets remain tied to their existing budget period model. The report includes active budgets whose current period overlaps the resolved range.

### Aggregation Rules

- Include only transactions with `status = completed`.
- Include income and expense transactions in cashflow; exclude transfers from income and expense totals.
- Transfers can be counted separately later, but they should not inflate cashflow.
- Use transaction currency when present. If absent, fall back to the source account currency.
- Never sum different currencies into one displayed total.
- All queries must constrain by authenticated `userId`.
- Amounts return as numbers matching the current app contracts.

## Frontend Design

Install Recharts in `frontend` and use it only inside the reports module. Recharts is a good fit because it is React-native in usage, supports responsive containers, and covers the needed primitives without introducing a heavier visualization framework.

Add:

- `frontend/src/api/reports.ts`
- `frontend/src/features/finance/reportsHooks.ts`
- `frontend/src/modules/reports/reports.utils.ts`
- `frontend/src/modules/reports/reports.schema.ts` for filter state validation and URL/query serialization.
- Focused report components under `frontend/src/modules/reports/components`.

Keep data access behind API helpers and hooks. Route components should compose data, filters, and UI states rather than embedding aggregation logic.

### Page Layout

Top area:

- `PageHeader` with title `Reportes` and description focused on decisions, not implementation.
- Filter bar with preset segmented buttons, account select, category select, and custom date inputs shown only when `Personalizado` is active.

Summary area:

- Currency tabs or grouped sections. If only one currency has data, show one group without tabs.
- Per currency stat cards:
  - Ingresos
  - Gastos
  - Flujo neto
  - Ahorro

Main analysis:

- Cashflow chart as the primary panel.
- For each currency, show income and expenses as bars and net as a line.
- Use responsive chart containers with minimum heights so layout does not shift.

Breakdown area:

- Spending by category as ranked horizontal bars.
- Spending by account as ranked horizontal bars.
- Optional compact donut for top five categories only when there are at least two and at most five meaningful categories; otherwise omit it.

Budget area:

- Budget performance list sorted by risk:
  - Exceeded first.
  - Important warning.
  - Moderate warning.
  - Normal.
- Each row shows budget name, categories, currency, spent versus limit, remaining amount, and progress bar.

Insights area:

- Three to five generated insight cards based on endpoint data:
  - Highest expense category.
  - Largest month-over-month increase.
  - Best or worst currency cashflow.
  - Budgets near or over limit.

### Empty And Error States

Empty data:

- If there are no completed transactions in the selected range, show a clear empty state with actions to open `/app/transactions` and `/app/accounts`.
- If a specific chart has no data but other sections do, show a compact section-level empty state instead of hiding the card without explanation.

Errors:

- Each endpoint gets its own retry path where practical.
- If summary fails, show a page-level error because the top context is missing.
- If a secondary endpoint fails, show a card-level error and keep the rest of the page visible.

## Visual Direction

Reports should feel analytical and calm, not decorative. The distinctive element is a "ledger grid" rhythm: chart cards use subtle ruled backgrounds and compact numeric labels that echo a finance ledger without becoming dense spreadsheet UI.

Use existing theme tokens from `frontend/src/styles/tokens.css`:

- Primary for positive focus and selected filters.
- Danger for expenses and negative net cashflow.
- Positive for income and positive net cashflow.
- Warning for budgets near limits.
- Border and muted tokens for chart grids and axes.

Do not add a new color system unless Recharts requires a small chart palette. If a chart palette is needed, define it in `reports.utils.ts` using existing semantic token values via CSS variables.

## Accessibility And Responsiveness

- Every chart has a textual summary above or below it.
- Tooltips use readable labels and formatted currency.
- Keyboard focus remains visible for filter controls.
- Charts must fit mobile widths without rotated labels.
- Prefer horizontal bars for category/account rankings on mobile.
- Respect `prefers-reduced-motion`; avoid chart animations when reduced motion is active.

## Testing And Verification

Backend:

- Build succeeds with `npm --prefix backend run build`.
- The backend currently has no test script, so verification for this feature relies on TypeScript build plus focused manual/API checks unless a test runner is added as part of implementation.
- Verify ownership filters cannot read another user's accounts, categories, budgets, or transactions.
- Verify custom date validation rejects inverted ranges.
- Verify multi-currency output returns separate groups.

Frontend:

- Build succeeds with `npm run frontend:build`.
- Lint succeeds with `npm run frontend:lint`.
- Verify `/app/reports` renders loading, empty, error, and populated states.
- Verify preset switching updates query keys and refetches report data.
- Verify custom range inputs only appear for `Personalizado`.
- Verify chart text and controls do not overlap on mobile and desktop.

## Implementation Notes

- Start with the backend contracts so the frontend can target stable shapes.
- Add report query keys under `financeQueryKeys`.
- Invalidate report queries when transactions or budgets change.
- Avoid fetching all transactions into the browser for aggregation.
- Keep public auth and email sync OAuth untouched.
- Keep all edits inside `C:\Users\carlo\Programming\neyqo`.
