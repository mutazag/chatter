# Test Data Strategy

This document explains how test data is loaded, generated, and cleaned up in the Chatter Playwright test suite.

---

## Overview

The framework handles test data in two layers:

- **Static config** (`test-data.json`) — shared values loaded once at startup: the default password, pre-seeded users for login tests, and invalid credential fixtures.
- **Dynamic data** — unique identifiers generated per-test at runtime to prevent conflicts between tests and across parallel runs.

---

## Static Configuration

`test-data.json` (excluded from git — copy from `test-data.example.json`) is loaded once in `setup.ts` when the test process starts. Its values are exposed via the `testData` fixture:

```typescript
testData.users.validUser          // pre-seeded user (used for login tests)
testData.invalidCredentials.nonExistentUser
testData.invalidCredentials.validEmailWrongPassword
testData.invalidCredentials.shortPassword
testData.users.duplicateEmail
```

Use static config only when the test explicitly requires a pre-existing, known user (e.g. testing login with a seeded account). For any test that creates its own user, use dynamic generation instead.

---

## Dynamic Data Generation

Use `testData.generateTestUser(prefix)` to create unique credentials for each test. The generated ID is 9 characters: the last 6 digits of `Date.now()` plus 3 random alphanumeric characters (e.g. `738291xk7`).

```typescript
const testUser = testData.generateTestUser('loginuser');
// testUser.username → 'loginuser738291xk7'
// testUser.email    → 'loginuser738291xk7@example.com'
// testUser.password → value from test-data.json validUser.password
```

Individual generators are also available:

```typescript
const email    = testData.generateTestEmail('prefix');     // auto-registered for cleanup
const username = testData.generateTestUsername('prefix');  // not auto-registered
const id       = testData.generateTestId('prefix');        // raw unique suffix
```

**Important:** `generateTestEmail()` automatically registers the email in the cleanup tracker. `generateTestUsername()` does not — usernames are cleaned up indirectly via the associated email. `generateTestUser()` calls `generateTestEmail()` internally, so the user is always auto-registered.

---

## Cleanup

### Automatic cleanup after each test

The `testData` fixture in `setup.ts` runs cleanup in its teardown phase (after `use()`), so cleanup happens automatically after every test without any explicit call needed:

```typescript
// setup.ts — runs after every test that uses the testData fixture
await use(testData);
await testData.cleanup(); // ← called automatically
```

Cleanup deletes data in dependency order to avoid foreign key violations:

```
1. messages          (depends on users and rooms)
2. direct messages   (depends on users)
3. room memberships  (depends on users and rooms)
4. images            (depends on users)
5. rooms             (depends on users as creator)
6. users
```

### Global teardown after the full suite

`globalTeardown` in `setup.ts` calls `TestDbCleanup.disconnect()` to close the Prisma connection after all tests have finished.

---

## Tracking Created Data

`TestDbCleanup` maintains two static arrays — `createdUsers` (emails) and `createdRooms` (IDs) — that are populated during test execution and flushed after each test's cleanup.

### Users
Registered automatically by `generateTestEmail()`. No manual registration needed when using `generateTestUser()`.

### Rooms created via UI
Rooms created through the browser are **not** explicitly tracked in `createdRooms`. They are still cleaned up indirectly because the cleanup deletes all rooms where `creatorId` is one of the tracked test users.

### Rooms created via API / direct DB calls
If a room is created outside the UI and you need it cleaned up, register it manually:

```typescript
testData.registerRoom('room-id-123');
```

---

## Parallel Test Safety

`createdUsers` and `createdRooms` are static class properties, shared within a Node.js process. Playwright runs each worker in a separate process, so parallel workers do not share these arrays — each worker tracks and cleans up only its own test data.

For sequential tests within the same worker, each test's data is isolated because `cleanup()` clears the arrays after every test.

---

## Ad-hoc Cleanup

If a test run was aborted before cleanup ran, leftover data can be removed by pattern:

```typescript
await TestDbCleanup.cleanupByPattern('loginuser');
// Deletes all users whose username or email contains 'loginuser',
// plus their messages, DMs, memberships, images, and rooms.
```

---

## Common Mistakes

| Mistake | Problem | Fix |
|---|---|---|
| `testData.users.validUser` for a test that registers | Conflicts if the user already exists | Use `testData.generateTestUser()` |
| Importing from `@playwright/test` instead of `../setup` | `testData` fixture not available, no cleanup | Import from `../setup` |
| Manually calling `testData.cleanup()` inside a test | Double cleanup — fixture already runs it | Remove the manual call |
| Creating a room via API without `registerRoom()` | Room may not be cleaned up if user wasn't tracked | Call `testData.registerRoom(id)` after creation |
