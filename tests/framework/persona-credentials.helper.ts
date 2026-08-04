/**
 * Credential fallback for restriction-persona suites.
 *
 * Try order (after any configured persona credentials):
 *   1) scadmin (UserInfo.admin)
 *   2) qasecureconnect (UserInfo.qauser)
 *   3) secureconnect50 (UserInfo.secureconnect50)
 *
 * For ACL/scope tests, pass `acceptPersona` so elevated logins can be rejected
 * and the next candidate tried (e.g. reject scadmin/qauser, accept secureconnect50
 * when it behaves as a restricted profile).
 */
import type { Page } from '@playwright/test';
import userData from '../../testData/user-info';
import LoginPage from '../../testData/LoginPage';

export type PersonaCredentialSource =
	| 'configured'
	| 'scadmin'
	| 'qasecureconnect'
	| 'secureconnect50';

export interface CredentialPair {
	username: string;
	password: string;
}

export interface PersonaLoginResult extends CredentialPair {
	source: PersonaCredentialSource;
	/** True when login used scadmin or qasecureconnect. */
	isElevatedFallback: boolean;
}

function hasCredentialPair(username?: string, password?: string): boolean {
	return Boolean((username ?? '').trim() && (password ?? '').trim());
}

function pair(username: string, password: string, source: PersonaCredentialSource): PersonaLoginResult {
	const elevated = source === 'scadmin' || source === 'qasecureconnect';
	return {
		username: username.trim(),
		password: String(password),
		source,
		isElevatedFallback: elevated,
	};
}

/** Ordered candidates: configured (if any) → scadmin → qasecureconnect → secureconnect50. */
export function getPersonaCredentialCandidates(configured?: Partial<CredentialPair> | null): PersonaLoginResult[] {
	const out: PersonaLoginResult[] = [];
	const seen = new Set<string>();

	const push = (username: string | undefined, password: string | undefined, source: PersonaCredentialSource) => {
		if (!hasCredentialPair(username, password)) return;
		const key = username!.trim().toLowerCase();
		if (seen.has(key)) return;
		seen.add(key);
		out.push(pair(username!, password!, source));
	};

	push(configured?.username, configured?.password, 'configured');
	push(userData.admin?.username, userData.admin?.password, 'scadmin');
	push(userData.qauser?.username, userData.qauser?.password, 'qasecureconnect');
	push(userData.secureconnect50?.username, userData.secureconnect50?.password, 'secureconnect50');

	return out;
}

export async function isDashboardReady(page: Page, timeoutMs = 20000): Promise<boolean> {
	const byUrl = await page
		.waitForURL(/\/SecureConnectWeb\/dashboard(\/home)?/i, { timeout: timeoutMs })
		.then(() => true)
		.catch(() => false);
	if (byUrl) return true;

	const byClaimsLink = await page
		.getByRole('link', { name: /Claims/i })
		.first()
		.isVisible({ timeout: 3000 })
		.catch(() => false);

	return byClaimsLink || page.url().includes('/dashboard');
}

async function attemptLogin(page: Page, username: string, password: string): Promise<boolean> {
	const loginPage = new LoginPage(page);
	await loginPage.navigate().catch(() => {});
	await loginPage.login(username, password).catch(() => {});
	return isDashboardReady(page);
}

export interface PersonaLoginOptions {
	configured?: Partial<CredentialPair> | null;
	logout?: (page: Page) => Promise<void>;
	attemptsPerCandidate?: number;
	/**
	 * When provided, candidate is kept only if this returns true.
	 * Use to skip elevated profiles for ACL tests and continue the fallback chain.
	 */
	acceptPersona?: (page: Page, persona: PersonaLoginResult) => Promise<boolean>;
}

/**
 * Try configured → scadmin → qasecureconnect → secureconnect50 until login succeeds
 * (and optional acceptPersona returns true).
 */
export async function loginWithPersonaFallback(
	page: Page,
	options: PersonaLoginOptions = {},
): Promise<PersonaLoginResult | null> {
	const candidates = getPersonaCredentialCandidates(options.configured);
	const attempts = options.attemptsPerCandidate ?? 2;
	let lastLoginOk: PersonaLoginResult | null = null;

	if (options.logout) {
		await options.logout(page).catch(() => {});
	}

	for (const candidate of candidates) {
		let loggedIn = false;
		for (let attempt = 1; attempt <= attempts; attempt += 1) {
			if (options.logout) {
				await options.logout(page).catch(() => {});
			}
			loggedIn = await attemptLogin(page, candidate.username, candidate.password);
			if (loggedIn) break;
		}

		if (!loggedIn) {
			console.warn(`[persona-credentials] Login failed for source=${candidate.source} user=${candidate.username}`);
			continue;
		}

		lastLoginOk = candidate;

		if (options.acceptPersona) {
			const accepted = await options.acceptPersona(page, candidate).catch(() => false);
			if (!accepted) {
				console.warn(
					`[persona-credentials] Rejected source=${candidate.source} user=${candidate.username} for restriction criteria; trying next.`,
				);
				continue;
			}
		}

		console.log(
			`[persona-credentials] Using ${candidate.username} via source=${candidate.source}` +
				(candidate.isElevatedFallback ? ' (elevated fallback)' : ''),
		);
		return candidate;
	}

	// No candidate accepted; return last successful login so caller can soft-skip ACL clearly.
	if (lastLoginOk) {
		console.warn(
			`[persona-credentials] No candidate passed acceptPersona; last successful login was ${lastLoginOk.username} (${lastLoginOk.source}).`,
		);
	}
	return lastLoginOk;
}

/** Default accept for ACL tests: reject elevated fallbacks so chain can reach secureconnect50. */
export async function acceptNonElevatedPersona(
	_page: Page,
	persona: PersonaLoginResult,
): Promise<boolean> {
	return !persona.isElevatedFallback;
}

export function elevatedAclSkipReason(personaLabel: string, source: PersonaCredentialSource): string {
	return (
		`${personaLabel} ACL/scope assertion requires a distinct restricted persona; ` +
		`tried scadmin → qasecureconnect → secureconnect50 and only elevated login succeeded (${source}). ` +
		`Provide a true restricted username/password (account/vendor/group-scoped) in test data.`
	);
}
