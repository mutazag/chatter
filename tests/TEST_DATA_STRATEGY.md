# Test Data Strategy

This project uses a comprehensive test data cleanup strategy to ensure tests can be run repeatedly without conflicts.

## Overview

The test framework automatically:
1. ✅ Generates unique test data for each test run
2. ✅ Tracks created test data during test execution
3. ✅ Cleans up test data after each test automatically
4. ✅ Prevents database conflicts between test runs

## Usage in Tests

### Basic Test Data Generation

```typescript
test('My Test', async ({ page, testData }) => {
  // Generate unique user credentials
  const testUser = testData.generateTestUser('mytest');
  // Result: { username: 'mytest123456abc', email: 'mytest123456abc@example.com', password: 'password123' }
  // (Password is read from test-data.json configuration)

  // Use in your test
  await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
  await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);

  // The test data will be automatically cleaned up after the test
});
```

### Individual Data Generation

```typescript
// Generate unique email
const email = testData.generateTestEmail('prefix');

// Generate unique username
const username = testData.generateTestUsername('prefix');

// All generated data is automatically tracked for cleanup
```

### Manual Registration (if needed)

```typescript
// If you create users through API calls, register them for cleanup
testData.registerUser('manually-created@example.com');
testData.registerRoom('room-id-123');
```

## Key Benefits

- ✅ **No more test conflicts** - Each test run uses unique identifiers
- ✅ **Automatic cleanup** - No manual database reset needed
- ✅ **Parallel test execution** - Tests don't interfere with each other
- ✅ **Easy debugging** - Test data is predictably named with timestamps
- ✅ **Environment agnostic** - Works with any database setup

## Configuration

### Environment Variables

```bash
# Set in .env.test (optional - for separate test database)
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/chatter_test"

# Or use existing database with cleanup
DATABASE_URL="postgresql://user:pass@localhost:5432/chatter_dev"
```

### Database Setup

The cleanup utility connects to your PostgreSQL database using the same connection as your main application. Test data is cleaned up automatically after each test.

## Cleanup Process

After each test:

1. Deletes all messages created by test users
2. Deletes all direct messages involving test users
3. Deletes all room memberships for test users
4. Deletes all images uploaded by test users
5. Deletes all rooms created by test users
6. Deletes all test user accounts

## Troubleshooting

If tests fail with "already exists" errors:

1. Check that you're using `testData.generateTestUser()` instead of static credentials
2. Verify that cleanup is running (check test output for cleanup logs)
3. Ensure database connection is working in test environment
4. Consider using a separate test database for complete isolation

## Migration from Old Tests

Replace static test data:

```typescript
// ❌ Old way (causes conflicts)
const testUser = testData.users.validUser;

// ✅ New way (automatic cleanup)
const testUser = testData.generateTestUser('validuser');
```