# AutoTest Execution and Reporting Guide

## Current Setup Overview

This repository runs Playwright end-to-end tests using:

1. Playwright test runner with 3 browser projects: chromium, firefox, webkit.
2. Global setup that:
   1. runs DB prerequisite updates,
   2. performs admin login,
   3. writes storageState for authenticated tests.
3. Global teardown that:
   1. generates a daily HTML summary,
   2. cleans old artifacts.
4. Multiple reporters:
   1. HTML report,
   2. Blob report,
   3. List reporter,
   4. daily-reporter custom reporter,
   5. summary-reporter custom reporter.

## When the Entire Suite Is Executed

### In CI (server)

The full suite is executed in GitHub Actions from [ .github/workflows/playwright.yml](../.github/workflows/playwright.yml) when any of the following happen:

1. Push to main.
2. Pull request targeting main.
3. Scheduled run every day at 19:30 UTC.
4. Manual workflow_dispatch trigger.

CI command for full suite:

1. npm test

From [ package.json](../package.json), npm test currently runs:

1. npx playwright test

That means all tests under [ tests/](.) matching config patterns are executed across configured projects.

### Local machine

You can execute full suite manually with:

1. npm test

You can execute per browser with:

1. npm run test:chromium
2. npx playwright test --project=firefox
3. npx playwright test --project=webkit

### Background / RDP-safe local runs

Foreground `npm test` is tied to the current terminal session and can die if RDP disconnects or the interactive session ends.

To run until completion unless you explicitly stop it:

1. Start detached: `npm run test:detached` (or `npm run test:detached:chromium`)
2. Check progress: `npm run test:status` (shows PID + log tail under `logs/detached/`)
3. Stop only when you choose: `npm run test:stop`
4. Optional stronger isolation via Windows Task Scheduler: `npm run test:detached:task`
5. Optional daily local schedule (survives RDP): `npm run schedule:install`

Detached runs request a Windows sleep-lock while the suite is active so the machine is less likely to sleep mid-run. Hibernate/power-off still stops everything (hardware limitation).

GitHub Actions `schedule` / `workflow_dispatch` runs on GitHub-hosted runners and are unaffected by your local RDP/network.

## CI Execution Constraints

From [ playwright.config.ts](../playwright.config.ts):

1. Per-test timeout: 60s (default, overridden in specific suites when needed).
2. Global suite timeout: 55 minutes.
3. Retries on CI: 2.
4. Workers on CI: 4.
5. Trace: on-first-retry.

From [ .github/workflows/playwright.yml](../.github/workflows/playwright.yml):

1. Job timeout: 60 minutes.
2. Auth infra gating switch: FAIL_ON_AUTH_UNAVAILABLE (default false).
3. Flake threshold controls:
   1. FLAKE_RATE_THRESHOLD (default 0.05),
   2. FLAKE_RATE_GROWTH_THRESHOLD (default 0.02),
   3. MAX_TIMEOUT_TESTS (default 3),
   4. MAX_RETRY_ATTEMPTS (default 20),
   5. SLOW_SPEC_THRESHOLD_MS (default 120000),
   6. FAIL_ON_FLAKE_REGRESSION (default false).

Implication:

1. If execution exceeds 60 minutes, CI job is terminated by runner timeout.
2. If tests fail even after retries, Playwright exits non-zero and build is marked failed.
3. If typecheck fails, tests do not run because CI stops at that step.

## How Build Failure / Pass Status Is Determined

Build status is based on:

1. Typecheck step result.
2. Playwright exit code from full suite command.

Pass/fail/skip details are still generated in reports/artifacts even if failures occur, because artifact upload uses if: always().

## What Reports Are Generated

### Standard Playwright outputs

1. HTML report folder: [ playwright-report/](../playwright-report)
2. Test output folder: [ test-results/](../test-results)
3. Blob report zip files by date: [ blob-report/](../blob-report)

### Custom HTML summary outputs

1. [ scripts/daily-reporter.cjs](../scripts/daily-reporter.cjs)
   1. Writes daily rollup HTML file under REPORT_OUTPUT_DIR/daily-rollup.
2. [ scripts/summary-reporter.ts](../scripts/summary-reporter.ts)
   1. Writes per-run timestamped HTML file under REPORT_OUTPUT_DIR/per-run,
   2. writes compact per-run JSON summary for dashboards,
   3. writes stability-analysis JSON (retries, timeout patterns, slowest specs, threshold checks),
   4. optionally sends email when SMTP vars exist.
3. [ scripts/generate-daily-report.js](../scripts/generate-daily-report.js)
   1. Generates a daily rollup from JSON results as a fallback/manual utility,
   2. can be enabled in teardown via GENERATE_DAILY_ROLLUP_IN_TEARDOWN=true.

Configured output directory in current scripts:

1. Environment variable: REPORT_OUTPUT_DIR
2. Default when REPORT_OUTPUT_DIR is not set: playwright-report/daily-summary
3. Daily rollup folder: REPORT_OUTPUT_DIR/daily-rollup
4. Per-run outputs folder: REPORT_OUTPUT_DIR/per-run
5. Stability analysis files:
   1. per-run/stability-analysis-YYYY-MM-DD_HH-mm-ss.json
   2. per-run/latest-stability-analysis.json

