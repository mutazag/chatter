// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Successful User Login', async ({ page, testData }) => {
    const loginUser = testData.generateTestUser('loginuser');

    await test.step('Register a user account (prerequisite)', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(loginUser.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(loginUser.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(loginUser.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Registration should succeed and redirect to /chat before we can test login',
      });
    });

    await test.step('Sign out to prepare for login test', async () => {
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/login`, {
        message: 'Sign out should redirect to /login',
      });
    });

    await test.step('Submit login form with valid credentials', async () => {
      await page.getByRole('textbox', { name: 'Email' }).fill(loginUser.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(loginUser.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
    });

    await test.step('Verify redirect to chat after login', async () => {
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Successful login should redirect to /chat',
      });
    });

    await test.step('Verify authenticated session is established', async () => {
      await expect(page.getByText(loginUser.username)).toBeVisible({
        message: 'Username should appear in the header confirming the correct user is logged in',
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
