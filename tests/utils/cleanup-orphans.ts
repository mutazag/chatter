/**
 * Standalone script to clean up orphaned test data left behind by aborted or
 * crashed test runs. Normally the testData fixture handles cleanup automatically
 * after each test, but if a run is killed mid-execution some data may remain.
 *
 * Usage:
 *   npm run test:cleanup              — cleans all known test prefixes
 *   npm run test:cleanup -- loginuser — cleans a specific prefix only
 */

import { TestDbCleanup } from './db-cleanup';

// All prefixes used by generateTestUser() / generateTestUsername() across spec files.
// Keep this list in sync when new tests are added.
const ALL_TEST_PREFIXES = [
  // auth
  'validuser',
  'loginuser',
  'logoutuser',
  'firstuser',
  'anotheruser',
  'passwordtest',
  // rooms
  'roomcreator',
  'duproom',
  'privateroom',
  'browseowner',
  'browsereader',
  'joinowner',
  'joinuser',
  'privateowner',
  'nonmember',
  'leaveroom',
  'membersowner',
  'membersjoiner',
];

async function run() {
  const pattern = process.argv[2];

  if (pattern) {
    console.log(`Cleaning up pattern: "${pattern}"`);
    await TestDbCleanup.cleanupByPattern(pattern);
  } else {
    console.log(`Cleaning up ${ALL_TEST_PREFIXES.length} known test prefixes...`);
    for (const prefix of ALL_TEST_PREFIXES) {
      await TestDbCleanup.cleanupByPattern(prefix);
    }
    console.log('All prefixes processed.');
  }

  await TestDbCleanup.disconnect();
}

run().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
