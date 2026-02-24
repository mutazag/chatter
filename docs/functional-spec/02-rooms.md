# Functional Spec 02 — Rooms

## Overview

Rooms are named, persistent chat spaces that multiple users can join. They are the primary group communication mechanism. Rooms can be public (discoverable and joinable by anyone) or private (only accessible to members added by the creator).

---

## 1. Room Data Model

### FR-RM-001 — Room Properties

Every room SHALL have:
- **Name** — unique, human-readable identifier (e.g. `general`)
- **Description** — optional text explaining the room's purpose
- **Privacy** — public or private
- **Creator** — the user who created the room
- **Member list** — the set of users who have joined

### FR-RM-002 — Room Name Uniqueness

Room names SHALL be unique across all rooms (case-sensitive). Attempting to create a room with a name that already exists SHALL return an error.

---

## 2. Room Discovery

### FR-RM-003 — Public Room List

The system SHALL maintain a list of all public rooms. Any authenticated user SHALL be able to browse this list regardless of whether they are a member.

### FR-RM-004 — Room Browser Display

The room browser SHALL show for each room:
- Room name (bold)
- Description (muted, if present)
- Member count

### FR-RM-005 — Already-joined Filter

Rooms the current user has already joined SHALL be excluded from the "browse" list, since they already appear in the sidebar. (Implementation note: the API returns all public rooms with an `isMember` flag; the UI filters by `!isMember`.)

### FR-RM-006 — Private Rooms Not Discoverable

Private rooms SHALL NOT appear in the public room browser or in the `GET /api/rooms` API response. They are only accessible to their members.

---

## 3. Joining a Room

### FR-RM-007 — Join Action

GIVEN a user clicks "Join" on a room in the browser:
- The server SHALL add the user to the room's member list
- The room SHALL immediately appear in the user's sidebar
- The active view SHALL switch to the newly joined room

### FR-RM-008 — Idempotent Join

If a user is already a member and a join request is made (e.g. two rapid clicks), the server SHALL accept it silently (upsert semantics) without creating a duplicate membership.

### FR-RM-009 — Private Room Join Blocked

Attempting to join a private room via `POST /api/rooms/:id/join` SHALL return HTTP 403 regardless of who the requester is.

---

## 4. Leaving a Room

### FR-RM-010 — Leave Action

A user SHALL be able to leave any room they are a member of. On leaving:
- The membership record SHALL be deleted
- The room SHALL be removed from the user's sidebar immediately
- If the user is currently viewing the room, the view SHALL switch to the welcome screen

### FR-RM-011 — Creator Leave

There is no special restriction on the creator leaving a room. The room persists even if the creator leaves. (The room is only deleted if the room itself is deleted — not implemented in v1.0.)

---

## 5. Room Creation

### FR-RM-012 — Create Room Form

The create room form SHALL include:
- **Name** (required) — text input
- **Description** (optional) — text input
- **Private** (optional) — checkbox, default unchecked

### FR-RM-013 — Successful Creation

GIVEN a user submits a valid name:
- The room SHALL be created
- The creator SHALL be automatically added as a member
- The modal SHALL close
- The room SHALL appear in the user's sidebar
- The active view SHALL switch to the new room

### FR-RM-014 — Duplicate Name Error

GIVEN a user submits a name that already exists:
- The server SHALL return HTTP 409
- The form SHALL display an inline error: "A room with this name already exists"
- The modal SHALL remain open so the user can correct the name

### FR-RM-015 — Empty Name Validation

The form SHALL prevent submission with an empty name field. This SHALL be validated client-side before making a network request.

---

## 6. Sidebar Room List

### FR-RM-016 — Sidebar Content

The sidebar SHALL show all rooms the current user has joined, sorted by the order they were joined (insertion order from the API).

### FR-RM-017 — Room Item Display

Each room item in the sidebar SHALL show:
- A `#` prefix
- The room name
- An active/highlighted state when that room is the current view

### FR-RM-018 — Skeleton Loading

While the initial room list is being fetched, the sidebar SHALL display **4 skeleton items** (shimmer placeholders) instead of an empty list or a spinner.

### FR-RM-019 — Empty State

GIVEN a user has joined no rooms:
- The sidebar SHALL display: "Join a room to get started"
- The `+` button SHALL still be accessible to browse rooms

### FR-RM-020 — Navigation

Clicking a room item in the sidebar SHALL set that room as the active view and render its `ChatWindow`.

---

## 7. Room Membership Verification

### FR-RM-021 — Message Access Requires Membership

Sending a message or reading message history for a room SHALL require the user to be a member. Non-members attempting these actions SHALL receive HTTP 403.

### FR-RM-022 — Real-time Membership Check

The Socket.IO `room:join` event handler SHALL verify the user is a member before joining the Socket.IO room namespace. An unauthorised `room:message` emit from a non-member SHALL be silently dropped.

---

## Acceptance Criteria Summary

| ID | Scenario | Expected Outcome |
|---|---|---|
| AC-RM-01 | Browse rooms | List of public rooms not yet joined |
| AC-RM-02 | Join a room | Room added to sidebar; view switches to it |
| AC-RM-03 | Attempt to join private room | HTTP 403 |
| AC-RM-04 | Leave a room | Removed from sidebar |
| AC-RM-05 | Create room with valid name | Room created; view switches to it |
| AC-RM-06 | Create room with duplicate name | Inline error; modal stays open |
| AC-RM-07 | Create room with empty name | Client-side error; form not submitted |
| AC-RM-08 | Open app with joined rooms | Sidebar shows skeleton then room list |
| AC-RM-09 | Open app with no rooms | "Join a room to get started" |
| AC-RM-10 | Non-member sends room:message via socket | Message dropped; no delivery |
