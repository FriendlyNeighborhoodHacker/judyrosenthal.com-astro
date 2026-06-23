#!/usr/bin/env node
/**
 * Pure-static production build.
 *
 * The dev-only editing tools (content editor + photo manager) are
 * server-rendered routes (`prerender = false`). Astro scans src/pages BEFORE
 * Vite runs, so the only reliable way to keep `astro build` adapter-free and
 * fully static is to physically move those routes out of src/pages for the
 * duration of the build, then restore them.
 *
 * Usage: `npm run build`
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PAGES = path.join(ROOT, 'src', 'pages');
const STASH = path.join(ROOT, '.dev-tools-stash');

// Paths (relative to src/pages) that must be removed for a static build.
const DEV_ONLY = ['edit.astro', 'edit-person.astro', 'manage-photos.astro', 'api'];

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function stash() {
  await fs.mkdir(STASH, { recursive: true });
  for (const rel of DEV_ONLY) {
    const from = path.join(PAGES, rel);
    const to = path.join(STASH, rel);
    if (await exists(from)) {
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.rename(from, to);
      console.log(`  stashed src/pages/${rel}`);
    }
  }
}

async function restore() {
  for (const rel of DEV_ONLY) {
    const from = path.join(STASH, rel);
    const to = path.join(PAGES, rel);
    if (await exists(from)) {
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.rename(from, to);
      console.log(`  restored src/pages/${rel}`);
    }
  }
  // Clean up the (now empty) stash dir.
  if (await exists(STASH)) {
    await fs.rm(STASH, { recursive: true, force: true });
  }
}

function runAstroBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['astro', 'build'], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`astro build exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  console.log('› Stashing dev-only routes…');
  await stash();
  try {
    console.log('› Running astro build (pure static)…');
    await runAstroBuild();
  } finally {
    console.log('› Restoring dev-only routes…');
    await restore();
  }
  console.log('✓ Static build complete. dist/ contains no dev tools.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
