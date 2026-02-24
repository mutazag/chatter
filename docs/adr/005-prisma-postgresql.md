# ADR-005: Prisma ORM with PostgreSQL (Neon)

**Status:** Accepted
**Date:** 2025-01-01

---

## Context

The application needs a relational database with a type-safe Node.js interface. Decisions were needed on:
1. Which database engine to use
2. Which ORM/query builder to use
3. Where to host the database

---

## Decision

- **Database engine:** PostgreSQL 16
- **ORM:** Prisma
- **Hosting:** Neon (serverless PostgreSQL, free tier)
- **Schema changes:** `prisma db push` (not `prisma migrate dev`)

---

## Rationale

### PostgreSQL over alternatives

- **vs. MySQL/MariaDB:** PostgreSQL is more featureful (native JSON, full-text search, `bytea` for binary data, better concurrency model). The `bytea` type is specifically needed for storing image data.
- **vs. SQLite:** SQLite is not suitable for concurrent multi-user write workloads or cloud deployments.
- **vs. MongoDB:** Relational data (rooms → memberships → users → messages) maps naturally to relational tables with foreign keys and constraints. An ORM provides type-safe joins. MongoDB's flexibility would be unused.

### Prisma over alternatives

- **vs. raw `pg`/`node-postgres`:** Raw SQL requires manual type mapping and is verbose for complex queries. All queries return `any` without extra type declarations.
- **vs. Knex (query builder):** Still requires manual type declarations for results. No schema-as-code.
- **vs. TypeORM/MikroORM:** TypeORM uses decorators and requires `experimentalDecorators`. Its type inference is weaker than Prisma's. MikroORM is excellent but has a steeper learning curve.
- **Prisma advantages:** The schema is the single source of truth. `prisma generate` produces a fully typed client — every `findMany`, `create`, `update` returns typed results. Auto-completion works across the entire query API.

### Neon over alternatives

- **vs. local PostgreSQL:** Requires Docker or a local install. A cloud DB is accessible from any machine and is closer to the production environment.
- **vs. Supabase:** Supabase free tier includes a full PostgreSQL instance but also bundles many additional services (Auth, Storage, Realtime) that are not needed. Neon is a pure PostgreSQL offering.
- **vs. Railway/Render:** Neon's free tier does not suspend or delete the DB (some platforms pause inactive databases). It also provides branching (database branches for preview deployments — future use).

---

## The `db push` vs `migrate dev` Decision

**Problem encountered:**
`prisma migrate dev` creates a migration file, then acquires a PostgreSQL advisory lock to apply it. Neon's pooled connection string uses PgBouncer in transaction mode, which does not support advisory locks. This caused a `P1001 / advisory lock timeout` error.

**Options:**
1. Use `DIRECT_URL` (non-pooled) for migrations
2. Use `prisma db push` which does not use advisory locks

**Decision:** Use `prisma db push` for development and `prisma migrate deploy` for production.

`prisma db push`:
- Applies schema changes directly to the database without creating migration files
- Does not require advisory locks
- Suitable for development when migration history is not yet critical
- Schema drift is tracked by Prisma but no SQL files are generated

`prisma migrate deploy` (for production):
- Applies pending migration files sequentially
- Idempotent — safe to run in CI/CD pipelines
- Requires `DIRECT_URL` (non-pooled) to avoid the advisory lock issue

Both `DATABASE_URL` (pooled, for runtime queries) and `DIRECT_URL` (non-pooled, for migrations) are configured in `server/.env` and `schema.prisma`.

---

## Consequences

- Prisma client must be regenerated (`prisma generate`) after every schema change.
- On Windows, the running dev server holds a file lock on the generated Prisma client DLL. The dev server must be stopped before running `prisma generate`.
- The `bytea` column type in PostgreSQL (Prisma `Bytes`) is used for image storage. Image data is read entirely into memory during upload and download — appropriate for images ≤5 MB.
- Prisma does not support all PostgreSQL features (e.g. partial indices, materialized views). These can be added via raw SQL in migration files if needed.
