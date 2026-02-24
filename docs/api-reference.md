# REST API Reference

All endpoints are prefixed with `/api`. Authentication uses an httpOnly cookie named `token` set at login/register.

---

## Authentication

### POST /api/auth/register

Register a new user account.

**Rate limited:** 20 requests per 15 minutes per IP.

**Request body**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secretpassword"
}
```

**Constraints**
- `username`: required, non-empty string
- `email`: required, valid email format
- `password`: required, minimum 6 characters

**Response `201`**
```json
{
  "id": "clxyz123",
  "username": "alice",
  "email": "alice@example.com",
  "avatarUrl": null,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```
Sets `Set-Cookie: token=<jwt>; HttpOnly; Path=/; SameSite=Strict; Max-Age=604800`

**Errors**
| Status | Condition |
|---|---|
| 400 | Missing or invalid fields; password too short |
| 409 | Username or email already in use |

---

### POST /api/auth/login

Authenticate an existing user.

**Rate limited:** 20 requests per 15 minutes per IP.

**Request body**
```json
{
  "email": "alice@example.com",
  "password": "secretpassword"
}
```

**Response `200`**
```json
{
  "id": "clxyz123",
  "username": "alice",
  "email": "alice@example.com",
  "avatarUrl": null
}
```
Sets `Set-Cookie: token=<jwt>; HttpOnly; ...`

**Errors**
| Status | Condition |
|---|---|
| 400 | Missing fields |
| 401 | Invalid email or password |

---

### POST /api/auth/logout

Sign out the current user. Requires authentication.

**Response `200`**
```json
{ "message": "Logged out" }
```
Clears the `token` cookie.

---

### GET /api/auth/me

Return the currently authenticated user. Used on app load to restore session from cookie.

**Response `200`**
```json
{
  "id": "clxyz123",
  "username": "alice",
  "email": "alice@example.com",
  "avatarUrl": null
}
```

**Errors**
| Status | Condition |
|---|---|
| 401 | No valid session cookie |

---

## Rooms

All room endpoints require authentication.

### GET /api/rooms

List all public rooms with member count and whether the current user is a member.

**Response `200`**
```json
[
  {
    "id": "clroom1",
    "name": "general",
    "description": "General chat",
    "isPrivate": false,
    "memberCount": 42,
    "isMember": true
  }
]
```

---

### GET /api/rooms/mine

List only the rooms the current user has joined.

**Response `200`** — same shape as GET /api/rooms.

---

### POST /api/rooms

Create a new room. The creator is automatically added as a member.

**Request body**
```json
{
  "name": "off-topic",
  "description": "Random chat",
  "isPrivate": false
}
```

**Constraints**
- `name`: required, non-empty
- `description`: optional
- `isPrivate`: optional boolean, default `false`

**Response `201`**
```json
{
  "id": "clroom2",
  "name": "off-topic",
  "description": "Random chat",
  "isPrivate": false,
  "memberCount": 1,
  "isMember": true
}
```

**Errors**
| Status | Condition |
|---|---|
| 400 | Missing name |
| 409 | Room name already exists |

---

### POST /api/rooms/:id/join

Join a public room.

**Response `200`**
```json
{ "message": "Joined" }
```

**Errors**
| Status | Condition |
|---|---|
| 403 | Room is private |
| 404 | Room not found |

---

### DELETE /api/rooms/:id/leave

Leave a room. The room itself is not deleted.

**Response `200`**
```json
{ "message": "Left" }
```

---

### GET /api/rooms/:id/messages

Retrieve paginated message history for a room. Requires membership.

**Query parameters**
| Param | Type | Default | Description |
|---|---|---|---|
| `before` | ISO 8601 datetime | — | Return messages older than this timestamp (cursor) |
| `limit` | integer | 50 | Maximum messages to return (capped at 50) |

**Response `200`** — messages in **chronological order** (oldest first):
```json
[
  {
    "id": "clmsg1",
    "content": "Hello everyone",
    "createdAt": "2025-01-01T10:00:00.000Z",
    "roomId": "clroom1",
    "author": {
      "id": "clxyz123",
      "username": "alice",
      "avatarUrl": null
    }
  }
]
```

**Errors**
| Status | Condition |
|---|---|
| 403 | User is not a member of this room |
| 404 | Room not found |

---

## Direct Messages

All DM endpoints require authentication.

### GET /api/dms

List all DM conversations for the current user, ordered by most recent message.

**Response `200`**
```json
[
  {
    "id": "clxyz456",
    "username": "bob",
    "avatarUrl": null,
    "lastAt": "2025-01-02T09:00:00.000Z"
  }
]
```

Each item represents one conversation partner.

---

### GET /api/dms/:userId/messages

Retrieve paginated DM history between the current user and `:userId`.

**Query parameters** — same as room messages: `before`, `limit`.

**Response `200`** — messages in chronological order:
```json
[
  {
    "id": "cldm1",
    "content": "Hey Bob!",
    "createdAt": "2025-01-02T09:00:00.000Z",
    "readAt": null,
    "sender": {
      "id": "clxyz123",
      "username": "alice",
      "avatarUrl": null
    },
    "receiver": {
      "id": "clxyz456",
      "username": "bob",
      "avatarUrl": null
    }
  }
]
```

---

## Users

### GET /api/users/search?q=\<query\>

Search for users by username. Returns up to 20 matches, excluding the current user.

**Query parameters**
| Param | Description |
|---|---|
| `q` | Partial username search string (case-insensitive) |

**Response `200`**
```json
[
  {
    "id": "clxyz456",
    "username": "bob",
    "avatarUrl": null
  }
]
```

---

## Image Upload

### POST /api/upload

Upload an image file. The binary is stored in the database.

**Content-Type:** `multipart/form-data`

**Form field:** `file` — the image file

**Constraints**
- Maximum file size: **5 MB**
- Accepted MIME types: `image/*`
- Requires authentication

**Response `200`**
```json
{
  "url": "/api/images/climg1abc"
}
```

The returned `url` is an absolute path on the same origin and can be embedded directly in `<img src>` or sent as part of a message.

**Errors**
| Status | Condition |
|---|---|
| 400 | File too large, not an image, or missing file field |
| 401 | Not authenticated |

---

### GET /api/images/:id

Serve a stored image.

**Response `200`**
- `Content-Type`: the MIME type stored at upload time (e.g. `image/jpeg`)
- `Cache-Control: public, max-age=31536000, immutable` — images are content-addressed and never change
- Body: raw binary image data

**Errors**
| Status | Condition |
|---|---|
| 404 | Image ID not found |

---

## Health Check

### GET /api/health

Returns server status. Useful for load balancer probes.

**Response `200`** (no authentication required)
```json
{ "status": "ok" }
```

---

## Error Format

All error responses follow this shape:

```json
{
  "message": "Human-readable error description"
}
```

Validation errors may return additional detail in the `message` field.

---

## Authentication Cookie

The `token` cookie is set with the following attributes:

| Attribute | Value |
|---|---|
| `HttpOnly` | `true` — inaccessible to JavaScript |
| `SameSite` | `Strict` — sent only on same-site requests |
| `Path` | `/` |
| `Max-Age` | `604800` (7 days) |
| `Secure` | Set to `true` in production (`NODE_ENV=production`) |

Clients must set `withCredentials: true` (Axios) or `credentials: 'include'` (fetch) for cookies to be sent cross-origin during development.
