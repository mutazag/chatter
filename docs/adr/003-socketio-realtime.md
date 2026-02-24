# ADR-003: Socket.IO for Real-time Communication

**Status:** Accepted
**Date:** 2025-01-01

---

## Context

Real-time message delivery and typing indicators require a persistent bidirectional connection between the browser and server. Options considered:

1. **Polling** — client polls `GET /messages` every N seconds
2. **Server-Sent Events (SSE)** — server pushes events over a persistent HTTP connection (unidirectional)
3. **Raw WebSockets** — browser `WebSocket` API + `ws` npm package on the server
4. **Socket.IO** — library that wraps WebSockets with fallbacks, rooms, and namespaces

---

## Decision

We use **Socket.IO** (server: `socket.io`, client: `socket.io-client`).

---

## Rationale

**Why not polling:**
- High latency (up to N seconds per message), high server load, wasteful bandwidth. Unacceptable UX for a chat application.

**Why not SSE:**
- SSE is server→client only. We also need client→server events (sending messages, typing indicators). SSE would require a separate HTTP channel for client→server, adding complexity. It also does not support bidirectional acknowledgements.

**Why not raw WebSockets:**
- Raw WebSockets require manual implementation of: reconnection logic, room/channel management, broadcasting, and authentication middleware. Socket.IO provides all of these out of the box.

**Why Socket.IO:**
- **Built-in room abstraction** — `socket.join('room:abc')` / `socket.to('room:abc').emit(...)` replaces a custom pub/sub layer. This is exactly the model needed for chat rooms and user-specific DM delivery.
- **Auto-reconnection** — clients automatically reconnect after network drops without any client-side code.
- **Middleware** — `io.use(socketAuth)` provides an Express-style middleware chain for connection-level authentication.
- **Event-based API** — named events (`room:message`, `dm:send`, etc.) are self-documenting and match the mental model of the application.
- **Fallback transports** — falls back to HTTP long-polling in environments where WebSocket upgrades are blocked (corporate proxies, some CDNs).

---

## Socket Room Design

Two types of Socket.IO rooms are used:

| Room | Name pattern | Members |
|---|---|---|
| Chat room | `room:<roomId>` | Sockets that have called `room:join` |
| User inbox | `user:<userId>` | The single socket for that user (joined on connect) |

The user inbox room (`user:<userId>`) enables DM delivery without the recipient needing to be in a specific conversation view. Any socket event that needs to reach a specific user (DM messages, typing indicators) is emitted to `user:<receiverId>`.

---

## Consequences

- Socket.IO adds ~40 KB to the client bundle (gzipped). This is acceptable for a chat application.
- Scaling beyond a single Node process requires the Socket.IO Redis adapter (`@socket.io/redis-adapter`) to broadcast events across nodes. The current single-node design does not need this.
- The Socket.IO server must be co-located with the HTTP server (same port) or fronted by a sticky-session load balancer, since Socket.IO connections are stateful.
