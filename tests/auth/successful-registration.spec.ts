// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Successful User Registration', async ({ page, testData }) => {
    // Generate unique user credentials for this test
    const testUser = testData.generateTestUser('validuser');

    // Navigate to the Chatter application to start testing user registration
    await page.goto('http://localhost:5173');

    // Navigate to /register page to test user registration
    await page.getByRole('link', { name: 'Register' }).click();

    // Enter a unique username for successful registration
    await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);

    // Enter a valid email address for successful registration
    await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);

    // Enter a password with at least 6 characters for successful registration
    await page.getByRole('textbox', { name: 'Password' }).fill(testUser.password);

    // Click the Create Account button to submit the registration form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify that the username appears in the application header after successful registration
    await expect(page.getByText(testUser.username)).toBeVisible();
    // Verify that the welcome message is displayed, confirming access to authenticated features
    await expect(page.getByText('Welcome to Chatter')).toBeVisible();

    // Verify successful redirect to /chat
    await expect(page).toHaveURL('http://localhost:5173/chat');

    // Verify that the sign out button is available, confirming authenticated state
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});