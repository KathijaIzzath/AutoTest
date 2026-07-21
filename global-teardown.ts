import { execSync } from 'child_process';
import * as path from 'path';

export default async function globalTeardown() {
  try {
    execSync(`node "${path.resolve(__dirname, 'scripts/cleanup-old-artifacts.js')}"`, {
      stdio: 'inherit',
    });
  } catch (err) {
    // Cleanup failure should never break the test run result
    console.warn('[global-teardown] Artifact cleanup encountered an error:', err);
  }
}
