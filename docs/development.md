# Development Guide

## Prerequisites

| Tool | Minimum version | Notes |
|---|---|---|
| Node.js | 20.x | LTS recommended |
| npm | 10.x | Ships with Node 20 |
| PostgreSQL | 15+ | Or a hosted service — see below |
| Git | any | |

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd chatter
```

### 2. Install all dependencies

The project uses npm workspaces. A single install from the root installs both `client/` and `server/` packages:

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in values:

```bash
cp .env.example server/.env
```

Edit `server/.env`:

```env
# PostgreSQL connection string
# For Neon (cloud): use the pooled URL here
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# For Neon: also set the direct (non-pooled) URL for migrations
DIRECT_URL="postgresql://user:password@host-direct/dbname?sslmode=require"

# JWT signing secret — minimum 16 characters
JWT_SECRET="change-this-to-a-long-random-secret"

# Server port
PORT=3000

# Vite dev server origin (for CORS)
CLIENT_ORIGIN="http://localhost:5173"

NODE_ENV="development"
```

> **Note:** `DIRECT_URL` is only required when using a connection pooler (like Neon's PgBouncer). It is used by Prisma's schema push/migration commands. If you are running a local PostgreSQL instance without pooling, `DATABASE_URL` and `DIRECT_URL` can be the same value.

### 4. Set up the database

Push the Prisma schema to the database:

```bash
npm run db:push --workspace=server
```

This creates all tables, indices, and constraints without creating a migration file. See [ADR-005](./adr/005-prisma-postgresql.md) for why `db push` is used instead of `migrate dev`.

### 5. Generate the Prisma client

```bash
npm run db:generate --workspace=server
```

This generates the type-safe Prisma client in `node_modules/@prisma/client`. It must be re-run whenever `schema.prisma` changes.

### 6. Start the development servers

```bash
npm run dev
```

This runs both the server (port 3000, hot-reload via `tsx watch`) and the client (port 5173, Vite HMR) concurrently.

Open [http://localhost:5173](http://localhost:5173).

---

## Available Scripts

### Root workspace

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `concurrently ...` | Start client + server in parallel |
| `npm run build` | `npm run build -w server && npm run build -w client` | Production build both packages |

### Server (`npm run <script> --workspace=server`)

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx watch src/index.ts` | Dev server with hot-reload |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run compiled production server |
| `db:push` | `prisma db push` | Push schema changes to DB (no migration file) |
| `db:generate` | `prisma generate` | Regenerate Prisma client |
| `db:migrate` | `prisma migrate dev` | Create and apply a named migration |
| `db:studio` | `prisma studio` | Open Prisma Studio GUI at localhost:5555 |

### Client (`npm run <script> --workspace=client`)

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start Vite dev server with HMR |
| `build` | `tsc -b && vite build` | TypeScript check + production bundle |
| `preview` | `vite preview` | Serve the production build locally |
| `lint` | `eslint .` | Run ESLint |

---

## Database Options

### Local PostgreSQL

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/chatter"
DIRECT_URL="postgresql://postgres:password@localhost:5432/chatter"
```

### Neon (free cloud PostgreSQL)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project (PostgreSQL 16, any region)
3. In the Neon dashboard, find the two connection strings:
   - **Pooled** (`-pooler` subdomain) → `DATABASE_URL`
   - **Direct** (no `-pooler`) → `DIRECT_URL`
4. Use `npm run db:push --workspace=server` (not `db:migrate`) due to advisory lock limitations with the pooler

---

## Project Structure Reference

```mermaid
graph TD
    Root["chatter/"]
    ClientSrc["client/src/"]
    Api["api/<br/>(HTTP wrappers: Axios + fetch)"]
    Components["components/<br/>(UI components grouped by domain)"]
    Context["context/<br/>(AuthContext, SocketContext)"]
    Hooks["hooks/<br/>(Custom React hooks)"]
    Pages["pages/<br/>(Route-level page components)"]
    Store["store/<br/>(Zustand global state)"]
    ClientTypes["types/<br/>(Shared TypeScript interfaces)"]

    ServerSrc["server/src/"]
    Config["config/<br/>(Environment validation: Zod)"]
    Controllers["controllers/<br/>(HTTP request handlers)"]
    Middleware["middleware/<br/>(Auth guard, rate limiter, error handler)"]
    Routes["routes/<br/>(Express router definitions)"]
    Services["services/<br/>(Business logic and DB access)"]
    Socket["socket/<br/>(Socket.IO auth + event handlers)"]
    ServerTypes["types/<br/>(Server-side TypeScript interfaces)"]

    Root --> ClientSrc
    Root --> ServerSrc

    ClientSrc --> Api
    ClientSrc --> Components
    ClientSrc --> Context
    ClientSrc --> Hooks
    ClientSrc --> Pages
    ClientSrc --> Store
    ClientSrc --> ClientTypes

    ServerSrc --> Config
    ServerSrc --> Controllers
    ServerSrc --> Middleware
    ServerSrc --> Routes
    ServerSrc --> Services
    ServerSrc --> Socket
    ServerSrc --> ServerTypes
```

---

## TypeScript

Both packages use strict TypeScript. The shared interfaces live in each package's `src/types/index.ts` — they are not currently shared via a third workspace package, so if you change a type that both sides rely on, update both files.

The server uses `tsx` (TypeScript Execute) in development, which runs `.ts` files directly without a compile step. Production uses `tsc` to compile to `dist/`.

---

## Common Issues

### `EPERM` when running `prisma generate` on Windows

The dev server (`tsx watch`) keeps a file lock on the generated Prisma client. Stop the dev server first, run `db:generate`, then restart.

### `Advisory lock timeout` during `prisma migrate dev` on Neon

Neon's pooler connection does not support advisory locks required by `migrate dev`. Use `db:push` instead, or configure `DIRECT_URL` and run migrate through the direct connection.

### Changes to `schema.prisma` not reflected in TypeScript

Run `npm run db:generate --workspace=server` to regenerate the Prisma client, then restart the dev server.

### Port already in use

If port 3000 or 5173 is occupied, either kill the conflicting process or change `PORT` in `server/.env` and update `CLIENT_ORIGIN` in the client's Vite proxy config (`client/vite.config.ts`).

---

## Recommended Tooling

| Tool | Purpose |
|---|---|
| Prisma VS Code extension | Schema syntax highlighting and DB browser |
| ESLint + Prettier | Code style (ESLint config is already set up in client) |
| React DevTools | Component tree inspection and profiling |
| Postman / Insomnia | Manual API testing (note: you'll need to handle cookie auth) |
| Prisma Studio | Visual DB browser (`npm run db:studio --workspace=server`) |
