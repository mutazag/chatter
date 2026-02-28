# Testing Guide

## Overview

Chatter uses **Playwright** for end-to-end testing with an advanced **automatic test data cleanup strategy** that ensures tests can be run repeatedly without database conflicts.

## Key Features

✅ **Zero Configuration Testing** - Tests self-manage database state
✅ **Automatic Data Cleanup** - No manual database reset required
✅ **Parallel Test Execution** - Tests don't interfere with each other
✅ **Cross-Browser Testing** - Chromium, Firefox, Safari support
✅ **Repeatable Test Runs** - Run tests infinite times without conflicts

---

## Quick Start

### 1. Initial Setup

```bash
# Install Playwright browsers (one-time)
npm run test:install
```

### 2. Run Tests

```bash
# Run all tests
npm test

# Run specific test suite
npx playwright test tests/auth/

# Interactive mode with browser visibility
npm run test:ui

# Debug mode (step through tests)
npm run test:debug

# Show detailed HTML report
npm run test:report
```

---

## Test Data Strategy

### The Problem

Traditional testing approaches suffer from **test data pollution**:

- ❌ Tests fail on second run: "User already exists"
- ❌ Manual database cleanup required between test runs
- ❌ Tests interfere with each other in parallel execution
- ❌ Inconsistent test environment state

### Our Solution

**Automatic Test Data Cleanup** with unique data generation:

```typescript
// ❌ Old approach (causes conflicts)
test('registration', async ({ page }) => {
  await page.fill('[name="email"]', 'test@example.com');  // Fails on 2nd run
});

// ✅ New approach (automatic cleanup)
test('registration', async ({ page, testData }) => {
  const user = testData.generateTestUser('registration');
  await page.fill('[name="email"]', user.email);  // Always unique + cleaned up
});
```

### How It Works

1. **Unique Data Generation**: Each test generates timestamped unique identifiers
2. **Automatic Tracking**: All created test data is tracked during execution
3. **Post-Test Cleanup**: Database cleanup runs automatically after each test
4. **Dependency-Aware Deletion**: Removes data in correct order (messages → users)

Example generated test data:
```javascript
{
  username: 'user605847abc',
  email: 'user605847abc@example.com',
  password: 'password123'  // Read from test-data.json
}
```

---

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '../setup';

test.describe('Feature Name', () => {
  test('specific behavior', async ({ page, testData }) => {
    // 1. Generate unique test data
    const testUser = testData.generateTestUser('feature');

    // 2. Execute test actions
    await page.goto('/register');
    await page.fill('[name="username"]', testUser.username);
    await page.fill('[name="email"]', testUser.email);
    await page.click('[role="button"][name="Create Account"]');

    // 3. Assert expected outcomes
    await expect(page.getByText('Welcome to Chatter')).toBeVisible();

    // 4. Cleanup happens automatically
  });
});
```

### Test Data Utilities

| Method | Usage | Example |
|---|---|---|
| `generateTestUser(prefix)` | Complete user object | `testData.generateTestUser('login')` |
| `generateTestEmail(prefix)` | Unique email only | `testData.generateTestEmail('newsletter')` |
| `generateTestUsername(prefix)` | Unique username only | `testData.generateTestUsername('admin')` |
| `registerUser(email)` | Track manually created user | `testData.registerUser('api-created@test.com')` |
| `registerRoom(roomId)` | Track manually created room | `testData.registerRoom('room-123')` |

### Best Practices

#### ✅ Do This

```typescript
// Use generated test data
const user = testData.generateTestUser('signup');
const email = testData.generateTestEmail('invite');

// Register manually created data for cleanup
const response = await api.createUser({ email: 'manual@test.com' });
testData.registerUser('manual@test.com');

// Use descriptive test and data prefixes
test('password validation shows error for short passwords', async ({ page, testData }) => {
  const user = testData.generateTestUser('shortpass');
});
```

#### ❌ Avoid This

```typescript
// Static test data (causes conflicts)
await page.fill('[name="email"]', 'static@example.com');

// Hardcoded values
const username = 'testuser123';

