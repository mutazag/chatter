# ADR-007: Cursor-based Pagination for Message History

**Status:** Accepted
**Date:** 2025-01-01

---

## Context

Chat rooms and DM threads can accumulate thousands of messages. Loading all messages upfront is impractical. We need a pagination strategy for the `GET /api/rooms/:id/messages` and `GET /api/dms/:userId/messages` endpoints.

Options considered:

1. **Offset/limit pagination** — `?page=2&limit=50` or `?offset=100&limit=50`
2. **Cursor-based pagination** — `?before=<timestamp>&limit=50`
3. **Keyset pagination** — `?before_id=<messageId>&limit=50`

---

## Decision

Use **cursor-based pagination with `createdAt` timestamps** as the cursor.

---

## Rationale

**Why not offset pagination:**
- Offset pagination is unstable under concurrent inserts. If 5 new messages arrive between fetching page 1 and page 2, the offset shifts and some messages are skipped or duplicated.
- Chat messages are inserted frequently by multiple users. Offset drift is a real problem.
- `OFFSET N` in SQL requires the database to scan and discard the first N rows, which is O(N) and increasingly slow as the user scrolls back through history.

**Why not keyset by ID:**
- cuid-based IDs are not monotonically ordered in a way that the database can use for range queries without additional index. Timestamps with an index are more natural.
- The `createdAt` timestamp is already displayed in the UI, making it a natural cursor value.

**Why cursor by `createdAt`:**
- The compound index `(roomId, createdAt)` already exists on `Message`. A `WHERE createdAt < $cursor` range query uses this index efficiently — O(log N).
- Stable under concurrent inserts: new messages after the cursor do not affect the paginated result.
- The client passes the `createdAt` of the oldest loaded message as the cursor (`?before=2025-01-01T10:00:00.000Z`), and the server returns the next batch of older messages.

---

## Query Pattern

```sql
SELECT * FROM "Message"
WHERE "roomId" = $roomId
  AND "createdAt" < $cursor   -- cursor
ORDER BY "createdAt" DESC
LIMIT 50;
```

The results are reversed to chronological order before being sent to the client (or the client reverses them), so messages render oldest-at-top.

---

## Client Integration

In `useMessages` and `useDMs`, the `loadMore` function:
1. Takes the oldest loaded message: `messages[0]`.
2. Calls `getRoomMessages(roomId, oldest.createdAt)` with the cursor.
3. Prepends the returned batch to the message list: `prependRoomMessages(roomId, older)`.
4. The scroll container maintains position thanks to CSS `overflow-y: auto` — the new messages appear above without scrolling the user away from their current position.

---

## Consequences

- **Duplicate cursor risk:** If two messages have the exact same `createdAt` millisecond, the cursor may skip or duplicate them. In practice, messages from the same millisecond from different users are extremely rare. A composite cursor `(createdAt, id)` would be perfectly precise but adds query complexity not yet warranted.
- **No total count:** Cursor-based pagination does not provide a total message count. The UI uses infinite scroll (load more on scroll to top) rather than page numbers, so no count is needed.
- **No "jump to page N":** Users can only scroll backwards through history continuously. Jumping to a specific date requires a different query (not yet implemented).
