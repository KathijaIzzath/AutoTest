import { execSync } from 'child_process';
import * as path from 'path';

export default async function globalTeardown() {
  // ── 1. Generate the Desktop daily HTML report from the JSON results ──────
  try {
    execSync(`node "${path.resolve(__dirname, 'scripts/generate-daily-report.js')}"`, {
      stdio: 'inherit',
    });
  } catch (err) {
    console.warn('[global-teardown] Daily report generation failed (non-fatal):', err);
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
