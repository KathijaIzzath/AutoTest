/**
 * Background worker used by run-tests-detached.cjs.
 * - Holds an OS sleep-lock while the suite runs (Windows)
 * - Forwards to run-tests.cjs (non-interactive)
 * - Never attached to a user terminal
 */
'use strict';

const path = require('path');
const { spawn, execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

function parseArgs(argv) {
  let envFlag = process.env.TEST_ENV || 'qa';
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
      envFlag = arg.slice('--env='.length).trim().toLowerCase() || 'qa';
      continue;
    }
    if (arg === '--env') {
      envFlag = String(argv[i + 1] || 'qa').trim().toLowerCase();
      i += 1;
    }
  }
  return { envFlag, forwarded };
}

function acquireSleepLock() {
  if (!isWindows) return null;
  try {
    // ES_CONTINUOUS (0x80000000) | ES_SYSTEM_REQUIRED (0x00000001) | ES_AWAYMODE_REQUIRED (0x00000040)
    execSync(
      `powershell -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class P { [DllImport(\\"kernel32.dll\\")] public static extern uint SetThreadExecutionState(uint f); }'; [void][P]::SetThreadExecutionState(0x80000041)"`,
      { stdio: 'ignore' },
    );
    console.log('[detached-worker] Sleep lock acquired (system will stay awake while suite runs).');
    return true;
  } catch (err) {
    console.warn('[detached-worker] Could not acquire sleep lock:', err.message || err);
    return null;
  }
}

function releaseSleepLock() {
  if (!isWindows) return;
  try {
    execSync(
      `powershell -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class P { [DllImport(\\"kernel32.dll\\")] public static extern uint SetThreadExecutionState(uint f); }'; [void][P]::SetThreadExecutionState(0x80000000)"`,
      { stdio: 'ignore' },
    );
  } catch {
    // ignore
  }
}

function main() {
  const { envFlag, forwarded } = parseArgs(process.argv.slice(2));
  process.env.TEST_ENV = envFlag;
  process.env.AUTOTEST_DETACHED = '1';
  // Keep CI unset so Playwright does not apply the short CI globalTimeout.

  console.log(`[detached-worker] Starting suite TEST_ENV=${envFlag} pid=${process.pid}`);
  console.log(`[detached-worker] cwd=${ROOT}`);
  if (process.env.AUTOTEST_DETACHED_LOG) {
    console.log(`[detached-worker] log=${process.env.AUTOTEST_DETACHED_LOG}`);
  }

  acquireSleepLock();

  const args = [path.join(__dirname, 'run-tests.cjs'), `--env=${envFlag}`];
  if (forwarded.length) {
    args.push('--', ...forwarded);
  }

  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  });

  const shutdown = (signal) => {
    console.log(`[detached-worker] Received ${signal}; stopping suite...`);
    try {
      if (isWindows) {
        execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      // ignore
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  child.on('exit', (code, signal) => {
    releaseSleepLock();
    console.log(`[detached-worker] Suite finished code=${code} signal=${signal || ''}`);
    process.exit(code ?? 1);
  });
}

main();
