/**
 * Detached / session-resilient suite runner (Windows-friendly).
 *
 * Starts the Playwright suite in a background process that:
 *   - is detached from the current terminal / Cursor / RDP interactive job
 *   - keeps writing logs even if the RDP session disconnects
 *   - requests the OS stay awake while the suite runs (AC power)
 *   - stops ONLY via: npm run test:stop  (or: node scripts/run-tests-detached.cjs stop)
 *
 * Usage:
 *   node scripts/run-tests-detached.cjs start --env=qa
 *   node scripts/run-tests-detached.cjs start --env=qa -- --project=chromium
 *   node scripts/run-tests-detached.cjs status
 *   node scripts/run-tests-detached.cjs stop
 *
 * Stronger isolation (Windows Task Scheduler one-shot, survives logoff better):
 *   node scripts/run-tests-detached.cjs start --via-task --env=qa
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LOG_DIR = path.join(ROOT, 'logs', 'detached');
const STATE_PATH = path.join(LOG_DIR, 'current.json');
const isWindows = process.platform === 'win32';

function ensureLogDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function parseArgs(argv) {
  const action = (argv[0] || 'start').toLowerCase();
  let envFlag = 'qa';
  let viaTask = false;
  const forwarded = [];
  let passThrough = false;

  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (passThrough) {
      forwarded.push(arg);
      continue;
    }
    if (arg === '--') {
      passThrough = true;
      continue;
    }
    if (arg === '--via-task') {
      viaTask = true;
      continue;
    }
    if (arg.startsWith('--env=')) {
      envFlag = arg.slice('--env='.length).trim().toLowerCase() || 'qa';
      continue;
    }
    if (arg === '--env') {
      envFlag = String(argv[i + 1] || 'qa').trim().toLowerCase();
      i += 1;
      continue;
    }
    forwarded.push(arg);
  }

  if (envFlag === 's' || envFlag === 'scdemo') envFlag = 'staging';
  if (envFlag === 'q' || envFlag === 'qnk') envFlag = 'qa';
  return { action, envFlag, viaTask, forwarded };
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeState(state) {
  ensureLogDir();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function clearState() {
  try {
    fs.unlinkSync(STATE_PATH);
  } catch {
    // ignore
  }
}

function isPidAlive(pid) {
  if (!pid || !Number.isFinite(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function killProcessTree(pid) {
  if (!pid) return;
  if (isWindows) {
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // already gone
    }
    return;
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // ignore
    }
  }
}

function buildNodeCommand(envFlag, forwarded) {
  const args = [path.join('scripts', 'run-tests-background-worker.cjs'), `--env=${envFlag}`];
  if (forwarded.length) {
    args.push('--', ...forwarded);
  }
  return { command: process.execPath, args };
}

function startDetachedProcess(envFlag, forwarded) {
  ensureLogDir();
  const existing = readState();
  if (existing?.pid && isPidAlive(existing.pid)) {
    console.error(`[detached] A suite is already running (pid=${existing.pid}).`);
    console.error(`[detached] Log: ${existing.logFile}`);
    console.error('[detached] Stop it first with: npm run test:stop');
    process.exit(1);
  }

  const id = stamp();
  const logFile = path.join(LOG_DIR, `suite-${id}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  const { command, args } = buildNodeCommand(envFlag, forwarded);

  const child = spawn(command, args, {
    cwd: ROOT,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      TEST_ENV: envFlag,
      // Non-interactive, but do NOT set CI=true — that enables the 55-minute
      // Playwright globalTimeout and would kill long full-suite runs.
      AUTOTEST_DETACHED: '1',
      AUTOTEST_DETACHED_LOG: logFile,
      AUTOTEST_DETACHED_ID: id,
      // Always write the date rollup into DailyExecution[/Staging].
      AUTOTEST_DAILY_ROLLUP: '1',
      AUTOTEST_SCOPE: 'full',
      // Reduce stdout buffering so progress appears in the log promptly.
      NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --trace-uncaught`.trim(),
    },
  });

  child.stdout?.on('data', (chunk) => logStream.write(chunk));
  child.stderr?.on('data', (chunk) => logStream.write(chunk));
  child.on('close', () => {
    try {
      logStream.end();
    } catch {
      // ignore
    }
  });

  child.unref();

  const state = {
    id,
    pid: child.pid,
    env: envFlag,
    startedAt: new Date().toISOString(),
    logFile,
    command: [command, ...args].join(' '),
    mode: 'detached-process',
  };
  writeState(state);

  console.log('[detached] Suite started in background (survives terminal/RDP disconnect).');
  console.log(`[detached] pid:     ${state.pid}`);
  console.log(`[detached] env:     ${state.env}`);
  console.log(`[detached] log:     ${state.logFile}`);
  console.log('[detached] status:  npm run test:status');
  console.log('[detached] stop:    npm run test:stop');
}

function startViaWindowsTask(envFlag, forwarded) {
  if (!isWindows) {
    console.error('[detached] --via-task is only supported on Windows. Falling back to detached process.');
    startDetachedProcess(envFlag, forwarded);
    return;
  }

  ensureLogDir();
  const existing = readState();
  if (existing?.pid && isPidAlive(existing.pid)) {
    console.error(`[detached] A suite is already running (pid=${existing.pid}). Stop it first: npm run test:stop`);
    process.exit(1);
  }

  const id = stamp();
  const logFile = path.join(LOG_DIR, `suite-${id}.log`);
  const taskName = `AutoTest\\Detached-${id}`;
  const worker = path.join(ROOT, 'scripts', 'run-tests-background-worker.cjs');
  const forwardedQuoted = forwarded.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ');
  const nodeCmd = `"${process.execPath}" "${worker}" --env=${envFlag}${
    forwarded.length ? ` -- ${forwardedQuoted}` : ''
  }`;

  // cmd wrapper: cd to repo, append stdout/stderr to log
  const tr = `cmd /c "cd /d "${ROOT}" && set TEST_ENV=${envFlag}&& set AUTOTEST_DETACHED=1&& set AUTOTEST_DETACHED_LOG=${logFile}&& set AUTOTEST_DETACHED_ID=${id}&& set AUTOTEST_DAILY_ROLLUP=1&& set AUTOTEST_SCOPE=full&& ${nodeCmd} >> "${logFile}" 2>&1"`;

  // Schedule one minute ahead, then run immediately — task remains independent of this shell.
  const when = new Date(Date.now() + 60 * 1000);
  const hh = String(when.getHours()).padStart(2, '0');
  const mm = String(when.getMinutes()).padStart(2, '0');

  try {
    execSync(
      `schtasks /Create /TN "${taskName}" /TR ${JSON.stringify(tr)} /SC ONCE /ST ${hh}:${mm} /F /RL LIMITED`,
      { stdio: 'pipe' },
    );
    execSync(`schtasks /Run /TN "${taskName}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error('[detached] Failed to create/run Windows scheduled task:', err.message || err);
    console.error('[detached] Falling back to detached process mode.');
    startDetachedProcess(envFlag, forwarded);
    return;
  }

  writeState({
    id,
    pid: null,
    taskName,
    env: envFlag,
    startedAt: new Date().toISOString(),
    logFile,
    command: tr,
    mode: 'windows-task',
  });

  console.log('[detached] Suite started via Windows Task Scheduler (best RDP/logoff isolation).');
  console.log(`[detached] task:    ${taskName}`);
  console.log(`[detached] env:     ${envFlag}`);
  console.log(`[detached] log:     ${logFile}`);
  console.log('[detached] status:  npm run test:status');
  console.log('[detached] stop:    npm run test:stop');
}

function printStatus() {
  const state = readState();
  if (!state) {
    console.log('[detached] No active detached suite recorded.');
    return;
  }

  const alive = state.pid ? isPidAlive(state.pid) : null;
  console.log('[detached] Active run metadata:');
  console.log(`  id:        ${state.id}`);
  console.log(`  mode:      ${state.mode}`);
  console.log(`  env:       ${state.env}`);
  console.log(`  startedAt: ${state.startedAt}`);
  console.log(`  log:       ${state.logFile}`);
  if (state.pid) {
    console.log(`  pid:       ${state.pid} (${alive ? 'running' : 'not running'})`);
  }
  if (state.taskName) {
    console.log(`  task:      ${state.taskName}`);
    try {
      const out = execSync(`schtasks /Query /TN "${state.taskName}" /FO LIST /V`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const statusLine = out
        .split(/\r?\n/)
        .find((l) => /Status:/i.test(l));
      if (statusLine) console.log(`  ${statusLine.trim()}`);
    } catch {
      console.log('  task:      (not found / already cleaned up)');
    }
  }

  if (state.logFile && fs.existsSync(state.logFile)) {
    const text = fs.readFileSync(state.logFile, 'utf8');
    const lines = text.trimEnd().split(/\r?\n/);
    const tail = lines.slice(-15);
    console.log('[detached] Log tail:');
    for (const line of tail) console.log(`  ${line}`);
  }

  if (state.pid && alive === false && state.mode === 'detached-process') {
    console.log('[detached] Process finished. Clearing state file.');
    clearState();
  }
}

function stopRun() {
  const state = readState();
  if (!state) {
    console.log('[detached] Nothing to stop (no current state).');
    return;
  }

  console.log(`[detached] Stopping suite id=${state.id} mode=${state.mode} ...`);

  if (state.pid) {
    killProcessTree(state.pid);
  }

  if (state.taskName && isWindows) {
    try {
      execSync(`schtasks /End /TN "${state.taskName}"`, { stdio: 'ignore' });
    } catch {
      // ignore
    }
    try {
      execSync(`schtasks /Delete /TN "${state.taskName}" /F`, { stdio: 'ignore' });
    } catch {
      // ignore
    }
  }

  // Extra sweep: kill leftover playwright/node test workers launched from this repo if still running
  if (isWindows && state.pid) {
    try {
      execSync(`taskkill /PID ${state.pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // ignore
    }
  }

  clearState();
  console.log('[detached] Stop requested. Suite processes were signaled to terminate.');
  if (state.logFile) {
    console.log(`[detached] Log retained at: ${state.logFile}`);
  }
}

function main() {
  const { action, envFlag, viaTask, forwarded } = parseArgs(process.argv.slice(2));

  if (action === 'start') {
    if (viaTask) startViaWindowsTask(envFlag, forwarded);
    else startDetachedProcess(envFlag, forwarded);
    return;
  }
  if (action === 'status') {
    printStatus();
    return;
  }
  if (action === 'stop') {
    stopRun();
    return;
  }

  console.error(`[detached] Unknown action "${action}". Use start | status | stop.`);
  process.exit(1);
}

main();
