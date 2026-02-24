# Functional Spec 01 — Authentication

## Overview

Authentication controls who can access the application. Chatter uses email + password credentials with JWT tokens stored in httpOnly cookies. All chat features are gated behind a valid session.

---

## Actors

| Actor | Description |
|---|---|
| Anonymous User | A visitor with no session cookie or an expired one |
| Authenticated User | A visitor with a valid, unexpired session cookie |

---

## 1. Registration

### FR-AU-001 — Registration Form Fields

The registration screen SHALL present three required fields:
- **Username** — display name visible to other users
- **Email** — used for login, must be unique
- **Password** — secret credential

### FR-AU-002 — Username Constraints

- SHALL be non-empty
- SHALL be unique across all registered users (case-sensitive)
- MAY be any printable string with no maximum length enforced at v1.0

### FR-AU-003 — Email Constraints

- SHALL be a valid email format (contains `@` and a domain)
- SHALL be unique across all registered users (case-insensitive comparison)

### FR-AU-004 — Password Constraints

- SHALL be at least 6 characters long
- SHALL be validated client-side before submission to provide immediate feedback
- SHALL be hashed with bcrypt (12 rounds) before storage; the plaintext SHALL NEVER be stored or logged

### FR-AU-005 — Successful Registration

GIVEN valid username, email, and password are submitted:
- The server SHALL create the user record
- The server SHALL issue a session cookie (`token`, httpOnly, 7-day expiry)
- The client SHALL navigate to `/chat`
- The user's identity SHALL be immediately available in the app header

### FR-AU-006 — Registration Errors

| Condition | Error Message Behaviour |
|---|---|
| Email already in use | Display an inline error on the form |
| Username already taken | Display an inline error on the form |
| Password too short | Display inline error before submission |
| Network / server error | Display a generic error above the form |

### FR-AU-007 — Rate Limiting

Registration SHALL be rate-limited to **20 requests per 15 minutes per IP address**. Exceeding this limit SHALL return HTTP 429 and display an appropriate message.

---

## 2. Login

### FR-AU-008 — Login Form Fields

The login screen SHALL present:
- **Email** — must match a registered account
- **Password** — must match the stored hash for that email

### FR-AU-009 — Successful Login

GIVEN valid email and password:
- The server SHALL issue a new session cookie
- The client SHALL navigate to `/chat`

### FR-AU-010 — Failed Login

GIVEN invalid email or incorrect password:
- The server SHALL return a generic "Invalid credentials" error (SHALL NOT distinguish between "email not found" and "wrong password" to prevent user enumeration)
- The client SHALL display the error message on the login form
- The password field SHALL be cleared; the email field SHALL retain its value

### FR-AU-011 — Rate Limiting

Login SHALL be subject to the same rate limit as registration (FR-AU-007).

---

## 3. Session Management

### FR-AU-012 — Session Persistence

GIVEN the user closes and reopens the browser tab:
- If the session cookie is still valid, the user SHALL be automatically authenticated without re-entering credentials
- The app SHALL call `GET /api/auth/me` on load to restore the session
- While this call is in flight, the app SHALL render nothing (no flash of login page)

### FR-AU-013 — Session Expiry

- Sessions expire after **7 days** from issue
- On expiry, the next request to any protected endpoint SHALL return HTTP 401
- The app SHALL detect a 401 response and redirect the user to `/login`

### FR-AU-014 — Unauthenticated Access

GIVEN an anonymous user navigates to `/chat`:
- They SHALL be redirected to `/login`
- After successful login they SHALL be redirected back to `/chat`

GIVEN an authenticated user navigates to `/login` or `/register`:
- They SHALL be redirected to `/chat`

---

## 4. Logout

### FR-AU-015 — Logout Action

The header SHALL display a sign-out button. Clicking it SHALL:
1. Call `POST /api/auth/logout`
2. Clear the `token` cookie on the server
3. Clear the user from client state
4. Disconnect the Socket.IO connection
5. Redirect the user to `/login`

### FR-AU-016 — Post-logout State

After logout, the Zustand store SHALL be reset. If the user opens the app again in the same tab, `GET /api/auth/me` SHALL return 401 and the login page SHALL be shown.

---

## 5. Security Rules

### FR-AU-017 — Protected Routes

Every route except `/login`, `/register`, `GET /api/health`, and `GET /api/images/:id` SHALL require a valid session. Requests without a valid cookie SHALL receive HTTP 401.

### FR-AU-018 — Cookie Attributes

The session cookie SHALL be set with:
- `HttpOnly: true` — not accessible to JavaScript
- `SameSite: Strict` — not sent on cross-site requests
- `Path: /`
- `Max-Age: 604800` (7 days)
- `Secure: true` in production environments (NODE_ENV=production)

### FR-AU-019 — Password Never Transmitted After Registration

The password SHALL only be transmitted during registration and login. No other endpoint SHALL accept or return a password field.

---

## 6. User Identity in the UI

### FR-AU-020 — Header Display

GIVEN an authenticated user:
- The header SHALL display the user's username
- The header SHALL display the user's avatar (generated initial if no avatarUrl)

### FR-AU-021 — Avatar Generation

GIVEN a user with no uploaded avatar:
- A coloured circle with the first character of the username SHALL be displayed
- The colour SHALL be deterministic from the username (same username always = same colour)
- The colour SHALL be visually distinct across different usernames

---

## Acceptance Criteria Summary

| ID | Scenario | Expected Outcome |
|---|---|---|
| AC-AU-01 | Register with valid data | Redirected to /chat; name in header |
| AC-AU-02 | Register with duplicate email | Inline error; no navigation |
| AC-AU-03 | Register with 5-char password | Client-side error before submit |
| AC-AU-04 | Login with correct credentials | Redirected to /chat |
| AC-AU-05 | Login with wrong password | "Invalid credentials" error |
| AC-AU-06 | Refresh page after login | Session restored; no login prompt |
| AC-AU-07 | Open /chat without session | Redirected to /login |
| AC-AU-08 | Click sign out | Redirected to /login; socket closed |
| AC-AU-09 | 21 login attempts in 15 min | HTTP 429; "Too many requests" message |
