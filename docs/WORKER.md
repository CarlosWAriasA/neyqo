# Neyqo Worker

`neyqo-worker` is an independent service for periodic Neyqo jobs. It does not replace the main API.

## Current Jobs

- `scheduled-transactions`: enabled by default. Claims active scheduled transactions whose `next_execution_date` is due, creates normal transactions through the protected API endpoint, advances `next_execution_date`, and records job runs/errors.
- `email-sync`: registered but disabled by default. Provider contracts exist for Gmail and Outlook, and duplicate prevention is prepared through `email_synced_messages(user_id, provider, external_message_id)`.

## API Boundary

The worker may read and update operational state in PostgreSQL, but it must create financial transactions through:

```text
POST /internal/transactions
X-Internal-Service-Secret: <INTERNAL_SERVICE_SECRET>
```

The main API validates the secret and reuses `TransactionsService`, so balances and existing transaction validation stay centralized.

## Locking Strategy

Scheduled transactions are claimed with PostgreSQL row locks:

```text
FOR UPDATE SKIP LOCKED
```

Claimed rows receive `locked_by` and `locked_until`. If another worker instance is running, it skips locked rows. The unique index on `transactions(scheduled_transaction_id, scheduled_execution_date)` is the final idempotency guard.

## Local Run

```bash
npm --prefix backend install
npm --prefix neyqo-worker install

npm run backend:dev
npm run worker:dev
```

Set the same `INTERNAL_SERVICE_SECRET` in `backend/.env` and `neyqo-worker/.env`.

## Production Notes

Build and run the API and worker independently:

```bash
npm run backend:build
npm run worker:build
npm run backend:start
npm run worker:start
```

Run backend migrations before starting the worker when `DB_SYNCHRONIZE=false`:

```bash
npm --prefix backend run migration:run
```

Do not expose `INTERNAL_SERVICE_SECRET` to the frontend. Do not store OAuth access or refresh tokens in worker logs.
