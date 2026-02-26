# Deployment Guide

## Architecture for Production

```mermaid
graph TD
    Internet["Internet"]
    Proxy["Reverse Proxy — nginx / Caddy<br/>────────────────────────────<br/>TLS termination (HTTPS :443)<br/>Serves client/dist static files<br/>Proxies /api/* → Node server<br/>Proxies /socket.io/* → Node server<br/>(with WebSocket upgrade headers)"]
    Node["Node.js Server — port 3000<br/>────────────────────────────<br/>Express REST API<br/>Socket.IO WebSocket Server"]
    DB[("PostgreSQL<br/>Neon cloud / managed DB<br/>────────────────────────────<br/>Application data<br/>Image blobs (bytea)")]

    Internet -->|"HTTPS :443"| Proxy
    Proxy -->|"HTTP :3000"| Node
    Node -->|"SQL over TLS"| DB
```

The client is a static SPA (`index.html` + JS bundles). In production it can be served directly from the Node server, a CDN, or a reverse proxy. All API and WebSocket traffic goes to the Node server.

---

## Environment Variables (Production)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Pooled PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `DIRECT_URL` | Direct (non-pooled) connection for migrations | `postgresql://user:pass@direct-host/db?sslmode=require` |
| `JWT_SECRET` | Random 32+ character secret — **never reuse dev value** | `openssl rand -hex 32` |
| `PORT` | Port the server listens on | `3000` |
| `CLIENT_ORIGIN` | The HTTPS URL where the client is served | `https://chat.example.com` |
| `NODE_ENV` | Must be `production` | `production` |

Setting `NODE_ENV=production` enables:
- `Secure` flag on the `token` cookie (HTTPS only)
- Potentially stricter error handling

---

## Build

```bash
# From repo root
npm run build
```

This produces:
- `server/dist/` — compiled Node.js server
- `client/dist/` — Vite production bundle (static HTML/JS/CSS)

---

## Database Migration

Run the schema push against the production database **before** starting the server:

```bash
cd server
DATABASE_URL="<prod-pooled-url>" DIRECT_URL="<prod-direct-url>" npx prisma db push
```

Or with migration files for controlled rollouts:

```bash
DATABASE_URL="<prod-direct-url>" npx prisma migrate deploy
```

> `migrate deploy` applies pending migration files in order and is safe to run in CI/CD pipelines.

---

## Starting the Server

```bash
cd server
node dist/index.js
```

Or with a process manager:

```bash
# PM2
pm2 start dist/index.js --name chatter-server

# systemd
ExecStart=/usr/bin/node /opt/chatter/server/dist/index.js
```

---

## Serving the Client

**Option A — Express static middleware (simplest)**

Add to `server/src/app.ts` before the routes:

```ts
import path from 'path';
app.use(express.static(path.join(__dirname, '../../../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
});
```

**Option B — nginx (recommended for production)**

```nginx
server {
  listen 443 ssl;
  server_name chat.example.com;

  # TLS config ...

  # Serve static assets
  root /opt/chatter/client/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy API and WebSocket
  location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
  }

  location /socket.io/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
}
```

**Option C — Caddy (automatic HTTPS)**

```
chat.example.com {
  handle /api/* {
    reverse_proxy localhost:3000
  }
  handle /socket.io/* {
    reverse_proxy localhost:3000
  }
  handle {
    root * /opt/chatter/client/dist
    try_files {path} /index.html
    file_server
  }
}
```

---

## Docker (optional)

A `Dockerfile` for the server:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/prisma ./prisma
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## Health Check

The server exposes `GET /api/health` → `{ "status": "ok" }`. Use this for:
- Load balancer health probes
- Container readiness checks (`/healthcheck` in Docker Compose)
- Uptime monitoring (UptimeRobot, Better Uptime)

---

## Production Checklist

- [ ] `JWT_SECRET` is a cryptographically random 32+ character string
- [ ] `NODE_ENV=production` is set (enables `Secure` cookie flag)
- [ ] `CLIENT_ORIGIN` matches the exact HTTPS URL (no trailing slash)
- [ ] Database is running and reachable from the server
- [ ] `prisma db push` (or `migrate deploy`) has been run against the production DB
- [ ] HTTPS is configured at the reverse proxy — never serve chat over plain HTTP
- [ ] Firewall: only port 443 (HTTPS) and 22 (SSH) are publicly accessible; port 3000 is internal only
- [ ] Process manager (PM2, systemd) is configured to restart the server on crash
- [ ] Log aggregation is set up (stdout from Node → journald / CloudWatch / Datadog)
- [ ] Database backups are enabled (Neon provides automatic daily backups on all tiers)

---

## Scaling Considerations

The current architecture is single-node. To scale horizontally:

1. **Socket.IO Redis adapter** — Socket.IO broadcasts only within a single Node process. Install `@socket.io/redis-adapter` and point it at a shared Redis instance. This allows any node to broadcast to users connected to any other node.

2. **External image storage** — Replace DB-stored images with a CDN-backed object store (AWS S3, Cloudflare R2). Change `uploadRoutes.ts` to upload to the bucket and return a CDN URL. The `[img]<url>` message format does not need to change.

3. **Rate limiter Redis store** — Replace the in-memory rate limiter store with `rate-limit-redis` so limits are shared across all processes.

4. **Read replicas** — For read-heavy workloads, configure Prisma to use a read replica for `findMany` queries (message history, room lists). Neon supports read replicas.

5. **CDN for static assets** — Put the `client/dist` build behind a CDN edge network (Cloudflare, CloudFront) for lower latency globally.
