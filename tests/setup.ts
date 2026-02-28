import { test as base, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TestDbCleanup } from './utils/db-cleanup';

// Load test data from JSON file
let testDataConfig: any;
try {
  const testDataPath = path.join(__dirname, 'test-data.json');
  if (!fs.existsSync(testDataPath)) {
    throw new Error(`Test data file not found at ${testDataPath}. Please copy test-data.example.json to test-data.json and configure your test credentials.`);
  }
  testDataConfig = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
} catch (error) {
  console.error('Failed to load test data:', error);
  process.exit(1);
}

// Extend test to include common fixtures and utilities
export const test = base.extend({
  // Add a data setup fixture that can handle test data creation/cleanup
  testData: async ({ page }, use) => {
    const testData = {
      // Load test user credentials from config
      testUser: testDataConfig.users.testUser,
      users: testDataConfig.users,
      invalidCredentials: testDataConfig.invalidCredentials,

      // Test room data
      testRoom: testDataConfig.rooms.testRoom,

      // Utilities for generating unique test data
      generateTestUser: (prefix = 'user') => ({
        username: TestDbCleanup.generateTestUsername(prefix),
        email: TestDbCleanup.generateTestEmail(prefix),
        password: testDataConfig.users.validUser.password
      }),

      generateTestEmail: (prefix = 'test') => TestDbCleanup.generateTestEmail(prefix),
      generateTestUsername: (prefix = 'user') => TestDbCleanup.generateTestUsername(prefix),

      // Register created data for cleanup
      registerUser: (email: string) => TestDbCleanup.registerUser(email),
      registerRoom: (roomId: string) => TestDbCleanup.registerRoom(roomId),

      // Cleanup function to remove test data
      cleanup: async () => {
        await TestDbCleanup.cleanup();
      }
    };

    await use(testData);

    // Cleanup after test
    await testData.cleanup();
  },

  // Authentication helper
  authenticatedPage: async ({ page, testData }, use) => {
    // Navigate to login page
    await page.goto('/login');

    // Perform login
    await page.fill('[data-testid="email-input"]', testData.testUser.username);
    await page.fill('[data-testid="password-input"]', testData.testUser.password);
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await page.waitForURL('/');

    await use(page);
  }
});

export { expect } from '@playwright/test';

// Global teardown to ensure database connections are properly closed
export default async function globalTeardown() {
  await TestDbCleanup.disconnect();
}