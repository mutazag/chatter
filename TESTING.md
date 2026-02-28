# Chatter - Testing Guide

## Overview

This guide explains how to set up and run automated tests for the Chatter application using Playwright.

## Prerequisites

### 1. Environment Setup

Before running tests, ensure you have the required environment variables configured:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your database and configuration settings:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/chatter"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3000
CLIENT_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### 2. Test Data Configuration

Configure test credentials to avoid hardcoded values:

```bash
# Copy the test data template
cp tests/test-data.example.json tests/test-data.json
```

Edit `tests/test-data.json` with your test credentials:

```json
{
  "users": {
    "validUser": {
      "username": "testuser123",
      "email": "testuser123@example.com",
      "password": "password123"
    }
  }
}
```

**Note:** The `test-data.json` file is excluded from git to protect sensitive test credentials.

### 3. Database Setup

The application requires PostgreSQL database:

1. **Install PostgreSQL** (if not already installed)
2. **Create the database:**
   ```sql
   CREATE DATABASE chatter;
   ```
3. **Run database migrations:**
   ```bash
   cd server
   npm run db:generate
   npm run db:migrate
   ```

### 4. Install Playwright Browsers

```bash
npx playwright install
```

## Test Structure

```
tests/
├── setup.ts                    # Test utilities and fixtures
├── seed.spec.ts                # Basic setup verification
├── auth/                       # Authentication tests (5 tests)
│   ├── successful-registration.spec.ts
│   ├── registration-duplicate-email.spec.ts
│   ├── registration-password-validation.spec.ts
│   ├── successful-login.spec.ts
│   └── login-invalid-credentials.spec.ts
└── [future test suites]        # Rooms, DM, Messaging, etc.
```

## Available Test Suites

### 1. ✅ Authentication Suite (5 tests)
- User registration with valid data
- Registration with duplicate email
- Password validation during registration
- Successful user login
- Login with invalid credentials

### 2. 🏗️ Planned Test Suites (58 additional tests)
- **Rooms**: Creating, joining, managing public/private rooms (8 tests)
- **Direct Messaging**: User-to-user messaging (8 tests)
- **Core Messaging**: Sending, editing, deleting messages (9 tests)
- **Image Sharing**: Upload and display functionality (9 tests)
- **Real-time Features**: Socket.IO communication (8 tests)
- **UI/UX**: Responsive design and accessibility (9 tests)

See [specs/chatter-functional-test-plan.md](./specs/chatter-functional-test-plan.md) for detailed test cases.

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Run specific test suite
npm run test -- tests/auth/

# Run a single test file
npm run test -- tests/auth/successful-login.spec.ts

# Run tests in headed mode (visible browser)
npm run test -- --headed

# Run tests on specific browser
npm run test -- --project chromium
```

### Development Workflow

1. **Start the application servers:**
   ```bash
   # Terminal 1: Start backend
   npm run dev --workspace=server

   # Terminal 2: Start frontend
   npm run dev --workspace=client
   ```

2. **Run tests** (in a third terminal):
   ```bash
   npm run test
   ```

### Test Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- **Base URL**: http://127.0.0.1:5173
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Auto-start**: Automatically starts dev servers before tests
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Collected on retry

### Test Data Management

Tests use the `testData` fixture from `tests/setup.ts`:

```typescript
// Example usage in a test
test('user registration', async ({ page, testData }) => {
  await page.goto('/register');
  await page.fill('[data-testid="email-input"]', testData.testUser.username);
  // ... rest of test
});
```

### Authentication Helper

For tests requiring authentication, use the `authenticatedPage` fixture:

```typescript
test('access protected page', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // User is already authenticated
});
```

## Debugging Tests

### Visual Debugging

```bash
# Run tests with browser visible
npm run test -- --headed

# Debug specific test
npm run test:debug -- tests/auth/successful-login.spec.ts
```

### Test Reports

```bash
# View HTML report
npm run test:report

# Or after tests run:
npx playwright show-report
```

### Screenshots and Videos

Failed test artifacts are saved in `test-results/`:
- Screenshots: `test-results/[test-name]/test-failed-1.png`
- Videos: `test-results/[test-name]/video.webm`
- Traces: Use `npx playwright show-trace [trace-file]`

### Common Issues

1. **Connection Refused Errors**
   - Ensure both servers are running
   - Check that ports 3000 and 5173 are available
   - Verify environment variables are set correctly

2. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Verify DATABASE_URL in .env file
   - Run database migrations

3. **Test Data Conflicts**
   - Tests may create conflicting data
   - Consider implementing test data cleanup
   - Use unique test data generators from TestHelpers

## CI/CD Integration

For continuous integration:

```yaml
# Example GitHub Actions step
- name: Run Playwright tests
  run: |
    npm run test
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

## Development Guidelines

### Writing New Tests

1. **Follow the test plan**: Reference [specs/chatter-functional-test-plan.md](./specs/chatter-functional-test-plan.md)
2. **Use data-testid attributes**: For reliable element selection
3. **Implement cleanup**: Ensure tests don't affect each other
4. **Test realistic scenarios**: Mirror actual user workflows
5. **Add meaningful assertions**: Verify both success and error states

### Test Data Strategy

- Use unique identifiers (timestamps, UUIDs) for test data
- Implement proper cleanup in `testData` fixture
- Consider database seeding for complex scenarios
- Mock external dependencies when appropriate

## Next Steps

1. **Generate remaining test suites** from the functional test plan
2. **Implement test data cleanup** API endpoints
3. **Add visual regression testing** for UI components
4. **Set up CI/CD pipeline** with automated test execution
5. **Add performance testing** for critical user flows

For detailed test case specifications, see the [comprehensive test plan](./specs/chatter-functional-test-plan.md).