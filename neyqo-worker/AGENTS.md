# Neyqo Worker Context

`neyqo-worker` is an independent TypeScript service for Neyqo automated jobs.

## Stack

- Fastify
- TypeScript
- TypeORM
- PostgreSQL
- Zod

## Rules

- Keep financial business rules in the main API.
- Use `POST /internal/transactions` with `X-Internal-Service-Secret` for automatic transaction creation.
- Do not log secrets, OAuth tokens, or complete email bodies.
- Do not add Redis, queues, or external brokers for the first worker version.
- Jobs must implement the common `WorkerJob` contract.
