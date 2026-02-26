# Chatter — Documentation Index

Chatter is a real-time chat application supporting public/private rooms and direct messaging, built on React 19, Node.js, Socket.IO, and PostgreSQL.

---

## Documents

### Product

| Document | Description |
|---|---|
| [Product Requirements Document](./prd.md) | Vision, personas, user stories, feature list, success metrics, constraints, risks, roadmap |
| [Functional Spec — Index](./functional-spec/README.md) | Index of all functional specifications |
| [FS-01 Authentication](./functional-spec/01-authentication.md) | Registration, login, logout, session management |
| [FS-02 Rooms](./functional-spec/02-rooms.md) | Discovery, creation, membership, sidebar |
| [FS-03 Direct Messaging](./functional-spec/03-direct-messaging.md) | User search, DM conversations, conversation list |
| [FS-04 Messaging](./functional-spec/04-messaging.md) | Composition, sending, receiving, history, typing indicators |
| [FS-05 Image Sharing](./functional-spec/05-image-sharing.md) | Upload, preview, encoding, rendering, loading shimmer |
| [FS-06 Real-time Behaviour](./functional-spec/06-realtime.md) | Socket lifecycle, event guarantees, failure modes |
| [FS-07 UI & UX](./functional-spec/07-ui-ux.md) | Layout, design tokens, components, loading states, accessibility |

### Engineering

| Document | Description |
|---|---|
| [Architecture Overview](./architecture.md) | System design, layers, data-flow diagrams |
| [Data Model](./data-model.md) | Database schema, entity relationships, indices |
| [API Reference](./api-reference.md) | All REST endpoints with request/response shapes |
| [Real-time Events](./realtime-events.md) | Socket.IO event catalogue (client ↔ server) |
| [Frontend Architecture](./frontend.md) | React component tree, state management, hooks |
| [Authentication & Security](./auth.md) | Auth flow, JWT cookies, rate limiting, CORS |
| [Development Guide](./development.md) | Local setup, scripts, environment variables |
| [Deployment Guide](./deployment.md) | Production checklist, environment, database migration |

### Architecture Decision Records (ADRs)

| ADR | Title |
|---|---|
| [ADR-001](./adr/001-monorepo-structure.md) | npm Workspaces Monorepo |
| [ADR-002](./adr/002-jwt-httponly-cookies.md) | JWT Stored in httpOnly Cookies |
| [ADR-003](./adr/003-socketio-realtime.md) | Socket.IO for Real-time Communication |
| [ADR-004](./adr/004-zustand-state-management.md) | Zustand for Client State Management |
| [ADR-005](./adr/005-prisma-postgresql.md) | Prisma ORM with PostgreSQL |
| [ADR-006](./adr/006-image-storage-database.md) | Image Storage in Database (not Filesystem) |
| [ADR-007](./adr/007-cursor-based-pagination.md) | Cursor-based Pagination for Message History |
| [ADR-008](./adr/008-image-message-encoding.md) | Inline Image Encoding in Message Content |
