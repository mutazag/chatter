// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Successful User Login', async ({ page, testData }) => {
    // Generate unique user credentials for this test
    const loginUser = testData.generateTestUser('loginuser');

    // First, register a test user account (prerequisite)
    await page.goto('http://localhost:5173/register');
    await page.getByRole('textbox', { name: 'Username' }).fill(loginUser.username);
    await page.getByRole('textbox', { name: 'Email' }).fill(loginUser.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(loginUser.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Sign out to test login functionality
    await page.getByRole('button', { name: 'Sign out' }).click();

    // Navigate to login page to test successful login functionality
    await page.goto('http://localhost:5173/login');

    // Enter the email of a pre-registered user for successful login test
    await page.getByRole('textbox', { name: 'Email' }).fill(loginUser.email);

    // Enter the correct password for successful login test
    await page.getByRole('textbox', { name: 'Password' }).fill(loginUser.password);

    // Click the Sign In button to submit the login form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify that the username appears in the header after successful login
    await expect(page.getByText(loginUser.username)).toBeVisible();

    // Verify that the welcome message is displayed, confirming access to authenticated features
    await expect(page.getByText('Welcome to Chatter')).toBeVisible();

    // Verify that the sign out button is available, confirming authenticated state
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    // Verify successful redirect to /chat
    await expect(page).toHaveURL('http://localhost:5173/chat');
  });
});