// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Registration Password Length Validation', async ({ page, testData }) => {
    const { shortPassword } = testData.invalidCredentials;

    // Generate unique user credentials for this test
    const testUser = testData.generateTestUser('passwordtest');

    // Navigate to registration page to test password length validation
    await page.goto('http://localhost:5173/register');

    // Enter a valid username for password validation test
    await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);

    // Enter a valid email for password validation test
    await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);

    // Enter a password with fewer than 6 characters to test client-side validation
    await page.getByRole('textbox', { name: 'Password' }).fill(shortPassword.password);

    // Attempt to submit the form with a short password to test client-side validation
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify that the password length validation error message is displayed
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();

    // Verify that the username field retained its value after validation failure
    await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue(testUser.username);

    // Verify that the email field retained its value after validation failure
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(testUser.email);

    // Verify that we're still on the registration page (no network request was made)
    await expect(page).toHaveURL('http://localhost:5173/register');

    // Enter a valid password with at least 6 characters to test successful submission after correction
    await page.getByRole('textbox', { name: 'Password' }).fill(testUser.password);

    // Submit the form with a valid password to verify successful registration after correction
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify successful registration after password correction
    await expect(page.getByText(testUser.username)).toBeVisible();

    // Verify successful redirect to /chat after correction
    await expect(page).toHaveURL('http://localhost:5173/chat');
  });
});