/**
 * Auth helpers for the DEV-ONLY editing tools.
 *
 * Pure `node:crypto` — no third-party dependencies. Credentials live in the
 * git-ignored `config.local.ts` at the project root (see config.local.example.ts).
 * This module is only ever exercised under `astro dev`; it is stashed out of the
 * static production build along with the rest of the editing tools.
 */
import crypto from 'node:crypto';
import type { AstroCookies } from 'astro';

export const COOKIE_NAME = 'jr_session';

/** Session lifetime: ~30 days. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Options for the session cookie (maxAge is in seconds, per the cookie spec). */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: Math.floor(SESSION_TTL_MS / 1000),
};

interface LocalConfig {
  secret: string;
  users: { username: string; passwordHash: string }[];
}

/**
 * Resilient load of the root `config.local.ts`. Uses `import.meta.glob` so a
 * missing file degrades gracefully (returns null) instead of breaking the dev
 * server with an unresolved-import error.
 */
async function loadConfig(): Promise<LocalConfig | null> {
  // Pattern is relative to the Vite/project root; resolves to <root>/config.local.ts.
  const modules = import.meta.glob('/config.local.ts');
  const loader = modules['/config.local.ts'];
  if (!loader) {
    console.warn(
      '[auth] config.local.ts not found — editing is locked. ' +
        'Copy config.local.example.ts to config.local.ts and add a user.',
    );
    return null;
  }
  try {
    const mod = (await loader()) as Partial<LocalConfig>;
    if (typeof mod.secret !== 'string' || !mod.secret || !Array.isArray(mod.users)) {
      console.warn('[auth] config.local.ts is missing a `secret` and/or `users` export.');
      return null;
    }
    return { secret: mod.secret, users: mod.users };
  } catch (err) {
    console.warn('[auth] failed to load config.local.ts:', err);
    return null;
  }
}

/**
 * Hash a password using scrypt with `secret` as a pepper. Deterministic for a
 * given (password, secret) pair so the login endpoint and the `hash-password`
 * CLI produce identical hashes. Returns a hex string.
 */
export function hashPassword(password: string, secret: string): string {
  return crypto.scryptSync(password, secret, 64).toString('hex');
}

/** Constant-time comparison of two hex strings. */
function safeHexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Verify a username/password against config.local.ts. */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const config = await loadConfig();
  if (!config) return false;
  const user = config.users.find((u) => u.username === username);
  if (!user) return false;
  return safeHexEqual(hashPassword(password, config.secret), user.passwordHash);
}

/** HMAC-SHA256 a payload with the config secret (hex). */
function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Create a signed, expiring session token for `username`, or null if no valid
 * config exists. Format: `base64url(username.expiresAtMs).hmac`.
 */
export async function createSessionToken(username: string): Promise<string | null> {
  const config = await loadConfig();
  if (!config) return null;
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(`${username}.${expiresAt}`).toString('base64url');
  return `${payload}.${sign(payload, config.secret)}`;
}

/**
 * Read and validate the session cookie. Returns the logged-in username, or null
 * if absent / tampered / expired / the user no longer exists.
 */
export async function getSessionUser(cookies: AstroCookies): Promise<string | null> {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const config = await loadConfig();
  if (!config) return null;

  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payload || !sig || !safeHexEqual(sig, sign(payload, config.secret))) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(payload, 'base64url').toString('utf-8');
  } catch {
    return null;
  }
  const sep = decoded.lastIndexOf('.');
  if (sep === -1) return null;
  const username = decoded.slice(0, sep);
  const expiresAt = Number(decoded.slice(sep + 1));
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
  if (!config.users.some((u) => u.username === username)) return null;

  return username;
}
