# ADR-004: Zustand for Client State Management

**Status:** Accepted
**Date:** 2025-01-01

---

## Context

The chat application has significant shared state: the list of rooms, messages per room, DM conversations and messages, typing indicators, and the active view. This state is needed by multiple sibling and distant components (sidebar, chat window, DM window). Options considered:

1. **Prop drilling** — pass state down through the component tree
2. **React Context** — a global context provider with `useContext`
3. **Redux Toolkit** — industry-standard state management
4. **Zustand** — lightweight state management with hooks
5. **Jotai / Recoil** — atomic state management

---

## Decision

We use **Zustand** for all chat-related global state.

We also use **React Context** — but only for the authentication session (`AuthContext`) and the Socket.IO connection lifecycle (`SocketContext`), where the state is simple and rarely changes.

---

## Rationale

**Why not prop drilling:**
- The component tree is 5+ levels deep from `App` to `MessageBubble`. Passing `messages`, `typingUsers`, `sendMessage`, etc. through each level would be unmanageable.

**Why not React Context for chat state:**
- Every component that consumes a Context re-renders whenever any part of that context value changes.
- A single context holding `{ rooms, messages, dmMessages, typingUsers, ... }` would cause the entire component tree to re-render on every new message. This is unacceptable for a chat UI receiving messages at high frequency.
- React Context works well for low-frequency, narrow state — hence its use for `AuthContext` (user changes only on login/logout) and `SocketContext` (socket changes only on connect/disconnect).

**Why Zustand over Redux Toolkit:**
- Redux requires significant boilerplate: actions, reducers, selectors, slices, and a `<Provider>`. For a single-developer project of this scale, the cognitive overhead is not justified.
- Zustand's entire store is defined in a single `create()` call. State and mutations are co-located.
- Zustand supports **selectors** natively: `useChatStore(s => s.rooms)`. Only the subscribed slice triggers a re-render — identical performance to Redux's `useSelector`.

**Why not Jotai/Recoil:**
- Atomic state works well for fine-grained independent atoms (e.g. per-message state). Our state is relational — messages belong to rooms, typing indicators belong to rooms — so a single store with nested objects is more natural.

---

## Store Structure

```ts
interface ChatStore {
  // Navigation
  activeView: ActiveView | null;

  // Rooms
  rooms: Room[];
  roomsLoading: boolean;
  roomMessages: Record<string, Message[]>;
  roomTyping: Record<string, TypingUser[]>;

  // DMs
  conversations: DMConversation[];
  conversationsLoading: boolean;
  dmMessages: Record<string, DirectMessage[]>;
  dmTyping: Record<string, boolean>;

  // Mutations (setters, adders, prependers)
  setActiveView, setRooms, setRoomsLoading, setRoomMessages,
  addRoomMessage, prependRoomMessages, setRoomTyping,
  setConversations, setConversationsLoading, setDMMessages,
  addDMMessage, prependDMMessages, setDMTyping
}
```

---

## Consequences

- Components import `useChatStore` directly — there is no `<Provider>` wrapper. Zustand's store is a module-level singleton.
- Selectors should be specific (`s => s.roomMessages[roomId]`) rather than broad (`s => s`) to avoid over-rendering. This is enforced by code review convention.
- The store is **not persisted** to `localStorage`. On page refresh, data is re-fetched from the server. Adding `zustand/middleware/persist` is straightforward if offline support is needed in the future.
