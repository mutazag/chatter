# Test Documentation & Practices

This directory contains Playwright tests and configuration for the Chatter application.

---

## Test Authoring Practices

### 1. Structure tests with `test.step()`

Every test must be divided into named steps using `test.step()`. Steps appear as collapsible sections in the HTML report and pinpoint exactly which phase failed. Never write a flat test body with no steps.

```typescript
test('Successful User Login', async ({ page, testData }) => {
  await test.step('Register a user account (prerequisite)', async () => {
    // ...
  });

  await test.step('Submit login form with valid credentials', async () => {
    // ...
  });

  await test.step('Verify redirect to chat after login', async () => {
    await expect(page).toHaveURL('http://localhost:5173/chat', {
      message: 'Successful login should redirect to /chat',
    });
  });

  await test.step('Verify authenticated session is established', async () => {
    await expect(page.getByText(loginUser.username)).toBeVisible({
      message: 'Username should appear in the header confirming the correct user is logged in',
    });
  });
});
```

Steps can be nested for sub-phases within a larger step.

---

### 2. Add a `message` to every `expect()` assertion

Every assertion must include a `message` explaining *why* the assertion matters — not just what value is expected. This message appears in the report when the assertion fails, making it immediately clear what the application got wrong.

```typescript
// Bad — tells you what failed, not why it matters
await expect(page).toHaveURL('http://localhost:5173/chat');

// Good — explains the intent and likely cause of failure
await expect(page).toHaveURL('http://localhost:5173/chat', {
  message: 'Successful login should redirect to /chat — server may not have responded in time',
});
```

---

### 3. Wait for navigation before asserting UI state

After any action that triggers a server round-trip (login, registration, form submit), always assert `toHaveURL` first before asserting UI elements. This prevents flaky failures caused by network latency (e.g. Neon cloud database).

```typescript
// Bad — UI assertion may run before navigation completes
await page.getByRole('button', { name: 'Create Account' }).click();
await expect(page.getByText(user.username)).toBeVisible();

// Good — gate all UI assertions on navigation completing first
await page.getByRole('button', { name: 'Create Account' }).click();
await expect(page).toHaveURL('http://localhost:5173/chat', {
  message: 'Registration should redirect to /chat',
});
await expect(page.getByText(user.username)).toBeVisible({
  message: 'Username should appear in the header confirming registration succeeded',
});
```

---

### 4. Use role-based locators

Always prefer Playwright's semantic locators over CSS selectors or XPath. They are more resilient to UI changes and better reflect how users interact with the page.

```typescript
// Bad — fragile, breaks if class name changes
await page.locator('.auth-error').toBeVisible();
await page.locator('#submit-btn').click();

// Good — semantic, matches what the user sees
await expect(page.getByText('Email already in use')).toBeVisible();
await page.getByRole('button', { name: 'Create Account' }).click();
await page.getByRole('textbox', { name: 'Email' }).fill(email);
await page.getByLabel('Room name').fill(roomName);
await page.getByRole('heading', { name: 'Create Room' }).toBeVisible();
```

Locator preference order:
1. `getByRole` — buttons, inputs, headings, links
2. `getByLabel` — form fields with a label
3. `getByText` — visible text content
4. `getByTitle` — elements with a title attribute
5. CSS/XPath — last resort only, add a comment explaining why

---

### 5. Each test must be fully isolated

Tests must never depend on each other or on shared database state. Use `testData.generateTestUser()` to create unique credentials per test. This ensures tests can run in any order and in parallel.

```typescript
// Bad — relies on a user existing from another test or seed
const { validUser } = testData.users;

// Good — each test creates its own user
const testUser = testData.generateTestUser('loginuser');
// testUser.username → 'loginuser_abc123'
// testUser.email    → 'loginuser_abc123@test.com'
// testUser.password → from test-data.json validUser.password
```

---

### 6. Label prerequisite steps clearly

When a test requires setup before the actual feature under test (e.g. registering a user before testing logout), label that step as `(prerequisite)`. This makes it immediately clear in the report whether a failure is in the setup or in the feature being tested.

```typescript
await test.step('Register a user account (prerequisite)', async () => {
  // ...
  await expect(page).toHaveURL('http://localhost:5173/chat', {
    message: 'Registration must succeed before we can test logout',
  });
});

await test.step('Log out', async () => {
  // this is the actual feature under test
});
```

---

### 7. Always import from `../setup`, not `@playwright/test`

All tests must import `test` and `expect` from the local `setup.ts` fixture, which provides the `testData` fixture and automatic cleanup. Importing directly from `@playwright/test` bypasses this.

```typescript
// Bad — loses testData fixture and cleanup
import { test, expect } from '@playwright/test';

// Good
import { test, expect } from '../setup';
```

---

### 8. No inline comments that duplicate step names

Step names and assertion messages are the documentation. Do not add `//` comments that restate what the code already says through step names or assertion messages.

```typescript
// Bad
// Click the Sign In button to submit the login form
await page.getByRole('button', { name: 'Sign In' }).click();

// Good — the step name already provides context
await test.step('Submit login form', async () => {
  await page.getByRole('button', { name: 'Sign In' }).click();
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run a specific file
npx playwright test tests/auth/logout.spec.ts

# Run a specific test by name
npx playwright test --grep "Successful User Logout"

# Open the HTML report after a run
npx playwright show-report
```

---

## Test Data Management

See [`TEST_DATA_STRATEGY.md`](TEST_DATA_STRATEGY.md) for the full documentation on how test data is loaded, generated, tracked, and cleaned up.

Key points:

- Always use `testData.generateTestUser('prefix')` to create unique per-test credentials — never reuse static users from `testData.users` for tests that register.
- Cleanup runs automatically after every test via the `testData` fixture — no manual cleanup calls needed.
- Rooms created through the UI are cleaned up indirectly via their creator. Rooms created via API must be manually registered with `testData.registerRoom(id)`.

---

## Test Data Setup

1. **Copy the example configuration:**
   ```bash
   cp tests/test-data.example.json tests/test-data.json
   ```

2. **Fill in your credentials** in `tests/test-data.json`. The file is excluded from git.

### Key files

- `test-data.example.json` — template (committed to git)
- `test-data.json` — your local credentials (excluded from git)
- `setup.ts` — loads config, provides the `testData` fixture, runs cleanup
- `utils/db-cleanup.ts` — Prisma-based cleanup utility

### Security Notes

- **Never commit `test-data.json`** with real credentials
- **Don't use production credentials** in tests
