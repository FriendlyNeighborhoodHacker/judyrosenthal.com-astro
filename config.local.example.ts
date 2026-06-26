/**
 * Local auth config for the DEV-ONLY editing tools.
 *
 * Copy this file to `config.local.ts` (which is git-ignored) and fill it in.
 * It is only ever loaded when running `astro dev` — it is never part of the
 * static production build.
 *
 *   cp config.local.example.ts config.local.ts
 *
 * Then:
 *   1. Set `secret` to a long random string (e.g. `openssl rand -hex 32`).
 *      It is used both as a pepper when hashing passwords and to sign session
 *      cookies. Changing it invalidates all existing hashes and sessions.
 *   2. Generate a password hash:  `npm run hash-password <your-password>`
 *      and paste the printed entry into the `users` array below.
 */

export const secret = 'change-me-to-a-long-random-string';

export const users: { username: string; passwordHash: string }[] = [
  // { username: 'judy', passwordHash: '<hex from npm run hash-password>' },
];
