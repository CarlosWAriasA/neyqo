# neyqo-worker

Independent worker service for Neyqo automatic jobs.

## What It Does

- Runs periodic jobs through a common scheduler.
- Processes scheduled transactions.
- Records job runs and per-item errors.
- Uses PostgreSQL locking to support multiple worker instances.
- Calls the main API for transaction creation through a protected internal endpoint.
- Exposes `/health`, `/ready`, and a protected manual run endpoint.

## Jobs

### scheduled-transactions

Enabled by default. It claims active rows from `scheduled_transactions` where:

```text
status = active
next_execution_date <= today
```

For each due execution date, it calls:

```text
POST /internal/transactions
```

The transaction stores:

```text
scheduled_transaction_id
scheduled_execution_date
processed_at
```

`UNIQUE(scheduled_transaction_id, scheduled_execution_date)` prevents duplicates even under retries or multiple worker instances.

### email-sync

Disabled by default. The job, provider contracts, parser contract, and duplicate table are prepared. Gmail and Outlook implementations intentionally throw until OAuth token storage and provider integrations are implemented securely.

## Environment

Copy `.env.example` to `.env` and set:

```text
DATABASE_URL=
NEYQO_API_BASE_URL=
INTERNAL_SERVICE_SECRET=
```

`INTERNAL_SERVICE_SECRET` must match the backend value. Never expose it to the frontend.

## Local Development

```bash
npm install
npm run dev
```

From the repository root:

```bash
npm run worker:dev
```

## Manual Run

```bash
curl -X POST http://localhost:3010/internal/jobs/scheduled-transactions/run \
  -H "Content-Type: application/json" \
  -H "X-Internal-Service-Secret: $INTERNAL_SERVICE_SECRET" \
  -d "{}"
```

To process one user only:

```json
{ "userId": "00000000-0000-0000-0000-000000000000" }
```

## Production

```bash
npm run build
npm run start
```

Run the backend migrations before starting the worker when schema synchronization is disabled:

```bash
npm --prefix ../backend run migration:run
```

On shutdown, the worker stops scheduling new cycles, waits for the current job to finish, closes the HTTP server, and destroys the database connection.
