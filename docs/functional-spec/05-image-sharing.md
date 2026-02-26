# Functional Spec 05 — Image Sharing

## Overview

Users can attach images to messages in any conversation (rooms or DMs). Images are stored in the database and served via a dedicated endpoint. An optional text caption can accompany the image within the same message bubble.

---

## 1. Image Upload — Input UI

### FR-IMG-001 — Upload Trigger Button

The message input row SHALL include an **image attachment button** (📎 icon) to the left of the textarea. The button SHALL:
- Be styled consistently with other icon buttons in the UI
- Open the OS file picker when clicked
- Be disabled (and visually dimmed) while an upload is already in progress

### FR-IMG-002 — File Picker Constraints

The hidden `<input type="file">` SHALL set:
- `accept="image/*"` — restricts the file picker to image files at the OS level
- No `multiple` attribute — only one image per message

### FR-IMG-003 — Upload on File Select

GIVEN the user selects an image file from the file picker:
- The upload SHALL begin **immediately** (before the user clicks Send)
- The image button SHALL be disabled during the upload
- A visual uploading state SHALL be indicated (spinner or disabled state on the button)

### FR-IMG-004 — Upload Size Limit

The server SHALL reject files larger than **5 MB** with HTTP 400. The client SHALL display an error if the upload fails.

### FR-IMG-005 — Upload Type Validation

The server SHALL reject non-image files (MIME type not matching `image/*`) with HTTP 400. The client-side `accept="image/*"` filter is a UX convenience only; server-side validation is authoritative.

---

## 2. Image Preview in Input

### FR-IMG-006 — Thumbnail Preview

GIVEN an image has been successfully uploaded:
- A **60×60px thumbnail** of the uploaded image SHALL appear in the message input area, below the textarea
- A **×** (remove) button SHALL appear in the top-right corner of the thumbnail

### FR-IMG-007 — Remove Preview

Clicking the × button SHALL:
- Remove the thumbnail from the input area
- Clear the pending image URL from component state
- Restore the image upload button to its normal state

### FR-IMG-008 — Caption Input

While an image preview is shown, the user MAY type optional caption text in the textarea. The placeholder SHALL still be visible while the textarea is empty.

### FR-IMG-009 — Send with Image

GIVEN an image preview is shown:
- The **Send button SHALL be enabled** even if the textarea is empty (image alone is a valid message)
- On send, the message content SHALL be encoded as:
  - Image only: `[img]<imageUrl>`
  - Image + caption: `[img]<imageUrl>\n<caption text>`
- The preview SHALL be cleared after sending
- The textarea SHALL be cleared after sending

### FR-IMG-010 — Upload Error Handling

GIVEN an upload fails (network error, size exceeded, invalid type):
- An error message SHALL be shown to the user
- The image button SHALL be re-enabled
- No preview SHALL remain from the failed upload

---

## 3. Image Storage

### FR-IMG-011 — Server-side Storage

Images SHALL be stored as binary data (`bytea`) in the PostgreSQL `Image` table. No filesystem paths or external storage services are used.

### FR-IMG-012 — Stored Metadata

Each stored image SHALL record:
- Raw binary data
- MIME type (e.g. `image/jpeg`, `image/png`)
- File size in bytes
- Uploader's user ID
- Upload timestamp

### FR-IMG-013 — Image URL Format

After a successful upload, the server SHALL return:
```json
{ "url": "/api/images/<imageId>" }
```
This URL is absolute on the same origin and is what gets encoded in the message content.

---

## 4. Image Serving

### FR-IMG-014 — Serve Endpoint

`GET /api/images/:id` SHALL:
- Retrieve the image record from the database
- Set `Content-Type` to the stored MIME type
- Set `Cache-Control: public, max-age=31536000, immutable`
- Return the binary data as the response body

### FR-IMG-015 — Cache Headers

The immutable cache header means browsers will cache the image indefinitely after the first fetch. This is correct because image IDs are unique (cuid) and image content never changes once stored.

### FR-IMG-016 — Missing Image

If the requested image ID does not exist, the endpoint SHALL return HTTP 404.

### FR-IMG-017 — Authentication Not Required for Serving

`GET /api/images/:id` SHALL be accessible without authentication. This allows images to render correctly in `<img>` tags without requiring credential forwarding on image requests.

