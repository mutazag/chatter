# Functional Spec 04 — Messaging

## Overview

Messaging covers the core interaction loop: composing, sending, receiving, and rendering text messages in both rooms and direct message conversations. This spec covers the shared behaviour applicable to both contexts; room-specific and DM-specific behaviours are noted where they diverge.

---

## 1. Message Composition

### FR-MSG-001 — Input Component

Both `ChatWindow` (rooms) and `DMWindow` (DMs) SHALL use the same `MessageInput` component. The input SHALL:
- Render as a **multi-line textarea** that grows vertically as content is added
- Have a minimum height of 42px (one line)
- Have a maximum height of 120px (approximately 4 lines); beyond this, the content scrolls inside the textarea
- Match the chat panel width, minus fixed elements (image button and send button)

### FR-MSG-002 — Placeholder Text

The input placeholder SHALL describe the destination:
- Room: `Message #<roomName>`
- DM: `Message <partnerUsername>`

### FR-MSG-003 — Send Button

A send button SHALL appear to the right of the input. It SHALL:
- Be enabled only when the message has non-whitespace content **or** a pending image attachment
- Be disabled (visually dimmed, `cursor: not-allowed`) when both content and image are absent
- Submit the message when clicked

### FR-MSG-004 — Keyboard Shortcut

- **Enter** (without Shift) SHALL submit the message
- **Shift + Enter** SHALL insert a newline in the textarea (multi-line messages)
- **Enter** in an empty input (whitespace only, no image) SHALL do nothing

### FR-MSG-005 — Textarea Reset

After a message is sent (by button click or Enter), the textarea SHALL be cleared and its height SHALL reset to the minimum.

---

## 2. Sending Messages

### FR-MSG-006 — Text Message Send

GIVEN non-empty text in the input and Enter or Send clicked:
- The client SHALL emit the appropriate socket event:
  - Room: `room:message { roomId, content }`
  - DM: `dm:send { receiverId, content }`
- The input SHALL be cleared immediately (optimistic UI)
- The server SHALL persist the message and broadcast it to all relevant subscribers

### FR-MSG-007 — Whitespace-only Guard

The client SHALL trim the content string before checking emptiness. A message consisting only of spaces or newlines SHALL NOT be sent.

### FR-MSG-008 — No Optimistic Rendering

The message SHALL NOT be rendered in the message list until the server broadcasts it back via the socket event. This ensures all messages in the list went through the server and are persisted.

---

## 3. Receiving Messages

### FR-MSG-009 — Real-time Delivery

GIVEN any user sends a message:
- Every connected client subscribed to that room or DM conversation SHALL receive the message via a socket event within the network round-trip time
- The message SHALL be appended to the message list in the correct position (chronologically last)

### FR-MSG-010 — Auto-scroll on New Messages

