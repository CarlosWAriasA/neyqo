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

Disabled by default. It reads connected Gmail and Outlook accounts from `external_connections`, refreshes provider tokens, fetches recent inbox messages likely to be bank alerts, parses supported bank formats, and sends detections to:

```text
POST /internal/email-sync/imported-transactions
```

The API matches user import rules, creates high-confidence expenses when appropriate, and stores lower-confidence detections for review. Duplicate provider messages are guarded by `email_synced_messages`.

## Environment

Copy `.env.example` to `.env` and set:

```text
DATABASE_URL=
NEYQO_API_BASE_URL=
INTERNAL_SERVICE_SECRET=
EXTERNAL_TOKEN_ENCRYPTION_KEY=
```

`INTERNAL_SERVICE_SECRET` must match the backend value. Never expose it to the frontend.
When `EMAIL_SYNC_JOB_ENABLED=true`, `EXTERNAL_TOKEN_ENCRYPTION_KEY` must match the backend value so the worker can decrypt provider tokens. Configure `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and/or `MICROSOFT_CLIENT_ID`/`MICROSOFT_CLIENT_SECRET` for the providers you want the worker to process.

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

Email sync can be triggered the same way:

```bash
curl -X POST http://localhost:3010/internal/jobs/email-sync/run \
  -H "Content-Type: application/json" \
  -H "X-Internal-Service-Secret: $INTERNAL_SERVICE_SECRET" \
  -d "{}"
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