---

## 5. Message Content Encoding

### FR-IMG-018 — Encoding Format

Images in message content are encoded using a prefix convention:

| Content | Format |
|---|---|
| Plain text only | `Hello world` |
| Image only | `[img]/api/images/climg1abc` |
| Image + caption | `[img]/api/images/climg1abc\nHello world` |

The `[img]` prefix is used as a sentinel. The image URL follows immediately. An optional caption follows a `\n` newline separator.

### FR-IMG-019 — Parser Behaviour

The `parseContent(content)` function SHALL:
- Return `{ imageUrl: null, text: content }` if content does NOT start with `[img]`
- Return `{ imageUrl: url, text: null }` if content starts with `[img]` and contains no newline
- Return `{ imageUrl: url, text: caption }` if content starts with `[img]`, followed by a newline, followed by the caption

---

## 6. Image Rendering in Messages

### FR-IMG-020 — Inline Image Rendering

GIVEN a message with an image URL:
- The image SHALL be rendered **inline within the message bubble**
- The image SHALL appear above any caption text
- The image SHALL respect a maximum width of **260px** and maximum height of **300px** with `object-fit: contain`
- The image SHALL have an 8px border radius

### FR-IMG-021 — Caption Rendering

GIVEN a message with both an image and a caption:
- The caption SHALL appear as normal text **below** the image, within the same bubble
- The timestamp SHALL appear below the caption

### FR-IMG-022 — Image Click Action

Clicking an image SHALL open it in a **new browser tab** at its full URL (`/api/images/:id`). This allows the user to view it at full resolution.

### FR-IMG-023 — Hover State

The image SHALL have a subtle opacity decrease on hover (`opacity: 0.9`) to communicate clickability.

---

## 7. Image Loading Shimmer

### FR-IMG-024 — Shimmer While Loading

GIVEN an image message is rendered but the image has not yet finished loading from the server:
- A **shimmer skeleton placeholder** SHALL be shown in place of the image
- The placeholder dimensions SHALL be **260px × 180px** with 8px border radius
- The shimmer animation SHALL be the same style as other skeleton loaders in the UI (gradient sweep)

### FR-IMG-025 — Image Reveal

GIVEN the image finishes loading (`onLoad` event fires):
- The shimmer placeholder SHALL be replaced by the image
- The transition SHALL use a **CSS opacity fade** (`transition: opacity 0.2s ease`) from 0 to 1
- The shimmer SHALL disappear at the same time as the image appears (no double-display)

### FR-IMG-026 — Layout Stability

The placeholder SHALL have fixed dimensions matching the expected image render size so that the surrounding message layout does not reflow when the image loads.

### FR-IMG-027 — Load State Scope

The loaded/unloaded state is **per-image, per-render**. Each `MessageImage` component instance manages its own `loaded` boolean in local React state. Switching away and back to a conversation resets this state (the image re-fetches from the browser cache and the shimmer briefly re-appears, which is acceptable given the aggressive `Cache-Control` headers ensure fast cache retrieval).

---

## Acceptance Criteria Summary

| ID | Scenario | Expected Outcome |
|---|---|---|
| AC-IMG-01 | Click image button | OS file picker opens, filtered to images |
| AC-IMG-02 | Select a 4MB JPEG | Upload starts; thumbnail appears in input |
| AC-IMG-03 | Select a 6MB file | Upload fails; error shown; button re-enabled |
| AC-IMG-04 | Click × on preview | Thumbnail removed; button re-enabled |
| AC-IMG-05 | Send image only (no text) | Image message sent; bubble shows image |
| AC-IMG-06 | Send image + caption | Bubble shows image above caption in same bubble |
| AC-IMG-07 | Image renders in bubble | Shimmer shown during load; image fades in on load |
| AC-IMG-08 | Click image in bubble | Opens /api/images/:id in new tab |
| AC-IMG-09 | Other user receives image message | Bubble renders with shimmer → image |
| AC-IMG-10 | Refresh page | Image messages persist and re-render correctly |
| AC-IMG-11 | GET /api/images/:id | Image binary returned with correct Content-Type |
| AC-IMG-12 | GET /api/images/nonexistent | HTTP 404 |