GIVEN a new real-time message arrives (sent or received):
- The view SHALL automatically scroll to the new message using **smooth** scrolling
- This behaviour applies to both sent messages (own) and received messages (others')
- This is distinct from initial history load, which uses instant scroll (see FR-MSG-017)

### FR-MSG-011 — No Auto-scroll While Reading History

GIVEN the user has scrolled up to read older messages:
- New incoming messages SHALL NOT force-scroll the user back to the bottom
- The message SHALL still be added to the list; only the scroll position is preserved
- (Note: v1.0 does not yet implement this distinction; auto-scroll fires on every new message regardless of scroll position. This is a known limitation to be fixed in v1.1.)

---

## 4. Message Rendering

### FR-MSG-012 — Message Bubble Layout

Each message SHALL be rendered as a bubble containing:
- **Avatar** — circular avatar of the author (left side for others, right side for own)
- **Author name** — displayed above the bubble (only for messages from others, not own)
- **Content** — the message text and/or image
- **Timestamp** — displayed inside the bubble, bottom-right aligned

### FR-MSG-013 — Own vs. Others' Messages

| Property | Own Message | Other's Message |
|---|---|---|
| Horizontal alignment | Right-aligned (`align-self: flex-end`) | Left-aligned |
| Bubble colour | Primary colour (`--primary: #6366f1`) | Surface colour (`--surface2`) |
| Timestamp colour | `rgba(255,255,255,0.6)` | `--text-muted` |
| Author name | Not shown | Shown above bubble |
| Avatar position | Right of bubble | Left of bubble |

### FR-MSG-014 — Timestamp Format

Timestamps SHALL be formatted as `HH:MM` in the user's local timezone using the browser's `toLocaleTimeString` with `{ hour: '2-digit', minute: '2-digit' }`.

### FR-MSG-015 — Text Wrapping

Long words and URLs SHALL wrap within the bubble (`word-break: break-word`). The maximum bubble width SHALL be 80% of the message list container.

### FR-MSG-016 — Multi-line Messages

Newlines in message content SHALL be preserved and rendered as visual line breaks.

---

## 5. Message History

### FR-MSG-017 — Initial History Load

GIVEN a user opens a room or DM conversation for the first time in a session:
- The system SHALL fetch the **50 most recent messages** from the server
- While loading, a **MessageSkeleton** (alternating shimmer bubbles) SHALL be displayed
- Once loaded, the scroll position SHALL **instantly** jump to the bottom (most recent message visible) — no smooth animation on initial load

### FR-MSG-018 — Cached History

GIVEN a user opens a room or DM they have already visited in the current session:
- The message list SHALL render immediately from the Zustand cache
- No network request SHALL be made
- The loading skeleton SHALL NOT flash (isLoading resets to false immediately when cache hit is detected)

### FR-MSG-019 — Load More (Infinite Scroll Up)

GIVEN the user scrolls to the top of the message list (scrollTop < 100px):
- The system SHALL call `loadMore()`
- The oldest currently loaded message's `createdAt` is used as the cursor
- The server SHALL return up to 50 messages older than that cursor
- The older messages SHALL be **prepended** to the top of the list
- The scroll position SHALL not jump (the user remains at approximately the same visual position)

### FR-MSG-020 — Empty Message List

GIVEN a room has no messages at all:
- After loading (no skeleton), the message area SHALL display: "No messages yet. Say hello!"

### FR-MSG-021 — Message Skeleton Pattern

The MessageSkeleton component SHALL render **5 alternating shimmer bubbles** with varying widths to mimic a realistic conversation. The pattern SHALL be:
1. Left (other), 60% width
2. Right (own), 42% width
3. Left (other), 75% width
4. Right (own), 55% width
5. Left (other), 38% width

Each skeleton row SHALL include an avatar circle placeholder. Left-side rows SHALL additionally include a name placeholder above the bubble.

---

## 6. Typing Indicators

### FR-MSG-022 — Debounced Emit

GIVEN the user types in the message input:
- On the **first keystroke**, the client SHALL emit a typing-start event
- After each subsequent keystroke, a **2-second debounce timer** resets
- When the timer fires (2 seconds after the last keystroke), the client SHALL emit a typing-stop event

### FR-MSG-023 — Typing Indicator Display (Rooms)

The typing indicator area SHALL be displayed **below the message list** and **above the input**, occupying a fixed minimum height of 24px to prevent layout shift.

GIVEN one user is typing:
- Display: `<animated dots> <username> is typing…`

GIVEN two users are typing:
- Display: `<dots> Alice and Bob are typing…`

GIVEN three or more users are typing:
- Display: `<dots> Several people are typing…`

GIVEN no one is typing:
- The area SHALL be empty (no text, but height preserved to prevent layout shift)

### FR-MSG-024 — Typing Dots Animation

The animated dots SHALL consist of three circles that bounce up and down in sequence with staggered animation delays:
- Dot 1: 0s delay
- Dot 2: 0.2s delay
- Dot 3: 0.4s delay
- Animation: vertical translate (-4px) on a 1.2s ease-in-out infinite cycle

### FR-MSG-025 — Typing Indicator Display (DMs)

In a DM conversation, the typing indicator SHALL show the partner's typing state:
- Typing: `<dots> <partnerUsername> is typing…`
- Not typing: empty (height preserved)

### FR-MSG-026 — Typing State Storage

Room typing state SHALL be stored in Zustand as:
```
roomTyping: Record<roomId, TypingUser[]>
```
Where each `TypingUser` is `{ userId, username }`.

DM typing state SHALL be stored as:
```
dmTyping: Record<partnerId, boolean>
```

---

## Acceptance Criteria Summary

| ID | Scenario | Expected Outcome |
|---|---|---|
| AC-MSG-01 | Enter in empty input | Nothing happens |
| AC-MSG-02 | Enter with whitespace-only content | Nothing happens |
| AC-MSG-03 | Enter with text | Message sent; input cleared |
| AC-MSG-04 | Shift+Enter | Newline inserted; no send |
| AC-MSG-05 | Message received | Appended to list; scroll to bottom |
| AC-MSG-06 | Open room for first time | Skeleton shown, then 50 messages |
| AC-MSG-07 | Revisit room in session | Instant render; no network request |
| AC-MSG-08 | Scroll to top of message list | Older messages loaded above |
| AC-MSG-09 | Room with no messages | "No messages yet. Say hello!" |
| AC-MSG-10 | Own message | Right-aligned, primary colour |
| AC-MSG-11 | Other's message | Left-aligned, surface colour, name above |
| AC-MSG-12 | One user typing | "Alice is typing…" |
| AC-MSG-13 | Two users typing | "Alice and Bob are typing…" |
| AC-MSG-14 | Three+ users typing | "Several people are typing…" |
| AC-MSG-15 | Stop typing for 2s | Indicator disappears for others |
