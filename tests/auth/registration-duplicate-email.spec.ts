// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Registration with Duplicate Email', async ({ page, testData }) => {
    const { duplicateEmail } = testData.users;
    const testUser = testData.generateTestUser('firstuser');

    await test.step('Register first user with a specific email (prerequisite)', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(testUser.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(testUser.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'First registration should succeed before we can test duplicate email rejection',
      });
      await page.getByRole('button', { name: 'Sign out' }).click();
    });

    await test.step('Attempt to register a second user with the same email', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      const anotherUsername = testData.generateTestUsername('anotheruser');
      await page.getByRole('textbox', { name: 'Username' }).fill(anotherUsername);
      await page.getByRole('textbox', { name: 'Email' }).fill(testUser.email);
      await page.getByRole('textbox', { name: 'Password' }).fill('password456');
      await page.getByRole('button', { name: 'Create Account' }).click();

      await test.step('Verify duplicate email error is shown', async () => {
        await expect(page.getByText('Email already in use')).toBeVisible({
          message: 'Server should reject registration with an already-registered email',
        });
      });

      await test.step('Verify form stays open with values retained', async () => {
        await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible({
          message: 'Create Account button should still be visible — form should not have been dismissed',
        });
        await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue(anotherUsername, {
          message: 'Username field should retain its value after failed submission',
        });
        await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue(testUser.email, {
          message: 'Email field should retain its value after failed submission',
        });
      });

      await test.step('Verify no navigation occurred', async () => {
        await expect(page).toHaveURL(`${testData.baseUrl}/register`, {
          message: 'Failed registration should not navigate away from /register',
        });
      });
    });
  });
});
