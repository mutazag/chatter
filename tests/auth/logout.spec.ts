// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';

test.describe('Authentication and Session Management', () => {
  test('Successful User Logout', async ({ page, testData }) => {
    // Generate unique user credentials for this test
    const logoutUser = testData.generateTestUser('logoutuser');

    // First, register and login a test user (prerequisite)
    await page.goto('http://localhost:5173/register');
    await page.getByRole('textbox', { name: 'Username' }).fill(logoutUser.username);
    await page.getByRole('textbox', { name: 'Email' }).fill(logoutUser.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(logoutUser.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify user is logged in and has access to authenticated content
    await expect(page.getByText(logoutUser.username)).toBeVisible();
    await expect(page.getByText('Welcome to Chatter')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page).toHaveURL('http://localhost:5173/chat');

    // Test logout functionality - click the Sign out button
    await page.getByRole('button', { name: 'Sign out' }).click();

    // Verify user is redirected to login page after logout
    await expect(page).toHaveURL('http://localhost:5173/login');

    // Verify authentication state is cleared - protected content should not be accessible
    await expect(page.getByText(logoutUser.username)).not.toBeVisible();
    await expect(page.getByText('Welcome to Chatter')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).not.toBeVisible();

    // Verify login form is available for re-authentication
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // Verify user cannot access protected routes directly after logout
    await page.goto('http://localhost:5173/chat');
    await expect(page).toHaveURL('http://localhost:5173/login');

    // Verify that user can log back in with same credentials (session properly cleared)
    await page.getByRole('textbox', { name: 'Email' }).fill(logoutUser.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(logoutUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify successful re-login after logout
    await expect(page.getByText(logoutUser.username)).toBeVisible();
    await expect(page.getByText('Welcome to Chatter')).toBeVisible();
    await expect(page).toHaveURL('http://localhost:5173/chat');
  });
});