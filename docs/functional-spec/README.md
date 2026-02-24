# Functional Specification — Chatter

**Version:** 1.0
**Status:** Approved
**Last Updated:** 2025-01-01

This directory contains the detailed functional specifications for each feature area of Chatter. Functional specs describe *what* the system does — the exact behaviour, rules, states, and edge cases for every user-facing feature — without prescribing the implementation.

---

## Sections

| Document | Feature Area |
|---|---|
| [01 — Authentication](./01-authentication.md) | Registration, login, logout, session management |
| [02 — Rooms](./02-rooms.md) | Room discovery, creation, membership, sidebar |
| [03 — Direct Messaging](./03-direct-messaging.md) | User search, DM conversations, conversation list |
| [04 — Messaging](./04-messaging.md) | Sending, receiving, history pagination, typing indicators |
| [05 — Image Sharing](./05-image-sharing.md) | Upload, preview, encoding, rendering, loading states |
| [06 — Real-time Behaviour](./06-realtime.md) | Socket connection, event guarantees, failure modes |
| [07 — UI & UX](./07-ui-ux.md) | Layout, navigation, loading skeletons, avatars, empty states |

---

## Notation

Throughout the specs, the following conventions are used:

- **SHALL** — a mandatory requirement
- **SHOULD** — a recommended requirement; may be omitted with justification
- **MAY** — an optional enhancement
- `GIVEN / WHEN / THEN` — acceptance criteria in BDD format
- **FR-XX-NNN** — Functional Requirement identifier (e.g. FR-AU-001 = Auth requirement 1)
