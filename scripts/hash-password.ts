#!/usr/bin/env node
/**
 * Generate a password hash for the dev-only editing tools.
 *
 *   npm run hash-password <password>
 *
 * Uses the `secret` from config.local.ts as a pepper, so the hash matches what
 * the login endpoint computes. Paste the printed entry into the `users` array.
 *
 * Runs via Node's type stripping (see the package.json script) so it can import
 * the project's .ts files directly — no build step, no extra dependencies.
 */
import { hashPassword } from '../src/lib/auth.ts';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password <password>');
  process.exit(1);
}

let secret: string | undefined;
try {
  ({ secret } = (await import('../config.local.ts')) as { secret?: string });
} catch {
  console.error(
    'Could not load config.local.ts.\n' +
      'Copy config.local.example.ts to config.local.ts and set a real `secret` first.',
  );
  process.exit(1);
}

if (!secret || secret === 'change-me-to-a-long-random-string') {
  console.error('Set a real `secret` in config.local.ts before generating hashes.');
  process.exit(1);
}

const passwordHash = hashPassword(password, secret);
console.log('\nAdd (or update) an entry in the `users` array of config.local.ts:\n');
console.log(`  { username: 'CHANGEME', passwordHash: '${passwordHash}' },\n`);
