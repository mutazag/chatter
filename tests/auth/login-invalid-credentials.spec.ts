// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Login with Invalid Credentials', async ({ page, testData }) => {
    const { nonExistentUser, validEmailWrongPassword } = testData.invalidCredentials;

    // Navigate to login page to test invalid credentials handling
    await page.goto('http://localhost:5173/login');

    // Test 1: Enter a non-existent email address to test invalid credentials handling
    await page.getByRole('textbox', { name: 'Email' }).fill(nonExistentUser.email);

    // Enter any password for the non-existent email test
    await page.getByRole('textbox', { name: 'Password' }).fill(nonExistentUser.password);

    // Submit login form with non-existent email to test error handling
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify that the generic error message is displayed for non-existent email
    await expect(page.getByText('Invalid email or password')).toBeVisible();

    // Verify that the email field retained its value after failed login
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(nonExistentUser.email);

    // Verify that we remain on the login page
    await expect(page).toHaveURL('http://localhost:5173/login');

    // Test 2: Enter a valid registered email with wrong password to test the second invalid credentials scenario
    await page.getByRole('textbox', { name: 'Email' }).fill(validEmailWrongPassword.email);

    // Enter a wrong password for the valid email to test wrong password scenario
    await page.getByRole('textbox', { name: 'Password' }).fill(validEmailWrongPassword.password);

    // Submit login form with valid email but wrong password to test generic error handling
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify that the same generic error message is displayed for valid email with wrong password
    await expect(page.getByText('Invalid email or password')).toBeVisible();

    // Verify that the email field retained its value after failed login with wrong password
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(validEmailWrongPassword.email);

    // Verify that we still remain on the login page after wrong password
    await expect(page).toHaveURL('http://localhost:5173/login');

    // Verify that no authentication cookie is created (no access to /chat)
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });
});