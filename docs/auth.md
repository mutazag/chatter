# Authentication & Security

## Authentication Flow

```
┌────────┐      POST /api/auth/login        ┌────────────────┐
│ Client │  ──────────────────────────────► │    Server      │
│        │  { email, password }             │                │
│        │                                  │ 1. bcrypt.compare(password, hash)
│        │                                  │ 2. jwt.sign({ userId, username })
│        │  ◄──────────────────────────────  │                │
│        │  Set-Cookie: token=<jwt>         │                │
│        │  { id, username, email }         └────────────────┘
│        │
│        │   (subsequent requests)
│        │
│        │  GET /api/auth/me  + Cookie: token=<jwt>
│        │  ──────────────────────────────────────►
│        │                                  requireAuth middleware:
│        │                                  1. Parse token cookie
│        │                                  2. jwt.verify(token)
│        │                                  3. getUserById(payload.userId)
│        │                                  4. req.user = user
│        │  ◄──────────────────────────────
│        │  { id, username, email, avatarUrl }
└────────┘
```

### Registration

1. Client submits `POST /api/auth/register` with `{ username, email, password }`.
2. Server checks uniqueness of `email` and `username`.
3. Password is hashed with `bcrypt` at **12 rounds**.
4. User record is created in PostgreSQL.
5. A signed JWT is created and sent as an httpOnly cookie.
6. The user object (without password) is returned in the response body.

### Login

1. Client submits `POST /api/auth/login` with `{ email, password }`.
2. Server looks up the user by email.
3. `bcrypt.compare(plaintext, hash)` — timing-safe comparison.
4. On success, a new JWT is signed and set as an httpOnly cookie.

### Session Restoration

On every page load, `AuthContext` calls `GET /api/auth/me`. If a valid `token` cookie exists, the server returns the user object and the client restores the session without requiring a re-login.

### Logout

`POST /api/auth/logout` clears the `token` cookie by setting `maxAge: 0`. The cookie is removed from the browser immediately.

---

## JWT Details

| Property | Value |
|---|---|
| Algorithm | HS256 (HMAC-SHA256) |
| Payload | `{ userId, username, email }` |
| Expiration | 7 days (`expiresIn: '7d'`) |
| Secret | `JWT_SECRET` env variable (min 16 chars, validated by Zod on startup) |
| Storage | httpOnly cookie |

The JWT is **never** exposed to JavaScript. It cannot be read by `document.cookie` or `localStorage`. This eliminates the largest class of XSS-based token theft.

---

## Cookie Security Attributes

```
Set-Cookie: token=<jwt>
  HttpOnly          ← inaccessible to JavaScript
  SameSite=Strict   ← not sent on cross-site requests (CSRF protection)
  Path=/
  Max-Age=604800    ← 7 days
  Secure            ← set in production (NODE_ENV=production) only
```

`SameSite=Strict` means the cookie is only sent when navigating directly to the site (not from an external link or form submission on another domain), which effectively prevents CSRF attacks without needing a CSRF token.

---

## Socket.IO Authentication

WebSocket connections are authenticated using the same mechanism:

1. The browser sends the `token` cookie in the WebSocket upgrade request headers automatically.
2. The `socketAuth` middleware (`server/src/socket/socketAuth.ts`) runs on every new socket connection before any event handler.
3. It manually parses the raw `Cookie` header (WebSocket handshakes do not go through Express cookie-parser).
4. It calls `authService.verifyToken(token)` and `getUserById(payload.userId)`.
5. The user is attached to `socket.data.user`.
6. If any step fails, `next(new Error('UNAUTHORIZED'))` rejects the connection.

This ensures all socket event handlers can trust `socket.data.user` without additional checks.

---

## Authorization

### REST endpoints

All routes except `/api/auth/login`, `/api/auth/register`, `/api/health`, and `GET /api/images/:id` require the `requireAuth` middleware.

### Room message access

Sending or reading room messages requires the user to be a member of the room:

```ts
// roomHandlers.ts — room:message
const membership = await roomService.isRoomMember(user.id, roomId);
if (!membership) return;  // silently drop
```

```ts
// roomController.ts — GET /api/rooms/:id/messages
const isMember = await roomService.isRoomMember(req.user.id, req.params['id']);
if (!isMember) return res.status(403).json({ message: 'Not a member' });
```

### Private rooms

Private rooms cannot be joined via `POST /api/rooms/:id/join`. The controller returns 403 if `room.isPrivate === true`. This means private rooms are currently invite-only (future: invite system).

---

## Rate Limiting

Authentication endpoints are protected by `express-rate-limit`:

```ts
// server/src/middleware/rateLimiter.ts
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                    // requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
```

Applied to: `POST /api/auth/login` and `POST /api/auth/register`.

The current implementation uses **in-memory storage**. In a multi-process or multi-node deployment, the store must be replaced with a Redis-backed store to share state across processes.

---

## Password Hashing

Passwords are hashed with `bcrypt` at **12 rounds** (work factor 2^12 = 4096 iterations):

```ts
const hash = await bcrypt.hash(password, 12);
```

12 rounds is a deliberate balance: strong enough to resist brute-force attacks (each attempt takes ~250ms on commodity hardware) while remaining acceptable for login latency.

The raw password is never stored, logged, or returned from any endpoint.

---

## CORS Policy

CORS is configured with a strict origin allowlist:

```ts
cors({
  origin: env.CLIENT_ORIGIN,   // e.g. http://localhost:5173
  credentials: true,           // allow cookies
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
})
```

`credentials: true` is required for the browser to send the `token` cookie on cross-origin requests (during development, when client and server run on different ports).

---

## HTTP Security Headers

Helmet is applied with a custom Content Security Policy:

```ts
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'ws:'],
    },
  },
})
```

This allows:
- Images from the same origin (served images) and `data:` URIs (avatar initials)
- WebSocket connections (`ws:`) for Socket.IO
- Blocks loading scripts, styles, or frames from external origins

---

## Environment Variable Validation

At startup, all required environment variables are validated with Zod:

```ts
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET:   z.string().min(16),
  PORT:         z.coerce.number().default(3000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
});
```

The server exits with a clear error message if any required variable is missing or malformed. This prevents silent failures from misconfiguration in production.

---

## Security Checklist

| Concern | Mitigation |
|---|---|
| XSS token theft | JWT in httpOnly cookie — not accessible to JS |
| CSRF | `SameSite=Strict` cookie attribute |
| Password leaks | Passwords never returned; bcrypt 12 rounds at rest |
| Brute-force login | Rate limiter: 20 requests / 15 min per IP |
| Unauthorised WebSockets | `socketAuth` middleware validates JWT on every connection |
| Unauthorised room access | Membership check on every message send/read |
| Clickjacking | Helmet sets `X-Frame-Options: DENY` by default |
| MIME sniffing | Helmet sets `X-Content-Type-Options: nosniff` |
| Information leakage | Generic error messages; no stack traces in responses |
| Misconfiguration | Zod env validation exits early with a clear message |
