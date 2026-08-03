/**
 * Interactive / non-interactive test runner with QA vs Staging selection.
 *
 * Usage:
 *   node scripts/run-tests.cjs                  → prompts when TTY; else QA
 *   node scripts/run-tests.cjs --env=staging    → staging (no prompt)
 *   node scripts/run-tests.cjs --env=qa         → QA (no prompt)
 *   TEST_ENV=staging node scripts/run-tests.cjs → staging
 *
 * Extra args after `--` are forwarded to Playwright, e.g.:
 *   node scripts/run-tests.cjs --env=staging -- --project=chromium
 */
'use strict';

const { spawn } = require('child_process');
const readline = require('readline');

function parseArgs(argv) {
  let envFlag = '';
  const forwarded = [];
  let passThrough = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (passThrough) {
      forwarded.push(arg);
      continue;
    }
    if (arg === '--') {
      passThrough = true;
      continue;
    }
    if (arg.startsWith('--env=')) {
      envFlag = arg.slice('--env='.length).trim().toLowerCase();
      continue;
    }
    if (arg === '--env') {
      envFlag = String(argv[i + 1] || '').trim().toLowerCase();
      i += 1;
      continue;
    }
    forwarded.push(arg);
  }

  return { envFlag, forwarded };
}

function normalizeEnv(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'staging' || v === 'scdemo' || v === 's') return 'staging';
  if (v === 'qa' || v === 'q' || v === 'qnk' || v === '') return 'qa';
  return null;
}

function promptEnvironment() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('');
    console.log('AutoTest environment selection');
    console.log('  1) qa       → https://qnk1scltweb02.pulseinc.com  (default / daily cron)');
    console.log('  2) staging  → https://scdemo.pulseinc.com');
    console.log('');
    rl.question('Do you want to run on QA or Staging? [qa/staging] (default: qa): ', (answer) => {
      rl.close();
      const normalized = normalizeEnv(answer);
      resolve(normalized || 'qa');
    });
  });
}

async function resolveEnvironment(envFlag) {
  // Explicit CLI / env wins
  if (process.env.TEST_ENV) {
    return normalizeEnv(process.env.TEST_ENV) || 'qa';
  }
  if (envFlag) {
    return normalizeEnv(envFlag) || 'qa';
  }

  // CI never prompts — always QA unless workflow_dispatch sets TEST_ENV
  if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
    return 'qa';
  }

  // Non-interactive shells default to QA
  if (!process.stdin.isTTY) {
    return 'qa';
  }

  return promptEnvironment();
}

async function main() {
  const { envFlag, forwarded } = parseArgs(process.argv.slice(2));
  const testEnv = await resolveEnvironment(envFlag);

  process.env.TEST_ENV = testEnv;
  // Ensure scheduled semantics aren't inherited oddly on local shells
  if (testEnv === 'staging') {
    delete process.env.FORCE_TEST_ENV;
  }

  console.log(`[run-tests] TEST_ENV=${testEnv}`);
  if (testEnv === 'staging') {
    console.log('[run-tests] Target: https://scdemo.pulseinc.com/SecureConnectWeb/login');
    console.log('[run-tests] DB host: pnk1scstgaio.ict.pulseinc.com:5432');
  } else {
    console.log('[run-tests] Target: https://qnk1scltweb02.pulseinc.com/SecureConnectWeb/login');
    console.log('[run-tests] DB host: Qnk1scltdb02.ict.pulseinc.com:5432');
  }

  const playwrightArgs = ['playwright', 'test', ...forwarded];
  const child = spawn('npx', playwrightArgs, {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error('[run-tests] Failed:', err);
  process.exit(1);
});
