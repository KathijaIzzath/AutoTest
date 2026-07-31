import { execSync } from 'child_process';
import * as path from 'path';

export default async function globalTeardown() {
  // ── Clean up old artifacts ─────────────────────────────────────────────
  try {
    execSync(`node "${path.resolve(__dirname, 'scripts/cleanup-old-artifacts.js')}"`, {
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn('[global-teardown] Artifact cleanup encountered an error:', err);
  }
}
