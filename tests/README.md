# Test Data Configuration

This directory contains test configuration files for Playwright tests.

## Setup Instructions

1. **Copy the example configuration:**
   ```bash
   cp tests/test-data.example.json tests/test-data.json
   ```

2. **Customize your test credentials** in `tests/test-data.json`:
   - Update usernames, emails, and passwords as needed
   - Ensure credentials are unique and don't conflict with actual users
   - Use strong passwords for security testing

3. **The `test-data.json` file is excluded from git** to prevent exposing sensitive test credentials.

## File Structure

- `test-data.example.json` - Example configuration (committed to git)
- `test-data.json` - Your actual test data (excluded from git)
- `setup.ts` - Test utilities that load from test-data.json

## Configuration Format

```json
{
  "users": {
    "validUser": {
      "username": "your-test-username",
      "email": "your-test-email@example.com",
      "password": "your-test-password"
    }
  },
  "invalidCredentials": {
    "nonExistentUser": {
      "email": "nonexistent@example.com",
      "password": "anypassword"
    }
  },
  "rooms": {
    "testRoom": {
      "name": "Test Room Name",
      "description": "Test room description",
      "isPrivate": false
    }
  }
}
```

## Usage in Tests

Tests automatically load credentials from this configuration:

```typescript
test('some test', async ({ page, testData }) => {
  const { validUser } = testData.users;
  await page.fill('[name="email"]', validUser.email);
  await page.fill('[name="password"]', validUser.password);
});
```

## Security Notes

- **Never commit `test-data.json`** with real credentials
- **Use different credentials** for each test environment
- **Regularly update test passwords**
- **Don't use production credentials** in tests