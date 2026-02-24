# ADR-001: npm Workspaces Monorepo

**Status:** Accepted
**Date:** 2025-01-01

---

## Context

The application has two distinct packages — a React SPA (client) and a Node.js/Express API server — that need to be developed and deployed together. We needed to decide how to organise the repository.

Options considered:
1. **Separate repositories** — client and server in independent Git repos
2. **Single directory** — both packages interleaved in one directory
3. **npm workspaces monorepo** — a root `package.json` that declares workspaces for `client/` and `server/`
4. **Third-party monorepo tooling** — Turborepo, Nx, Lerna

---

## Decision

We use **npm workspaces** with a single repository containing `client/` and `server/` as separate workspace packages, orchestrated by a root `package.json`.

---

## Rationale

**Why monorepo over separate repos:**
- A single `git clone` brings the whole system. No cross-repo coordination for related changes.
- Shared TypeScript types can be added as a third workspace package in the future without any repo restructuring.
- One `npm install` at the root installs all dependencies via hoisting, reducing disk usage.
- A single `npm run dev` at the root starts both packages concurrently.

**Why npm workspaces over third-party tooling:**
- npm workspaces is built into npm 7+ — no extra dependency, no lock-in.
- Turborepo/Nx add significant complexity and are warranted for larger projects with many packages. For two packages, the overhead is not justified.

**Why separate `package.json` per package:**
- Each package has independent dependencies, TypeScript configs, and build scripts.
- The server can be containerised independently (copy `server/` into a Docker image without pulling the client's React dependencies).
- Each package can be published or deployed independently.

---

## Consequences

- A single `npm install` at the root is required; running `npm install` inside `client/` or `server/` directly is not recommended as it may desync the root lock file.
- All workspace-scoped scripts use `npm run <script> --workspace=server` or `--workspace=client`.
- Shared types are currently duplicated between `client/src/types/index.ts` and the server. A future `shared/` workspace package could eliminate this duplication.
