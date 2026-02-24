# ADR-008: Inline Image Encoding in Message Content

**Status:** Accepted
**Date:** 2025-01-15

---

## Context

After implementing image uploads, a usability requirement emerged: users expect to be able to **attach an image and type a caption in the same message**, with both appearing in a single bubble.

Options considered to support image + text in one message:

1. **Separate DB columns** — add `imageUrl: String?` and keep `content: String?` in the `Message` model
2. **JSON content** — store `content` as a JSON string: `{ "text": "caption", "imageUrl": "/api/images/abc" }`
3. **Inline encoding** — encode image references directly in the content string using a prefix convention: `[img]/api/images/abc\ncaption text`
4. **New message type field** — add `type: 'text' | 'image' | 'image_with_caption'` enum + conditional columns

---

## Decision

Use **inline encoding** in the message content string with the format:

```
[img]<imageUrl>
<optional caption text>
```

Examples:
- Image only: `[img]/api/images/climg1abc`
- Image + caption: `[img]/api/images/climg1abc\nHello everyone!`
- Plain text: `Hello everyone!` (no prefix — no parsing overhead)

---

## Rationale

**Why not separate DB columns:**
- Requires a database schema migration (`ALTER TABLE`).
- Every query that selects messages must now handle `content` being nullable and `imageUrl` being nullable.
- The `Message` type on the client grows more complex.
- Socket.IO event payloads grow a field.

**Why not JSON content:**
- Still requires `content` to be treated as opaque by everything except the renderer.
- Adds a JSON parse step on every message render.
- Makes text messages unnecessarily verbose: `{"text":"hi"}` instead of `"hi"`.
- JSON strings in SQL are harder to inspect/debug than plain text.

**Why not type enum + conditional columns:**
- Most complex option — adds a column, requires migration, and forces every message consumer to branch on `type`.

**Why inline encoding:**
- **Zero schema change** — `content: String` stays as-is. Existing messages and the DB are unaffected.
- **Backward compatible** — any message without the `[img]` prefix is rendered as plain text exactly as before.
- **Single network payload** — the image URL and caption travel in one string across HTTP and Socket.IO.
- **Simple parser** — `parseContent()` is 8 lines of TypeScript that handles all three cases.
- **Debuggable** — the raw content string is human-readable in DB queries and logs.

The `[img]` prefix was chosen because it is:
- Unlikely to appear in normal user text
- Self-describing when reading raw DB data
- Easy to detect with `String.prototype.startsWith`

---

## Parser Implementation

```ts
// client/src/components/chat/MessageBubble.tsx
function parseContent(content: string): { imageUrl: string | null; text: string | null } {
  if (content.startsWith('[img]')) {
    const rest = content.slice('[img]'.length);
    const newline = rest.indexOf('\n');
    if (newline === -1) return { imageUrl: rest, text: null };
    return {
      imageUrl: rest.slice(0, newline),
      text: rest.slice(newline + 1) || null,
    };
  }
  return { imageUrl: null, text: content };
}
```

---

## Encoder (MessageInput)

```ts
// On submit with a pending image
const content = caption.trim()
  ? `[img]${pendingImageUrl}\n${caption.trim()}`
  : `[img]${pendingImageUrl}`;
```

---

## Consequences

- **Content validation:** The server does not validate the `[img]` format — it stores whatever string the client sends. A malicious client could craft a `[img]` message pointing to an external URL. The renderer would fetch and display that external image. Mitigation: server-side validation of the `[img]` format and/or a Content Security Policy `img-src` allowlist restricted to the same origin.
- **Search:** Full-text search on `content` would need to strip the `[img]...` prefix for image messages. Not currently implemented.
- **Future richness:** If richer content types are needed (polls, code blocks, embeds), this approach would need to be replaced with a structured format (e.g. a minimal subset of ProseMirror's JSON schema or Markdown). The inline encoding convention is pragmatic for the current feature set.