// Missing cleanup registration
await api.createUser({ email: 'manual@test.com' });
// ❌ Not registered for cleanup
```

---

## Test Organization

### Directory Structure

```
tests/
├── setup.ts                           # Playwright configuration + test utilities
├── utils/
│   └── db-cleanup.ts                   # Database cleanup implementation
├── auth/                               # Authentication & session management
│   ├── successful-registration.spec.ts
│   ├── successful-login.spec.ts
│   ├── registration-duplicate-email.spec.ts
│   └── registration-password-validation.spec.ts
├── rooms/                              # Room management (planned)
│   ├── create-room.spec.ts
│   └── join-leave-room.spec.ts
├── messaging/                          # Message functionality (planned)
│   ├── send-receive-messages.spec.ts
│   └── typing-indicators.spec.ts
└── dm/                                 # Direct messaging (planned)
    └── start-conversation.spec.ts
```

### Test Categories

| Category | Status | Coverage |
|---|---|---|
| **Authentication** | ✅ Complete | Registration, login, logout, validation |
| **Room Management** | 📋 Planned | Create, join, leave, discovery |
| **Messaging** | 📋 Planned | Send, receive, history, typing indicators |
| **Direct Messages** | 📋 Planned | Start conversation, send DMs |
| **File Upload** | 📋 Planned | Image upload, preview, validation |
| **Real-time Events** | 📋 Planned | Socket.IO event handling |

---

## Database Setup

### Option 1: Development Database with Cleanup (Recommended)

Uses your existing development database with automatic cleanup after each test.

```env
# server/.env
DATABASE_URL="postgresql://user:password@localhost:5432/chatter_dev"
NODE_ENV="development"
```

**Pros:**
- ✅ Simple setup - no additional database needed
- ✅ Tests use realistic production-like environment
- ✅ Automatic cleanup prevents pollution

**Cons:**
- ⚠️ Tests interact with development data (though cleaned up)

### Option 2: Separate Test Database (Optional)

Create a dedicated test database for complete isolation.

```bash
# Create test database
createdb chatter_test

# Configure .env.test
echo 'TEST_DATABASE_URL="postgresql://user:password@localhost:5432/chatter_test"' > .env.test
```

```env
# .env.test
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/chatter_test"
NODE_ENV="test"
```

**Pros:**
- ✅ Complete isolation from development environment
- ✅ No risk of interfering with development data

**Cons:**
- ⚠️ Requires additional database setup
- ⚠️ Need to keep test schema in sync

---

## Configuration

### Playwright Configuration

Located in [`playwright.config.ts`](../playwright.config.ts):

```typescript
export default defineConfig({
  testDir: './tests',
  globalTeardown: require.resolve('./tests/setup.ts'),
  fullyParallel: true,           // Run tests in parallel
  workers: process.env.CI ? 1 : undefined,

  // Single browser for fast development
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Additional browsers commented out for speed
    // Uncomment for cross-browser testing in CI
  ],

  webServer: [
    {
      command: 'npm run dev --workspace=server',
      port: 3000,
    },
    {
      command: 'npm run dev --workspace=client',
      port: 5173,
    },
  ],
});
```

#### Development vs Production Testing

**Development (Fast):** Tests run against Chromium only
- ✅ **5x faster** test execution
- ✅ Quick feedback loop
- ✅ Sufficient for most development work

**CI/Production (Comprehensive):** Enable cross-browser testing
```typescript
// Uncomment in playwright.config.ts for CI
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
],
```

#### Running Specific Browsers

```bash
# Run against specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox

# Run all browsers (if configured)
npx playwright test

# Run against multiple specific browsers
npx playwright test --project=chromium --project=firefox
```

### Test Environment Variables

```env
# Development database (recommended)
DATABASE_URL="postgresql://user:password@localhost:5432/chatter_dev"

# OR separate test database
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/chatter_test"

# Required for JWT auth in tests
JWT_SECRET="your-jwt-secret-from-server-env"
```

---

## Test Debugging

### Visual Debugging

```bash
# Run tests with browser visible
npm run test:ui

# Debug specific test
npx playwright test --debug tests/auth/successful-registration.spec.ts

# Run in headed mode
npx playwright test --headed
```

### Test Output & Reports

```bash
# Generate and show HTML report
npm run test:report

# Watch mode (reruns on file changes)
npx playwright test --ui

# Verbose output
npx playwright test --reporter=list
```

### Common Issues

#### Tests Timeout or Hang

```bash
# Check if dev servers are running
npm run dev

# Verify database connection
npm run db:studio --workspace=server
```

#### Database Connection Errors

```typescript
// Verify DATABASE_URL in server/.env
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
await prisma.$connect();
```

#### Tests Fail on "Element Not Found"

```typescript
// Add explicit waits
await page.waitForURL('/chat');
await page.waitForSelector('[data-testid="welcome-message"]');

