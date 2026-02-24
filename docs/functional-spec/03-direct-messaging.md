# Functional Spec 03 — Direct Messaging

## Overview

Direct Messages (DMs) are one-on-one private conversations between any two registered users. Unlike rooms, DMs have no explicit join/leave lifecycle — a conversation is initiated by sending the first message and persists indefinitely.

---

## 1. User Discovery

### FR-DM-001 — User Search

Any authenticated user SHALL be able to search for other users by username. The search:
- Is case-insensitive
- Matches on partial username (prefix or substring)
- Returns up to 20 results
- Excludes the current user from results

### FR-DM-002 — Search Input

The search is triggered from the `+` button in the "Direct Messages" sidebar section. Clicking it SHALL open a search input/modal.

### FR-DM-003 — Search Result Display

Each result SHALL show:
- The user's avatar (generated initial or uploaded avatar)
- The user's username

### FR-DM-004 — Initiating a DM

Clicking a search result SHALL:
- Close the search modal
- Set the active view to a DM conversation with the selected user
- Open the DM window (even if no messages have been exchanged yet)

---

## 2. DM Conversation Window

### FR-DM-005 — DM Window Header

The DM window header SHALL display:
- The partner's avatar
- The partner's username

### FR-DM-006 — Empty Conversation State

GIVEN a user opens a DM with someone they have never messaged:
- The message area SHALL show: "Start a conversation with {username}"
- The message input SHALL be available and focusable

### FR-DM-007 — Conversation History Loading

GIVEN a user opens a DM with a previous conversation:
- The system SHALL show a **message skeleton** while history is being fetched
- Once loaded, the most recent messages SHALL be visible with the scroll position at the bottom

### FR-DM-008 — Message History Caching

Once a conversation's history has been loaded, it SHALL be cached in the Zustand store. Re-opening the same DM conversation during the same session SHALL NOT trigger a second API request.

---

## 3. Sending Direct Messages

### FR-DM-009 — Send Action

A user SHALL be able to send a message to the partner by:
- Typing in the message input and pressing **Enter** (without Shift)
- Typing in the message input and clicking the **Send** button

### FR-DM-010 — Real-time Delivery

GIVEN user A sends a DM to user B:
- The message SHALL appear in user A's conversation view immediately
- The message SHALL appear in user B's conversation view in real time via Socket.IO, **regardless of which view user B currently has open**

This is the "background DM delivery" requirement. The server emits `dm:message` to user B's personal socket room (`user:<userId>`) which is always subscribed.

### FR-DM-011 — Own Message Display

Sent messages SHALL appear right-aligned in the sender's conversation view, visually distinguished from received messages (different background colour).

### FR-DM-012 — Message Authorship

The system SHALL correctly attribute messages regardless of who sent and who received. The key rule: messages are stored under the **partner's ID**, not the sender's ID, in the client store:

```
key = (message.sender.id === currentUser.id)
      ? message.receiver.id
      : message.sender.id
```

---

## 4. Receiving Direct Messages

### FR-DM-013 — Background Delivery

GIVEN user A is viewing a room when user B sends them a DM:
- The message SHALL be stored in the Zustand `dmMessages[partnerId]` store
- If user A navigates to the DM with B, the message SHALL already be visible (no re-fetch needed)

### FR-DM-014 — No Unread Badge (v1.0)

In v1.0, there is no unread message count or notification badge on the DM list. This is deferred to v1.1.

---

## 5. Conversation List

### FR-DM-015 — Sidebar Conversations

The sidebar SHALL display a list of all users the current user has exchanged at least one message with. This list SHALL:
- Be sorted by most recent message (descending)
- Show each partner's avatar and username
- Highlight the currently active conversation

### FR-DM-016 — Conversation List Loading

While the conversation list is being fetched on app load, the sidebar SHALL display **3 skeleton items** (with avatar placeholders).

### FR-DM-017 — Empty Conversation List

GIVEN the user has no DM conversations:
- The sidebar SHALL display: "No DMs yet"
- The `+` button SHALL still be accessible to start a new conversation

### FR-DM-018 — Conversation Persistence

The conversation list is derived from message history. A conversation will always appear in the list as long as any message exists between the two users.

---

## 6. Load More (History Pagination)

### FR-DM-019 — Load Older Messages

GIVEN the user scrolls to the top of the DM conversation:
- The system SHALL automatically fetch the next batch of older messages
- Fetched messages SHALL be prepended to the top of the conversation
- The scroll position SHALL be maintained (the user SHALL NOT be scrolled away from their current reading position)

### FR-DM-020 — Pagination Cursor

The pagination cursor is the `createdAt` timestamp of the oldest currently loaded message. The server returns messages older than this cursor, up to 50 per request.

### FR-DM-021 — End of History

When the server returns fewer than 50 messages (indicating there are no more older messages), the `loadMore` function SHALL still complete silently. No "end of history" UI indicator is required in v1.0.

---

## 7. Typing Indicators

### FR-DM-022 — Sending a Typing Indicator

GIVEN the user is typing in the DM input:
- A `dm:typing { receiverId, isTyping: true }` socket event SHALL be emitted
- This event SHALL be debounced: after the user stops typing for **2 seconds**, a `dm:typing { isTyping: false }` event SHALL be emitted automatically

### FR-DM-023 — Receiving a Typing Indicator

GIVEN the partner is typing:
- A typing animation ("three bouncing dots") SHALL appear below the message list
- The text "{partnerUsername} is typing…" SHALL appear alongside the dots
- When `isTyping: false` is received, the indicator SHALL disappear

---

## Acceptance Criteria Summary

| ID | Scenario | Expected Outcome |
|---|---|---|
| AC-DM-01 | Search for a user by partial username | Matching users listed (up to 20) |
| AC-DM-02 | Click search result | DM window opens; input available |
| AC-DM-03 | Send first message to new contact | Message appears; conversation added to list |
| AC-DM-04 | Receive DM while in a room | Message silently stored; visible when DM opened |
| AC-DM-05 | Open existing DM conversation | Skeleton shown, then history rendered |
| AC-DM-06 | Re-open same DM in session | No re-fetch; instant render from cache |
| AC-DM-07 | Scroll to top of DM | Older messages loaded and prepended |
| AC-DM-08 | Partner types | Typing indicator appears |
| AC-DM-09 | Partner stops typing (2s) | Indicator disappears |
| AC-DM-10 | App loads | Sidebar shows skeleton then conversation list |
