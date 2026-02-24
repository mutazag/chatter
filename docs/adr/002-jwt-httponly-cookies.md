# ADR-002: JWT Stored in httpOnly Cookies

**Status:** Accepted
**Date:** 2025-01-01

---

## Context

We need a stateless authentication mechanism for both the REST API and the Socket.IO WebSocket connection. The three common options are:

1. **JWT in `localStorage`** — token sent manually in `Authorization: Bearer` header
2. **JWT in a JavaScript-readable cookie** — accessible to JS, can be read and sent manually
3. **JWT in an httpOnly cookie** — set by the server, sent automatically, not accessible to JS
4. **Server-side sessions** — session ID in cookie, session data in Redis/DB

---

## Decision

We store the JWT in an **httpOnly, SameSite=Strict cookie**.

---

## Rationale

**Security advantages over `localStorage`:**
- `localStorage` is accessible to any JavaScript running on the page. A successful XSS attack can exfiltrate the token and establish a persistent session. An httpOnly cookie cannot be read by JavaScript at all.
- The `SameSite=Strict` attribute prevents the cookie from being sent on cross-site requests, which provides CSRF protection without requiring a separate CSRF token.

**Why not server-side sessions:**
- Sessions require server-side state storage (Redis, DB), adding operational complexity.
- JWTs are stateless — they carry their own payload and can be verified without a DB lookup. This is preferable for a horizontally scalable system.
- The tradeoff is that JWTs cannot be invalidated before expiry without a denylist, but for this application the 7-day TTL is acceptable.

**WebSocket compatibility:**
- The browser automatically includes cookies in the WebSocket upgrade request. This means the Socket.IO connection is authenticated using the same token without any extra client-side work.
- The `socketAuth` middleware manually parses the `Cookie` header from the WebSocket handshake to extract the token.

---

## Consequences

- The client must set `withCredentials: true` (Axios) or `credentials: 'include'` (fetch) on all cross-origin requests during development.
- The server must configure CORS with `credentials: true` and an explicit `origin` allowlist (wildcard `*` is incompatible with credentialed requests).
- Logout is implemented by clearing the cookie server-side (`maxAge: 0`). The JWT itself remains technically valid until its `exp` claim; a Redis denylist would be needed to truly invalidate it immediately.
- The `Secure` flag is set in production only. In development over `http://localhost`, the browser still sends the cookie because localhost is treated as a secure context.
