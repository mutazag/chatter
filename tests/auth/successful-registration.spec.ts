// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Successful User Registration', async ({ page, testData }) => {
    const testUser = testData.generateTestUser('validuser');

    await test.step('Navigate to registration page', async () => {
      await page.goto(`${testData.baseUrl}`);
      await page.getByRole('link', { name: 'Register' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/register`, {
        message: 'Clicking Register link should navigate to /register',
      });
    });

    await test.step('Fill in registration form with valid credentials', async () => {
      await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(testUser.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
    });

    await test.step('Verify redirect to chat after registration', async () => {
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Successful registration should redirect to /chat',
      });
    });

    await test.step('Verify authenticated session is established', async () => {
      await expect(page.getByText(testUser.username)).toBeVisible({
        message: 'Username should appear in the header confirming the session belongs to the registered user',
      });
      await expect(page.getByText('Welcome to Chatter')).toBeVisible({
        message: 'Welcome message should be visible confirming access to authenticated content',
      });
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible({
        message: 'Sign out button should be available confirming authenticated state',
      });
    });
  });
});