Configured email summary settings:

1. [ scripts/email-config.json](../scripts/email-config.json)

## Where to Review Reports When Executed on Server

### Primary server-side review location

Use GitHub Actions run artifacts:

1. Artifact name: playwright-report
2. Artifact name: test-results
3. Artifact name: daily-test-summary

These are uploaded by workflow step regardless of success/failure.

Review path in workflow:

1. [ .github/workflows/playwright.yml](../.github/workflows/playwright.yml)

### Important note about Desktop path on server

Custom summary scripts now support REPORT_OUTPUT_DIR with a workspace-relative default. For CI portability on ubuntu-latest runners:

1. Set REPORT_OUTPUT_DIR to a workspace-relative folder (recommended: playwright-report/daily-summary).
2. The reliable CI review mechanism is GitHub artifact download.
3. If you want custom summary HTML available in CI artifacts, explicitly upload REPORT_OUTPUT_DIR path as an artifact.

## Quick Run and Review Flow

### Local

1. Run: npm test
2. Open Playwright report locally:
   1. npm run report
3. Check custom summary files under configured report output directory.

### CI

1. Open the workflow run in GitHub Actions.
2. Check job steps:
   1. Typecheck,
   2. Run Playwright tests (full suite).
3. Download artifacts:
   1. playwright-report,
   2. test-results,
   3. daily-test-summary (daily rollup + per-run HTML + compact JSON summary).
4. Open the downloaded Playwright HTML report index file.

## Stabilization Loop (Per Run)

1. Pull per-run stability data from the daily-test-summary artifact:
   1. REPORT_OUTPUT_DIR/per-run/latest-stability-analysis.json
2. Triage in this order:
   1. stabilizationPriorities entries (top-ranked first),
   2. threshold alert regressions,
   3. remaining slowestSpecs entries.
3. Use flakeRateGrowth as the guardrail metric:
   1. if flakeRateGrowth is positive and above threshold, treat as regression,
   2. prioritize fixes that reduce retries/timeouts before adding new coverage.
4. Gating rollout:
   1. keep FAIL_ON_FLAKE_REGRESSION=false while baseline is stabilizing,
   2. switch to FAIL_ON_FLAKE_REGRESSION=true when baseline trend is acceptable and you want strict regression prevention.

## Feedback and Recommended Improvements

### 1. Unify report output paths for cross-platform behavior

Status:

1. Implemented.

Current behavior:

1. All custom summaries use REPORT_OUTPUT_DIR with default playwright-report/daily-summary.
2. Output is split by purpose:
   1. daily-rollup for date rollup HTML,
   2. per-run for timestamped HTML and compact JSON.

### 2. Upload custom summary reports as CI artifacts

Status:

1. Implemented.

Current behavior:

1. Workflow uploads REPORT_OUTPUT_DIR as dedicated artifact daily-test-summary.

### 3. Avoid duplicate summary generation paths

Issue:

1. Summary is generated by reporters and again by global teardown script.

Recommendation:

1. Keep one canonical summary generator per run, or
2. separate them by purpose (date-rollup vs per-run timestamped) with clear naming/env flags.

### 4. Improve auth resilience to reduce skip-only runs

Issue observed in recent runs:

1. Global setup login retries can fail; many suites become skipped.

Recommendation:

1. Add health-check retries and fallback logic with clear diagnostics.
2. Publish login/outage status in report header so stakeholders know if results are skip-driven.
3. Optionally gate run as infrastructure-failed if auth system is unavailable.

### 5. Review script path drift and dead scripts

Issue:

1. Some npm script file references may not match current file naming conventions.

Recommendation:

1. Regularly validate all npm scripts.
2. Remove or fix stale smoke command paths.

### 6. Add machine-readable summary for dashboards

Status:

1. Implemented.

Current behavior:

1. Per-run JSON summary is emitted under REPORT_OUTPUT_DIR/per-run.
2. Summary includes:
   1. total,
   2. passed,
   3. failed,
   4. skipped,
   5. infra warnings,
   6. build URL,
   7. commit SHA,
   8. stability counts and threshold alerts.

### 7. Track flake and slow tests explicitly

Status:

1. Implemented.

Current behavior:

1. Post-run stability analysis is generated with retries, timeout counts, flake rate, and slowest specs.
2. Flake growth is compared against the previous run using latest-stability-analysis.json.
3. Thresholds are configurable via CI env vars.
4. Optional quality gate: set FAIL_ON_FLAKE_REGRESSION=true to fail CI on threshold breaches.
5. stabilizationPriorities output ranks high-impact specs for stabilization backlog planning.

## Files Referenced

1. [ package.json](../package.json)
2. [ playwright.config.ts](../playwright.config.ts)
3. [ global-setup.ts](../global-setup.ts)
4. [ global-teardown.ts](../global-teardown.ts)
5. [ .github/workflows/playwright.yml](../.github/workflows/playwright.yml)
6. [ scripts/daily-reporter.cjs](../scripts/daily-reporter.cjs)
7. [ scripts/summary-reporter.ts](../scripts/summary-reporter.ts)
8. [ scripts/generate-daily-report.js](../scripts/generate-daily-report.js)
9. [ scripts/email-config.json](../scripts/email-config.json)
