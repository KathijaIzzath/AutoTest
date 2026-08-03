import { execSync } from 'child_process';
import * as path from 'path';

export default async function globalTeardown() {
  // Keep daily rollup generation optional to avoid duplicate summary paths.
  const generateDailyRollupInTeardown = process.env.GENERATE_DAILY_ROLLUP_IN_TEARDOWN === 'true';

  if (generateDailyRollupInTeardown) {
    try {
      execSync(`node "${path.resolve(__dirname, 'scripts/generate-daily-report.js')}"`, {
        stdio: 'inherit',
      });
    } catch (err) {
      console.warn('[global-teardown] Daily rollup generation failed (non-fatal):', err);
    }
  } else {
    console.log('[global-teardown] Skipping teardown daily rollup generation (handled by daily-reporter).');
  }

  // ── 2. Clean up old artifacts ─────────────────────────────────────────────
  try {
    execSync(`node "${path.resolve(__dirname, 'scripts/cleanup-old-artifacts.js')}"`, {
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn('[global-teardown] Artifact cleanup encountered an error:', err);
  }
}
