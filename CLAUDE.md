# Claude Instructions for This Project

## Playwright Test Practices

All Playwright tests must follow the practices documented in [`tests/README.md`](tests/README.md#test-authoring-practices).

## Test Progress Tracker

[`tests/TEST_PROGRESS.md`](tests/TEST_PROGRESS.md) is the single source of truth for test implementation progress.

**Always update `TEST_PROGRESS.md` when:**
- A new test is implemented (change ⬜ to ✅ and increment the counts)
- A test is found to be blocked by a missing app feature (change ⬜ to ⛔ with a reason)
- A blocked test becomes unblocked and is implemented
- A new test case is added to a spec file
- A test is removed or renamed

Update both the summary table at the top and the matching row in the detail section.
