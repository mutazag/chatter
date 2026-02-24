# Product Requirements Document — Chatter

**Version:** 1.0
**Status:** Approved
**Last Updated:** 2025-01-01

---

## 1. Executive Summary

Chatter is a real-time web chat application that enables users to communicate through public and private rooms as well as one-on-one direct messages. It provides an instant messaging experience — including text, images, and typing indicators — with a clean, dark-themed UI designed for focus.

This document defines the product scope, user needs, success criteria, and feature requirements for the initial version (v1.0).

---

## 2. Problem Statement

Teams and communities lack a self-hosted, lightweight alternative to commercial messaging platforms (Slack, Discord) that:

- Has no external account requirements or third-party data sharing
- Can be deployed on any server with a single database connection string
- Provides a focused messaging experience without feature bloat
- Gives the operator full control over user data and images

Chatter solves this by providing a minimal, full-stack real-time chat platform that any developer can run, own, and extend.

---

## 3. Goals and Non-Goals

### Goals (v1.0)

| # | Goal |
|---|---|
| G-1 | Allow users to register and log in with email and password |
| G-2 | Allow users to create, discover, and join public chat rooms |
| G-3 | Allow users to send and receive messages in rooms in real time |
| G-4 | Allow users to send and receive direct messages to/from any other user |
| G-5 | Allow users to send images (with optional captions) in any conversation |
| G-6 | Show live typing indicators in rooms and DMs |
| G-7 | Persist all messages and images reliably across sessions and page refreshes |
| G-8 | Provide a polished loading experience (skeleton screens) while data is fetching |

### Non-Goals (v1.0)

| # | Non-Goal | Rationale |
|---|---|---|
| NG-1 | Mobile native application | Web-first; a responsive PWA can follow |
| NG-2 | Voice or video calling | Significant infrastructure; out of scope |
| NG-3 | Message editing or deletion | Adds complexity; planned for v1.1 |
| NG-4 | End-to-end encryption | Requires key management infrastructure |
| NG-5 | Push notifications | Requires a service worker and push subscription flow |
| NG-6 | Message reactions / threads | Future feature |
| NG-7 | User profile editing / avatars | Users get auto-generated avatars; upload planned for v1.1 |
| NG-8 | Admin or moderation tools | No room management beyond create/join/leave |
| NG-9 | Private room invites | Private rooms are visible to creator only; invite system is v1.1 |
| NG-10 | Read receipts | `readAt` is stored but not surfaced in the UI |
| NG-11 | Message search | Not implemented in v1.0 |
| NG-12 | File uploads (non-image) | Image-only in v1.0 |

---

## 4. User Personas

### Persona A — "The Developer"

