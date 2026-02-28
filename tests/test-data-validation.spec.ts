import { test, expect } from './setup';

test.describe('Test Data Configuration', () => {
  test('should load test data from configuration file', async ({ testData }) => {
    // Verify that test data is loaded correctly
    expect(testData.users.validUser).toBeDefined();
    expect(testData.users.validUser.email).toContain('@');
    expect(testData.users.validUser.password).toBeTruthy();

    expect(testData.users.loginUser).toBeDefined();
    expect(testData.users.duplicateEmail).toBeDefined();

    expect(testData.invalidCredentials.nonExistentUser).toBeDefined();
    expect(testData.invalidCredentials.validEmailWrongPassword).toBeDefined();

    expect(testData.testRoom).toBeDefined();
    expect(testData.testRoom.name).toBeTruthy();
  });
});