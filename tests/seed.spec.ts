import { test, expect } from '@playwright/test';

test.describe('Application Verification', () => {
  test('verify playwright configuration', async ({ page }) => {
    // Test that basic Playwright functionality works
    await page.goto('https://playwright.dev');
    await expect(page).toHaveTitle(/Playwright/);
  });

  test.skip('should load the application homepage', async ({ page }) => {
    // This test requires the dev servers to be running
    // Run with: npm run test -- --grep "should load the application homepage"
    // After starting servers with: npm run dev --workspace=server & npm run dev --workspace=client
    await page.goto('/');
    await expect(page).toHaveTitle(/Chatter/);
  });
});
