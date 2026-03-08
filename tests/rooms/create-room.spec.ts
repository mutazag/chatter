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
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(roomCreator.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(roomCreator.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(roomCreator.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Registration must succeed before we can test room creation',
      });
    });

    await test.step('Open the room creation modal (FR-RM-012)', async () => {
      await page.getByTitle('Browse / Create rooms').click();
      await expect(page.getByRole('heading', { name: 'Rooms', exact: true })).toBeVisible({
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
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(roomCreator.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(roomCreator.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(roomCreator.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
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
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(roomCreator.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(roomCreator.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(roomCreator.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
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

  test('Browse public rooms list shows available rooms', async ({ page, testData }) => {
    const owner = testData.generateTestUser('browseowner');
    const browser = testData.generateTestUser('browsereader');
    const publicRoomName = `public${TestDbCleanup.generateTestId()}`;
    const publicRoomDesc = 'A room for browsing tests';

    await test.step('Register owner and create a public room (prerequisite)', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(owner.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(owner.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(owner.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Owner registration must succeed before creating a room',
      });
      await page.getByTitle('Browse / Create rooms').click();
      await page.getByText('+ Create Room').click();
      await page.getByLabel('Room name').fill(publicRoomName);
      await page.getByLabel('Description (optional)').fill(publicRoomDesc);
      await page.getByRole('button', { name: 'Create Room' }).click();
      await expect(page.getByRole('heading', { name: 'Create Room' })).not.toBeVisible({
        message: 'Room creation must complete before switching to the browsing user',
      });
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/login`, {
        message: 'Owner must be signed out before registering the browsing user',
      });
    });

    await test.step('Register a second user', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(browser.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(browser.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(browser.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Second user registration must succeed before testing the browse list',
      });
    });

    await test.step('Open the browse rooms list', async () => {
      await page.getByTitle('Browse / Create rooms').click();
      await expect(page.getByRole('heading', { name: 'Rooms', exact: true })).toBeVisible({
        message: 'Rooms modal should open',
      });
      await expect(page.getByRole('heading', { name: 'Browse Rooms' })).toBeVisible({
        message: '"Browse Rooms" section should be visible in the modal',
      });
    });

    await test.step('Verify the public room appears in the list with correct details', async () => {
      const roomRow = page.locator('.room-browser-item').filter({ hasText: publicRoomName });
      await expect(roomRow.getByText(`# ${publicRoomName}`)).toBeVisible({
        message: 'Public room created by another user should appear in the browse list',
      });
      await expect(roomRow.getByText(publicRoomDesc)).toBeVisible({
        message: 'Room description should be shown in the browse list',
      });
      await expect(roomRow.getByRole('button', { name: 'Join' })).toBeVisible({
        message: 'Each browsable room should show a Join button',
      });
    });
  });

  test('Join a public room from the browse list', async ({ page, testData }) => {
    const owner = testData.generateTestUser('joinowner');
    const joiner = testData.generateTestUser('joinuser');
    const publicRoomName = `joinroom${TestDbCleanup.generateTestId()}`;

    await test.step('Register owner and create a public room (prerequisite)', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(owner.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(owner.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(owner.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Owner registration must succeed before creating the room to join',
      });
      await page.getByTitle('Browse / Create rooms').click();
      await page.getByText('+ Create Room').click();
      await page.getByLabel('Room name').fill(publicRoomName);
      await page.getByRole('button', { name: 'Create Room' }).click();
      await expect(page.getByRole('heading', { name: 'Create Room' })).not.toBeVisible({
        message: 'Room creation must complete before switching to the joining user',
      });
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/login`, {
        message: 'Owner must be signed out before registering the joining user',
      });
    });

    await test.step('Register the joining user', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(joiner.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(joiner.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(joiner.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Joining user registration must succeed before testing join functionality',
      });
    });

    await test.step('Open the browse list and join the public room', async () => {
      await page.getByTitle('Browse / Create rooms').click();
      const roomRow = page.locator('.room-browser-item').filter({ hasText: publicRoomName });
      await expect(roomRow.getByText(`# ${publicRoomName}`)).toBeVisible({
        message: 'The public room must appear in the browse list before joining',
      });
      await roomRow.getByRole('button', { name: 'Join' }).click();
    });

    await test.step('Verify the room was joined and is now active', async () => {
      await expect(page.getByRole('button', { name: `# ${publicRoomName}` })).toBeVisible({
        message: 'Joined room should appear in the sidebar',
      });
      await expect(page.getByText(`# ${publicRoomName}`)).toBeVisible({
        message: 'Active view should switch to the joined room',
      });
    });

    await test.step('Verify the room no longer appears in the browse list', async () => {
      // The modal remains open after joining — check the browse list directly without reopening
      await expect(page.locator('.room-browser-item').filter({ hasText: publicRoomName })).not.toBeVisible({
        message: 'Already-joined rooms should be removed from the browse list',
      });
    });
  });

  test('Leave a room removes it from sidebar', async ({ page, testData }) => {
    const leaver = testData.generateTestUser('leaveroom');
    const roomName = `leavetest${TestDbCleanup.generateTestId()}`;

    await test.step('Register and login (prerequisite)', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(leaver.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(leaver.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(leaver.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Registration must succeed before testing leave room',
      });
    });

    await test.step('Create a room (prerequisite)', async () => {
      await page.getByTitle('Browse / Create rooms').click();
      await page.getByText('+ Create Room').click();
      await page.getByLabel('Room name').fill(roomName);
      await page.getByRole('button', { name: 'Create Room' }).click();
      await expect(page.getByRole('button', { name: `# ${roomName}` })).toBeVisible({
        message: 'Room must appear in sidebar before testing leave',
      });
    });

    await test.step('Click the Leave button in the chat header', async () => {
      await page.getByRole('button', { name: `# ${roomName}` }).click();
      await expect(page.getByText(`# ${roomName}`)).toBeVisible({
        message: 'Room chat must be active before leaving',
      });
      await page.getByRole('button', { name: 'Leave', exact: true }).click();
    });

    await test.step('Verify room is removed from the sidebar and active view resets', async () => {
      await expect(page.getByRole('button', { name: `# ${roomName}` })).not.toBeVisible({
        message: 'Room should be removed from the sidebar after leaving',
      });
      await expect(page.getByText(`# ${roomName}`)).not.toBeVisible({
        message: 'Active view should no longer show the left room',
      });
    });
  });

  test('Private room is not visible in public browse list', async ({ page, testData }) => {
    const owner = testData.generateTestUser('privateowner');
    const nonMember = testData.generateTestUser('nonmember');
    const privateRoomName = `private${TestDbCleanup.generateTestId()}`;

    await test.step('Register owner and create a private room (prerequisite)', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(owner.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(owner.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(owner.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Owner registration must succeed before creating the private room',
      });
      await page.getByTitle('Browse / Create rooms').click();
      await page.getByText('+ Create Room').click();
      await page.getByLabel('Room name').fill(privateRoomName);
      await page.getByLabel('Private room').check();
      await page.getByRole('button', { name: 'Create Room' }).click();
      await expect(page.getByRole('button', { name: `# ${privateRoomName}` })).toBeVisible({
        message: 'Private room must be created before testing visibility for non-members',
      });
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/login`, {
        message: 'Owner must be signed out before registering the non-member user',
      });
    });

    await test.step('Register a non-member user', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(nonMember.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(nonMember.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(nonMember.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Non-member registration must succeed before testing browse list visibility',
      });
    });

    await test.step('Open the browse list and verify the private room is not shown', async () => {
      await page.getByTitle('Browse / Create rooms').click();
      await expect(page.getByRole('heading', { name: 'Browse Rooms' })).toBeVisible({
        message: 'Browse Rooms section should be visible',
      });
      await expect(page.getByText(`# ${privateRoomName}`)).not.toBeVisible({
        message: 'Private rooms must not appear in the public browse list for non-members',
      });
    });
  });

  test('Room member list shows all joined members', async ({ page, testData }) => {
    const owner = testData.generateTestUser('membersowner');
    const joiner = testData.generateTestUser('membersjoiner');
    const roomName = `memberstest${TestDbCleanup.generateTestId()}`;

    await test.step('Register owner and create a public room (prerequisite)', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(owner.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(owner.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(owner.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Owner registration must succeed before creating the room',
      });
      await page.getByTitle('Browse / Create rooms').click();
      await page.getByText('+ Create Room').click();
      await page.getByLabel('Room name').fill(roomName);
      await page.getByRole('button', { name: 'Create Room' }).click();
      await expect(page.getByRole('button', { name: `# ${roomName}` })).toBeVisible({
        message: 'Room must be created before the second user joins',
      });
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/login`, {
        message: 'Owner must be signed out before registering the second user',
      });
    });

    await test.step('Register second user and join the room (prerequisite)', async () => {
      await page.goto(`${testData.baseUrl}/register`);
      await page.getByRole('textbox', { name: 'Username' }).fill(joiner.username);
      await page.getByRole('textbox', { name: 'Email' }).fill(joiner.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(joiner.password);
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(`${testData.baseUrl}/chat`, {
        message: 'Second user registration must succeed before joining the room',
      });
      await page.getByTitle('Browse / Create rooms').click();
      const roomRow = page.locator('.room-browser-item').filter({ hasText: roomName });
      await roomRow.getByRole('button', { name: 'Join' }).click();
      await expect(page.getByRole('button', { name: `# ${roomName}` })).toBeVisible({
        message: 'Second user must join the room before testing the member list',
      });
      await page.keyboard.press('Escape');
      await expect(page.getByRole('heading', { name: 'Rooms', exact: true })).not.toBeVisible({
        message: 'Rooms modal must be closed before interacting with the sidebar',
      });
    });

    await test.step('Open the Members modal and verify both members are shown', async () => {
      await page.getByRole('button', { name: `# ${roomName}` }).click();
      await page.getByRole('button', { name: 'Members', exact: true }).click();
      const membersList = page.locator('.modal-body');
      await expect(membersList.getByText(owner.username)).toBeVisible({
        message: 'Room owner should appear in the member list',
      });
      await expect(membersList.getByText(joiner.username)).toBeVisible({
        message: 'Second user who joined should also appear in the member list',
      });
    });
  });
});