// Use reliable selectors
await page.getByRole('button', { name: 'Sign In' }).click();  // ✅ Good
await page.click('.btn-primary');                             // ❌ Fragile
```

---

## Advanced Topics

### Parallel Test Execution

Tests run in parallel by default. Our cleanup strategy ensures no conflicts:

```typescript
// These run simultaneously without conflicts
test('user registration A', async ({ testData }) => {
  const user = testData.generateTestUser('a'); // user605847abc@example.com
});

test('user registration B', async ({ testData }) => {
  const user = testData.generateTestUser('b'); // user605847def@example.com
});
```

### Custom Test Data Patterns

```typescript
// Complex test scenarios
test('room membership workflow', async ({ page, testData }) => {
  const roomCreator = testData.generateTestUser('creator');
  const roomMember = testData.generateTestUser('member');

  // Create room as first user
  await registerAndLogin(page, roomCreator);
  const roomName = `testroom-${Date.now()}`;
  await createRoom(page, roomName);
  testData.registerRoom(roomName); // Track for cleanup

  // Join room as second user
  await registerAndLogin(page, roomMember);
  await joinRoom(page, roomName);

  // Both users and room cleaned up automatically
});
```

### Test Data Cleanup Deep Dive

The cleanup process handles database dependencies correctly:

```mermaid
graph TD
    A[Test Completes] --> B[Cleanup Triggered]
    B --> C[Delete Messages]
    B --> D[Delete DirectMessages]
    B --> E[Delete RoomMemberships]
    B --> F[Delete Images]
    C & D & E & F --> G[Delete Rooms]
    G --> H[Delete Users]
    H --> I[Clear Tracking Arrays]
```

Cleanup order prevents foreign key constraint violations.

---

## Performance & CI

### Local Performance

- **Parallel execution**: Tests run across 4 workers by default
- **Smart cleanup**: Only deletes data actually created by tests
- **Connection pooling**: Reuses database connections

### Continuous Integration

```yaml
# Example GitHub Actions workflow
- name: Run Playwright tests
  run: npx playwright test
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

### Test Execution Times

| Test Suite | Local (Parallel) | CI (Sequential) |
|---|---|---|
| Authentication (5 tests) | 14s | 25s |
| All current tests | 14s | 25s |

---

## Migration Guide

### Updating Existing Tests

Replace static test data with dynamic generation:

```typescript
// ❌ Before (brittle)
test('registration', async ({ page, testData }) => {
  await page.fill('[name="email"]', testData.users.validUser.email);
});

// ✅ After (robust)
test('registration', async ({ page, testData }) => {
  const user = testData.generateTestUser('registration');
  await page.fill('[name="email"]', user.email);
});
```

### Updating Test Data Config

Old `test-data.json` static values can be gradually phased out:

```json
{
  "users": {
    "validUser": {
      "email": "static@example.com"  // ❌ Remove static data
    }
  }
}
```

Replace with dynamic generation in tests.

---

## Contributing

### Adding New Tests

1. **Use the test template**:
   ```typescript
   import { test, expect } from '../setup';

   test.describe('Feature Name', () => {
     test('specific behavior', async ({ page, testData }) => {
       const testUser = testData.generateTestUser('feature');
       // Test implementation
     });
   });
   ```

2. **Follow naming conventions**:
   - Test files: `feature-behavior.spec.ts`
   - Test data prefixes: `'feature'` matching the test purpose
   - Descriptive test names: `'should do X when Y happens'`

3. **Register manual data**: If creating test data via API calls, register for cleanup:
   ```typescript
   testData.registerUser(createdEmail);
   testData.registerRoom(createdRoomId);
   ```

### Extending Cleanup Utilities

To add cleanup for new entities:

1. **Update `TestDbCleanup` class** in `tests/utils/db-cleanup.ts`
2. **Add tracking arrays** for new entity types
3. **Update cleanup order** to respect foreign key constraints
4. **Add convenience methods** for test data generation

---

## References

- [Playwright Documentation](https://playwright.dev/)
- [Test Data Strategy](../tests/TEST_DATA_STRATEGY.md) - Implementation details
- [Development Guide](./development.md) - Local setup and scripts
- [Architecture Overview](./architecture.md) - System design context