// spec: specs/chatter-functional-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '../setup';
import { TestDbCleanup } from '../utils/db-cleanup';

test.describe('Room Management', () => {
  test('Create Room - FR-RM-012, FR-RM-013', async ({ page, testData }) => {
    const roomCreator = testData.generateTestUser('roomcreator');
    const roomName = `testroom${TestDbCleanup.generateTestId()}`;
    const roomDescription = 'A test room for automated testing purposes';

    await test.step('Register and login a user (prerequisite)', async () => {
      await page.goto('http://localhost:5173/register');
      await page.getByRole('textbox', { name: 'Username' }).fill(roomCreator.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(roomCreator.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(roomCreator.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL('http://localhost:5173/chat', {
        message: 'Registration must succeed before we can test room creation',
      });
    });

    await test.step('Open the room creation modal (FR-RM-012)', async () => {
      await page.getByTitle('Browse / Create rooms').click();
      await expect(page.getByRole('heading', { name: 'Rooms' })).toBeVisible({
        message: 'Rooms modal should open after clicking the browse/create button',
      });
      await page.getByText('+ Create Room').click();
      await expect(page.getByRole('heading', { name: 'Create Room' })).toBeVisible({
        message: 'Create Room modal should open after clicking "+ Create Room"',
      });
    });

    await test.step('Fill in and submit the create room form', async () => {
      await page.getByLabel('Room name').fill(roomName);
      await page.getByLabel('Description (optional)').fill(roomDescription);
      await page.getByRole('button', { name: 'Create Room' }).click();
    });

    await test.step('Verify room was created successfully (FR-RM-013)', async () => {
      await expect(page.getByRole('heading', { name: 'Create Room' })).not.toBeVisible({
        message: 'Create Room modal should close after successful creation',
      });
      await expect(page.getByRole('button', { name: `# ${roomName}` })).toBeVisible({
        message: 'New room should appear in the sidebar after creation',
      });
      await expect(page.getByText(`# ${roomName}`)).toBeVisible({
        message: 'Chat area should display the new room name, confirming the active view switched to it',
      });
      await expect(page).toHaveURL(/\/chat/, {
        message: 'Should remain on the chat page after room creation',
      });
    });

    await test.step('Verify the room is accessible by clicking it in the sidebar', async () => {
      await page.getByRole('button', { name: `# ${roomName}` }).click();
      await expect(page.getByText(`# ${roomName}`)).toBeVisible({
        message: 'Room content should be visible after clicking the room in the sidebar',
      });
    });
  });

  test('Create Room - Duplicate Name Error (FR-RM-002)', async ({ page, testData }) => {
    const roomCreator = testData.generateTestUser('duproom');
    const duplicateRoomName = `duplicate${TestDbCleanup.generateTestId()}`;

    await test.step('Register and login a user (prerequisite)', async () => {
      await page.goto('http://localhost:5173/register');
      await page.getByRole('textbox', { name: 'Username' }).fill(roomCreator.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(roomCreator.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(roomCreator.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL('http://localhost:5173/chat', {
        message: 'Registration must succeed before we can test duplicate room name handling',
      });
    });

    await test.step('Create the first room', async () => {
      await page.getByTitle('Browse / Create rooms').click();
      await page.getByText('+ Create Room').click();
      await page.getByLabel('Room name').fill(duplicateRoomName);
      await page.getByRole('button', { name: 'Create Room' }).click();
      await expect(page.getByRole('heading', { name: 'Create Room' })).not.toBeVisible({
        message: 'Modal should close after successful first room creation',
      });
      await expect(page.getByRole('button', { name: `# ${duplicateRoomName}` })).toBeVisible({
        message: 'First room should appear in the sidebar confirming it was created',
      });
    });

    await test.step('Attempt to create a second room with the same name', async () => {
      await page.getByTitle('Browse / Create rooms').click();
      await page.getByText('+ Create Room').click();
      await page.getByLabel('Room name').fill(duplicateRoomName);
      await page.getByRole('button', { name: 'Create Room' }).click();
    });

    await test.step('Verify duplicate name error is shown and modal stays open (FR-RM-002)', async () => {
      await expect(page.getByText('Room name already taken')).toBeVisible({
        message: 'Server should reject duplicate room name with an error message',
      });
      await expect(page.getByRole('heading', { name: 'Create Room' })).toBeVisible({
        message: 'Create Room modal should remain open after a failed submission',
      });
    });
  });

  test('Create Private Room', async ({ page, testData }) => {
    const roomCreator = testData.generateTestUser('privateroom');
    const privateRoomName = `private${TestDbCleanup.generateTestId()}`;

    await test.step('Register and login a user (prerequisite)', async () => {
      await page.goto('http://localhost:5173/register');
      await page.getByRole('textbox', { name: 'Username' }).fill(roomCreator.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(roomCreator.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(roomCreator.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL('http://localhost:5173/chat', {
        message: 'Registration must succeed before we can test private room creation',
      });
    });

    await test.step('Create a private room', async () => {
      await page.getByTitle('Browse / Create rooms').click();
      await page.getByText('+ Create Room').click();
      await page.getByLabel('Room name').fill(privateRoomName);
      await page.getByLabel('Private room').check();
      await page.getByRole('button', { name: 'Create Room' }).click();
    });

    await test.step('Verify private room appears in the creator\'s sidebar', async () => {
      await expect(page.getByRole('button', { name: `# ${privateRoomName}` })).toBeVisible({
        message: 'Private room should appear in the creator\'s sidebar after creation',
      });
    });
  });

  test.skip('Browse public rooms list shows available rooms', async () => {});
  test.skip('Join a public room from the browse list', async () => {});
  test.skip('Leave a room removes it from sidebar', async () => {});
  test.skip('Private room is not visible in public browse list', async () => {});
  test.skip('Room member list shows all joined members', async () => {});
});
