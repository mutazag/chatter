// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Registration Password Length Validation', async ({ page, testData }) => {
    const { shortPassword } = testData.invalidCredentials;
    const testUser = testData.generateTestUser('passwordtest');

    await test.step('Navigate to registration page', async () => {
      await page.goto(`${testData.baseUrl}/register`);
    });

    await test.step('Submit registration form with a short password', async () => {
      await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(shortPassword.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
    });

    await test.step('Verify client-side password validation error is shown', async () => {
      await expect(page.getByText('Password must be at least 6 characters')).toBeVisible({
        message: 'Client-side validation should block submission and show a password length error',
      });
      await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue(testUser.username, {
        message: 'Username field should retain its value after validation failure',
      });
      await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(testUser.email, {
        message: 'Email field should retain its value after validation failure',
      });
      await expect(page).toHaveURL(`${testData.baseUrl}/register`, {
        message: 'Client-side validation should prevent form submission — no network request should have been made',
      });
    });

    await test.step('Correct the password and resubmit', async () => {
      await page.getByRole('textbox', { name: 'Password' }).fill(testUser.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Registration should succeed after providing a valid password',
      });
    });

    await test.step('Verify successful registration after password correction', async () => {
      await expect(page.getByText(testUser.username)).toBeVisible({
        message: 'Username should appear in the header confirming successful registration',
      });
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`);
    });
  });
});
