// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Registration with Duplicate Email', async ({ page, testData }) => {
    const { duplicateEmail } = testData.users;

    // Generate unique user credentials for this test
    const testUser = testData.generateTestUser('firstuser');

    // First, register a user with a specific email (prerequisite)
    await page.goto('http://localhost:5173/register');
    await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
    await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(testUser.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for successful registration and logout
    await expect(page.getByText('Welcome to Chatter')).toBeVisible();
    await page.getByRole('button', { name: 'Sign out' }).click();

    // Navigate to registration page to test duplicate email scenario
    await page.goto('http://localhost:5173/register');

    // Generate another unique username for the duplicate email test
    const anotherUsername = testData.generateTestUsername('anotheruser');

    // Enter a different username to test duplicate email validation
    await page.getByRole('textbox', { name: 'Username' }).fill(anotherUsername);

    // Enter the same email address that was already registered to test duplicate email validation
    await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);

    // Enter a valid password for the duplicate email test
    await page.getByRole('textbox', { name: 'Password' }).fill('password456');

    // Submit the registration form with duplicate email to trigger validation error
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify that the duplicate email error message is displayed
    await expect(page.getByText('Email already in use')).toBeVisible();

    // Verify that the Create Account button is still visible, showing the form remains open
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

    // Verify that the username field retained its value after failed submission
    await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue(anotherUsername);

    // Verify that the email field retained its value after failed submission
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(testUser.email);

    // Verify we're still on the registration page (no navigation occurred)
    await expect(page).toHaveURL('http://localhost:5173/register');
  });
});