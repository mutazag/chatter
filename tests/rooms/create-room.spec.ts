// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';
import { TestDbCleanup } from '../utils/db-cleanup';

test.describe('Room Management', () => {
  test('Create Room - FR-RM-012, FR-RM-013', async ({ page, testData }) => {
    // Generate unique user credentials for this test
    const roomCreator = testData.generateTestUser('roomcreator');
    const roomName = `testroom${TestDbCleanup.generateTestId()}`;
    const roomDescription = 'A test room for automated testing purposes';

    // First, register and login a test user (prerequisite)
    await page.goto('http://localhost:5173/register');
    await page.getByRole('textbox', { name: 'Username' }).fill(roomCreator.username);
    await page.getByRole('textbox', { name: 'Email' }).fill(roomCreator.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(roomCreator.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Verify user is logged in and at chat page
    await expect(page.getByText('Welcome to Chatter')).toBeVisible();
    await expect(page).toHaveURL('http://localhost:5173/chat');

    // Click the "+" button next to "Rooms" to open the browse/create modal
    await page.getByTitle('Browse / Create rooms').click();

    // Verify rooms modal is open
    await expect(page.getByRole('heading', { name: 'Rooms' })).toBeVisible(); // Modal title

    // Click the "+ Create Room" button to open the create room modal
    await page.getByText('+ Create Room').click();

    // Verify create room modal is visible (FR-RM-012)
    await expect(page.getByRole('heading', { name: 'Create Room' })).toBeVisible(); // Modal title

    // Fill in room name (required field)
    await page.getByLabel('Room name').fill(roomName);

    // Fill in room description (optional field)
    await page.getByLabel('Description (optional)').fill(roomDescription);

    // Leave private checkbox unchecked (default public room)
    // await page.getByLabel('Private room').check(); // Optional for private room test

    // Submit the create room form
    await page.getByRole('button', { name: 'Create Room' }).click();

    // Verify successful room creation (FR-RM-013)
    // 1. Modal should close
    await expect(page.getByRole('heading', { name: 'Create Room' })).not.toBeVisible();

    // 2. Room should appear in sidebar
    await expect(page.getByRole('button', { name: `# ${roomName}` })).toBeVisible();

    // 3. Active view should switch to new room
    await expect(page).toHaveURL(/\/chat/); // Still on chat page

    // 4. Verify we're in the correct room (room name should be displayed in chat area)
    // Note: This depends on the UI showing current room name somewhere visible
    await expect(page.getByText(`# ${roomName}`)).toBeVisible();

    // 5. Creator should be automatically added as member (verified by presence in room)
    // This is implicit if we can see the room content/interface

    // Test that the room is properly functional - try to access it by clicking
    await page.getByRole('button', { name: `# ${roomName}` }).click();
    await expect(page.getByText(`# ${roomName}`)).toBeVisible();
  });

  test('Create Room - Duplicate Name Error (FR-RM-002)', async ({ page, testData }) => {
    // Generate unique user credentials for this test
    const roomCreator = testData.generateTestUser('duproom');
    const duplicateRoomName = `duplicate${TestDbCleanup.generateTestId()}`;

    // Register and login
    await page.goto('http://localhost:5173/register');
    await page.getByRole('textbox', { name: 'Username' }).fill(roomCreator.username);
    await page.getByRole('textbox', { name: 'Email' }).fill(roomCreator.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(roomCreator.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Create first room
    await page.getByTitle('Browse / Create rooms').click();
    await page.getByText('+ Create Room').click();
    await page.getByLabel('Room name').fill(duplicateRoomName);
    await page.getByRole('button', { name: 'Create Room' }).click();

    // Wait for modal to close (indicates successful creation)
    await expect(page.getByRole('heading', { name: 'Create Room' })).not.toBeVisible();

    // Verify first room was created successfully
    await expect(page.getByRole('button', { name: `# ${duplicateRoomName}` })).toBeVisible();

    // Try to create second room with same name
    await page.getByTitle('Browse / Create rooms').click();
    await page.getByText('+ Create Room').click();
    await page.getByLabel('Room name').fill(duplicateRoomName);
    await page.getByRole('button', { name: 'Create Room' }).click();

    // Verify error message appears (FR-RM-002)
    await expect(page.locator('.auth-error')).toBeVisible();
    await expect(page.locator('.auth-error')).toHaveText('Room name already taken');

    // Verify modal remains open on error
    await expect(page.getByRole('heading', { name: 'Create Room' })).toBeVisible(); // Modal title still visible
  });

  test('Create Private Room', async ({ page, testData }) => {
    // Generate unique user credentials for this test
    const roomCreator = testData.generateTestUser('privateroom');
    const privateRoomName = `private${TestDbCleanup.generateTestId()}`;

    // Register and login
    await page.goto('http://localhost:5173/register');
    await page.getByRole('textbox', { name: 'Username' }).fill(roomCreator.username);
    await page.getByRole('textbox', { name: 'Email' }).fill(roomCreator.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(roomCreator.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Create private room
    await page.getByTitle('Browse / Create rooms').click();
    await page.getByText('+ Create Room').click();
    await page.getByLabel('Room name').fill(privateRoomName);
    await page.getByLabel('Private room').check(); // Make it private
    await page.getByRole('button', { name: 'Create Room' }).click();

    // Verify private room creation
    await expect(page.getByRole('button', { name: `# ${privateRoomName}` })).toBeVisible();

    // Private room should appear in creator's sidebar but not be publicly discoverable
    // (Further testing for privacy would require a second user account)
  });
});