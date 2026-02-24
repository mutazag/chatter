# ADR-006: Image Storage in Database (not Filesystem)

**Status:** Accepted
**Date:** 2025-01-15

---

## Context

Users need to send images in chat messages. Images need to be stored persistently and served back to clients. Options considered:

1. **Filesystem** — save files to `server/uploads/`, serve statically with `express.static`
2. **Database** — store binary data in a PostgreSQL `bytea` column
3. **Object storage** — upload to AWS S3, Cloudflare R2, or similar; store only the URL

---

## Decision

Store image binary data in the PostgreSQL database using Prisma's `Bytes` type (PostgreSQL `bytea`).

---

## Rationale

The user explicitly requested: *"uploaded images should be stored in the database, not file system."*

**Advantages of DB storage over filesystem:**
- **No filesystem dependencies** — the application has zero persistent local state. The server process can be replaced, restarted, or moved without data loss.
- **Consistency** — images and their metadata are in the same transactional store as all other data. A database backup captures everything.
- **No orphaned files** — filesystem storage can leave orphaned files if the database record is deleted. With DB storage, the image is deleted when the `Image` row is deleted.
- **Simpler deployment** — no volume mounts, no S3 bucket configuration, no IAM policies. The connection string is the only external dependency.

**Disadvantages (accepted tradeoffs):**
- **Memory** — the entire image binary is loaded into server memory to serve a request. With a 5 MB limit and low to moderate concurrent traffic, this is acceptable.
- **DB size** — images increase the database size. Neon's free tier includes 0.5 GB of storage; the 5 MB per-image limit means approximately 100 images fill the free tier. Paid tiers or a migration to S3 would be required at scale.
- **No CDN** — images are served through the application server on every request. The `Cache-Control: public, max-age=31536000, immutable` header offloads repeat fetches to the browser cache, but there is no edge caching.

**Why not object storage:**
- Adds an external service dependency (AWS account, credentials, bucket configuration) that is not warranted for the current scale.
- The database storage approach can be migrated to S3 later by changing only the upload and serve handlers — the `[img]/api/images/:id` URL format in message content remains valid.

---

## Implementation

**Upload:** `multer.memoryStorage()` buffers the file in memory (no disk write), then `prisma.image.create({ data: { data: file.buffer, mimeType, size } })` persists it.

**Serve:** `prisma.image.findUnique({ where: { id } })` retrieves the `Bytes` buffer; `res.set('Content-Type', image.mimeType)` and `res.send(image.data)` stream it.

**Cache headers:** `Cache-Control: public, max-age=31536000, immutable` — since image IDs are cuid-generated and the content never changes, clients can cache aggressively.

---

## Consequences

- Maximum image size is enforced at 5 MB by the `multer` limits configuration.
- Only `image/*` MIME types are accepted (validated both by file filter and the stored `mimeType`).
- A migration to external object storage (S3) can be done transparently: change the upload handler to PUT to S3 and return the S3 URL; change the serve handler to redirect to the S3 URL. Existing messages storing `/api/images/:id` URLs would need a proxy or a one-time migration of the content strings.