**Name:** Alex, 28, software engineer
**Context:** Wants a private chat platform for their small team (5–15 people) that they can self-host. Does not want to pay for Slack or hand data to a third party.
**Goals:**
- Get it running with minimal setup (one `npm run dev` command)
- Invite teammates to register directly
- Create topic rooms (#general, #dev, #random)
- Send code snippets and screenshots in chat

**Frustrations:**
- Commercial tools collect data and require business accounts
- Over-engineered open-source alternatives require Kubernetes or complex config

---

### Persona B — "The Community Member"

**Name:** Jordan, 22, gamer and hobbyist
**Context:** A member of a small online community. The community admin has deployed Chatter for group coordination.
**Goals:**
- Join relevant rooms (#general, #off-topic)
- Send and receive messages and images in real time
- Know when others are actively typing
- Start DMs with specific people for private conversation

**Frustrations:**
- Missed messages because the page wasn't open
- Lag between sending and seeing a message appear

---

### Persona C — "The Admin/Operator"

**Name:** Sam, 35, technical team lead
**Context:** Deploys and maintains Chatter for a small organisation. Has access to the server and database.
**Goals:**
- Deploy with a simple `node dist/index.js` + a PostgreSQL connection string
- Know that user data (including images) stays on their own infrastructure
- Be able to back up everything with a standard PostgreSQL dump

**Frustrations:**
- External storage services (S3) add operational overhead and cost
- Applications that require multiple external services just to run

---

## 5. User Stories

### Authentication

| ID | As a… | I want to… | So that… | Priority |
|---|---|---|---|---|
| US-01 | New user | Register with a username, email, and password | I can create my identity on the platform | Must |
| US-02 | Returning user | Log in with my email and password | I can access my conversations | Must |
| US-03 | Logged-in user | Log out | My session is closed on shared devices | Must |
| US-04 | User | Have my session persist across page refreshes | I don't have to log in every time I open the app | Must |

### Rooms

| ID | As a… | I want to… | So that… | Priority |
|---|---|---|---|---|
| US-05 | User | Browse all public rooms | I can discover conversations to join | Must |
| US-06 | User | Join a public room | I can participate in its conversation | Must |
| US-07 | User | Leave a room | It no longer appears in my sidebar | Must |
| US-08 | User | Create a new room with a name and optional description | I can start a new topic area | Must |
| US-09 | User | Create a private room | Only I can see it by default | Should |
| US-10 | User | See rooms I've joined in my sidebar | I can navigate quickly between conversations | Must |

### Messaging — Rooms

| ID | As a… | I want to… | So that… | Priority |
|---|---|---|---|---|
| US-11 | Room member | Send a text message to a room | Others in the room see it instantly | Must |
| US-12 | Room member | See messages from others in real time | I don't have to refresh the page | Must |
| US-13 | Room member | Scroll up to load older messages | I can read conversation history | Must |
| US-14 | Room member | See a typing indicator when someone is typing | I know a reply is coming | Should |
| US-15 | Room member | See who authored each message | I can identify the sender | Must |
| US-16 | Room member | See when a message was sent | I can follow the conversation timeline | Must |

### Direct Messages

| ID | As a… | I want to… | So that… | Priority |
|---|---|---|---|---|
| US-17 | User | Search for other users by username | I can find someone to message | Must |
| US-18 | User | Start a DM with another user | I can have a private conversation | Must |
| US-19 | User | Send and receive DMs in real time | The conversation feels live | Must |
| US-20 | User | See my recent DM conversations in the sidebar | I can return to active conversations | Must |
| US-21 | User | Receive a DM even if I'm in a different conversation | I don't miss messages | Must |
| US-22 | User | See a typing indicator in a DM | I know the other person is responding | Should |

### Images

| ID | As a… | I want to… | So that… | Priority |
|---|---|---|---|---|
| US-23 | User | Attach an image to a message | I can share screenshots and photos | Should |
| US-24 | User | Add a text caption to an image | I can provide context alongside the image | Should |
| US-25 | User | See images rendered inline in the message bubble | The conversation is visually rich | Should |
| US-26 | User | Click an image to view it full size | I can inspect image details | Should |
| US-27 | User | See a shimmer placeholder while an image loads | The layout doesn't jump when images appear | Should |

### Loading and Performance

| ID | As a… | I want to… | So that… | Priority |
|---|---|---|---|---|
| US-28 | User | See skeleton placeholders while the sidebar loads | The UI feels responsive immediately | Should |
| US-29 | User | See skeleton bubbles while message history loads | The transition to content is smooth | Should |
| US-30 | User | Have messages cached when I switch between conversations | Revisiting a room doesn't re-fetch unnecessarily | Should |

---

## 6. Feature List

| Feature | User Stories | Priority | Status |
|---|---|---|---|
| User registration | US-01 | Must | Done |
| User login / logout | US-02, US-03 | Must | Done |
| Session persistence (cookie) | US-04 | Must | Done |
| Room browser | US-05 | Must | Done |
| Join / leave rooms | US-06, US-07 | Must | Done |
| Create room | US-08, US-09 | Must | Done |
| Sidebar room list | US-10 | Must | Done |
| Real-time room messaging | US-11, US-12 | Must | Done |
| Message history + load more | US-13 | Must | Done |
| Room typing indicators | US-14 | Should | Done |
| Message authorship + timestamp | US-15, US-16 | Must | Done |
| User search | US-17 | Must | Done |
| Direct messaging | US-18, US-19 | Must | Done |
| DM conversation list | US-20 | Must | Done |
| Background DM delivery | US-21 | Must | Done |
| DM typing indicator | US-22 | Should | Done |
| Image upload | US-23 | Should | Done |
| Image + caption | US-24 | Should | Done |
| Inline image rendering | US-25 | Should | Done |
| Image lightbox (new tab) | US-26 | Should | Done |
| Image loading shimmer | US-27 | Should | Done |
| Sidebar skeleton loading | US-28 | Should | Done |
| Message history skeleton | US-29 | Should | Done |
| Client-side message caching | US-30 | Should | Done |

---

## 7. Success Metrics

| Metric | Target | Measurement Method |
|---|---|---|
| Message delivery latency | < 200 ms (same region) | Server timestamp vs. received timestamp |
| Page load to interactive | < 2 s on fast 3G | Lighthouse / Chrome DevTools |
| Login success rate | > 99% | Server auth endpoint success/failure rate |
| Image upload success rate | > 99% (within size limit) | Upload endpoint 200 vs. 4xx rate |
| Session restore success | > 99% on valid sessions | `GET /api/auth/me` success rate |
| Client-side crash rate | < 0.1% of page sessions | Browser error tracking |

---

## 8. Constraints

| Type | Constraint |
|---|---|
| Image size | Maximum 5 MB per image |
| Image type | `image/*` only |
| Message pagination | 50 messages per page load / scroll |
| Auth rate limit | 20 login/register attempts per 15 minutes per IP |
| Password minimum length | 6 characters |
| Room name | Must be unique across all rooms |
| Session lifetime | 7 days (JWT expiry); no server-side invalidation |
| Private rooms | Cannot be joined via the public join API |

---

## 9. Assumptions

1. All users self-register; there is no admin-issued invite flow in v1.0.
2. Users are trusted to access any public room; no approval workflow is required.
3. The operator (deployer) is responsible for database backups.
4. A single PostgreSQL database is sufficient for the target scale (< 1,000 concurrent users).
5. The application is accessed via a modern browser (Chrome 120+, Firefox 120+, Safari 17+).
6. The server and client share the same domain in production (reverse proxy serves both).

---

## 10. Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| Node.js | 20.x | Server runtime |
| PostgreSQL | 15+ | Persistent storage |
| React | 19 | Client UI framework |
| Socket.IO | 4.x | Real-time transport |
| Prisma | 6.x | Database ORM |
| Vite | 6.x | Client build tooling |

---

## 11. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DB image storage fills free tier (Neon 0.5 GB) | Medium | Medium | Monitor DB size; migrate images to S3 before limit is reached |
| JWT cannot be invalidated before expiry | Low | Medium | Logout clears client cookie; 7-day window is acceptable |
| Single-node Socket.IO limits horizontal scale | Low (v1.0) | High (at scale) | Document Redis adapter path in architecture docs |
| Rate limiter in-memory state lost on restart | Low | Low | Restart clears the window; Redis store for production |
| Typing indicator storms (many users, one room) | Low | Low | Events are debounced at the client (2s); server broadcasts without accumulation |

---

## 12. Future Work (v1.1+)

| Feature | Notes |
|---|---|
| Message editing and deletion | Soft delete preferred; emit socket event to remove from live views |
| Read receipts | `readAt` column already exists; needs UI indicator |
| File uploads (non-image) | Extend upload endpoint with MIME allowlist |
| User avatar upload | Same upload pipeline; store URL in User.avatarUrl |
| Private room invite system | Invite tokens or username-based invites |
| Message search | Full-text index on `Message.content`; strip `[img]` prefix |
| Message reactions | New `Reaction` table; emoji selector in bubble hover state |
| Threaded replies | `parentMessageId` FK; nested view in right-side panel |
| Push notifications | Service worker + Web Push API |
| Mobile-responsive layout | Sidebar drawer on small screens |
| Admin panel | User management, room moderation, system stats |
