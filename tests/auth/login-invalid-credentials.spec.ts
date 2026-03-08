// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Login with Invalid Credentials', async ({ page, testData }) => {
    const { nonExistentUser, validEmailWrongPassword } = testData.invalidCredentials;

    await test.step('Navigate to login page', async () => {
      await page.goto(`${testData.baseUrl}/login`);
    });

    await test.step('Submit login with a non-existent email', async () => {
      await page.getByRole('textbox', { name: 'Email' }).fill(nonExistentUser.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(nonExistentUser.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
    });

    await test.step('Verify error is shown and user stays on login page', async () => {
      await expect(page.getByText('Invalid email or password')).toBeVisible({
        message: 'Generic error message should be shown — avoid revealing whether the email exists',
      });
      await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(nonExistentUser.email, {
        message: 'Email field should retain its value after failed login',
      });
      await expect(page).toHaveURL(`${testData.baseUrl}/login`, {
        message: 'Failed login should not navigate away from /login',
      });
    });

    await test.step('Submit login with valid email but wrong password', async () => {
      await page.getByRole('textbox', { name: 'Email' }).fill(validEmailWrongPassword.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(validEmailWrongPassword.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
    });

    await test.step('Verify same generic error is shown and no session is created', async () => {
      await expect(page.getByText('Invalid email or password')).toBeVisible({
        message: 'Same generic error should be shown for wrong password — error messages must not differentiate between unknown email and wrong password',
      });
      await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(validEmailWrongPassword.email, {
        message: 'Email field should retain its value after failed login',
      });
      await expect(page).toHaveURL(`${testData.baseUrl}/login`, {
        message: 'Failed login should not navigate away from /login',
      });
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({
        message: 'Sign In button should still be visible — no session was created',
      });
    });
  });
});
