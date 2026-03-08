// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Successful User Logout', async ({ page, testData }) => {
    const logoutUser = testData.generateTestUser('logoutuser');

    await test.step('Register and login a user (prerequisite)', async () => {
      await page.goto('http://localhost:5173/register');
      await page.getByRole('textbox', { name: 'Username' }).fill(logoutUser.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(logoutUser.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(logoutUser.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL('http://localhost:5173/chat', {
        message: 'Registration should succeed and redirect to /chat before we can test logout',
      });
    });

    await test.step('Verify authenticated state before logout', async () => {
      await expect(page.getByText(logoutUser.username)).toBeVisible({
        message: 'Username should appear in the header confirming the user is logged in',
      });
      await expect(page.getByText('Welcome to Chatter')).toBeVisible({
        message: 'Welcome message should be visible confirming access to authenticated content',
      });
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible({
        message: 'Sign out button should be available confirming authenticated state',
      });
    });

    await test.step('Log out', async () => {
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL('http://localhost:5173/login', {
        message: 'Logout should redirect to /login — session may not have been cleared server-side',
      });
    });

    await test.step('Verify session is fully cleared after logout', async () => {
      await expect(page.getByText(logoutUser.username)).not.toBeVisible({
        message: 'Username should no longer appear after logout',
      });
      await expect(page.getByText('Welcome to Chatter')).not.toBeVisible({
        message: 'Authenticated content should not be visible after logout',
      });
      await expect(page.getByRole('button', { name: 'Sign out' })).not.toBeVisible({
        message: 'Sign out button should not be visible after logout',
      });
      await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible({
        message: 'Login form should be shown after logout',
      });
      await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    await test.step('Verify protected routes are inaccessible after logout', async () => {
      await page.goto('http://localhost:5173/chat');
      await expect(page).toHaveURL('http://localhost:5173/login', {
        message: 'Navigating to /chat after logout should redirect to /login — route guard may not be working',
      });
    });

    await test.step('Verify user can log back in after logout', async () => {
      await page.getByRole('textbox', { name: 'Email' }).fill(logoutUser.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(logoutUser.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByText(logoutUser.username)).toBeVisible({
        message: 'Username should appear after re-login confirming credentials were not invalidated by logout',
      });
      await expect(page.getByText('Welcome to Chatter')).toBeVisible();
      await expect(page).toHaveURL('http://localhost:5173/chat', {
        message: 'Re-login should redirect to /chat',
      });
    });
  });
});
