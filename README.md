# AutoTest

Playwright-based end-to-end automation suite for SecureConnect modules.

## Quick Links

1. Test execution and reporting guide: [tests/README_EXECUTION_AND_REPORTING.md](tests/README_EXECUTION_AND_REPORTING.md)
2. Claims Archive restrictions/dependencies matrix: [tests/Claims/README_07_ClaimsArchive_RestrictionsDependencies_test.spec.md](tests/Claims/README_07_ClaimsArchive_RestrictionsDependencies_test.spec.md)
3. Claims restrictions/dependencies matrix: [tests/Claims/README_06_Claims_RestrictionsDependencies_test.spec.md](tests/Claims/README_06_Claims_RestrictionsDependencies_test.spec.md)

## Run Tests

1. Full suite (foreground): `npm test`
2. Chromium only: `npm run test:chromium`
3. **Background / RDP-safe** (keeps running if RDP or terminal disconnects):
   - Start: `npm run test:detached` or `npm run test:detached:chromium`
   - Status / log tail: `npm run test:status`
   - Stop (only manual stop): `npm run test:stop`
   - Stronger Windows isolation: `npm run test:detached:task`
   - Install daily local schedule: `npm run schedule:install`
4. Open Playwright report: `npm run report`

GitHub Actions schedule/manual runs already execute on GitHub runners (not your RDP session), so they are not affected by local disconnects.
