/**
 * Shared helpers for the DEV-ONLY editing tools (content editor + photo manager).
 *
 * Everything here uses Node's fs/path and operates on the project's *source*
 * files (src/pages, src/assets). These helpers must only ever be called from
 * API routes / pages that are guarded by `import.meta.env.DEV`.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

// Project root = two levels up from src/lib
export const PROJECT_ROOT = path.resolve(process.cwd());
export const PAGES_DIR = path.join(PROJECT_ROOT, 'src', 'pages');
export const ASSETS_IMAGES_DIR = path.join(PROJECT_ROOT, 'src', 'assets', 'images');

/** Guard helper for API routes. Returns a 404 Response when not in dev. */
export function devGuard(): Response | null {
  if (!import.meta.env.DEV) {
    return new Response('Not found', { status: 404 });
  }
  return null;
}

/**
 * Resolve a site URL path (e.g. "/biography/childhood/") to its source file
 * inside src/pages. Handles both `foo/index.mdx` and `foo.mdx` conventions.
 * Throws if the resolved path escapes src/pages or no file exists.
 */
export async function resolvePageFile(urlPath: string): Promise<string> {
  // Normalize: strip leading/trailing slashes
  const clean = urlPath.replace(/^\/+|\/+$/g, '');
  const candidates = clean === ''
    ? ['index.astro', 'index.mdx']
    : [
        `${clean}.mdx`,
        `${clean}.md`,
        `${clean}.astro`,
        path.join(clean, 'index.mdx'),
        path.join(clean, 'index.md'),
        path.join(clean, 'index.astro'),
      ];

  for (const rel of candidates) {
    const abs = path.join(PAGES_DIR, rel);
    // Path traversal guard
    if (!abs.startsWith(PAGES_DIR + path.sep) && abs !== PAGES_DIR) continue;
    try {
      await fs.access(abs);
      return abs;
    } catch {
      // keep looking
    }
  }
  throw new Error(`No source file found for page "${urlPath}"`);
}

export interface ParsedContent {
  frontmatter: string; // raw YAML between the --- fences (no fences)
  body: string;        // everything after the closing fence
}

/** Split a markdown/mdx file into its raw frontmatter and body. */
export function splitFrontmatter(raw: string): ParsedContent {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: '', body: raw };
  }
  return { frontmatter: match[1], body: match[2] };
}

/** Reassemble frontmatter + body into a full file string. */
export function joinFrontmatter({ frontmatter, body }: ParsedContent): string {
  const fm = frontmatter.trim();
  if (!fm) return body.replace(/^\n+/, '');
  return `---\n${fm}\n---\n\n${body.replace(/^\n+/, '')}`;
}

/**
 * Resolve an album directory (e.g. "biography/childhood/album") to its absolute
 * path inside src/assets/images, with a traversal guard.
 */
export function resolveAlbumDir(album: string): string {
  const clean = album.replace(/^\/+|\/+$/g, '');
  const abs = path.join(ASSETS_IMAGES_DIR, clean);
  if (!abs.startsWith(ASSETS_IMAGES_DIR + path.sep) && abs !== ASSETS_IMAGES_DIR) {
    throw new Error('Invalid album path');
  }
  return abs;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

export interface AlbumMeta {
  /** Explicit ordering of filenames; files not listed are appended alphabetically. */
  order?: string[];
  /** filename -> caption */
  descriptions?: Record<string, string>;
}

/** Read the descriptions.json sidecar for an album (returns {} if absent). */
export async function readAlbumMeta(albumAbs: string): Promise<AlbumMeta> {
  const metaPath = path.join(albumAbs, 'descriptions.json');
  try {
    const raw = await fs.readFile(metaPath, 'utf-8');
    return JSON.parse(raw) as AlbumMeta;
  } catch {
    return {};
  }
}

/** Write the descriptions.json sidecar for an album. */
export async function writeAlbumMeta(albumAbs: string, meta: AlbumMeta): Promise<void> {
  const metaPath = path.join(albumAbs, 'descriptions.json');
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');
}

/**
 * List image files in an album, applying the sidecar order then alphabetical
 * for any leftovers. Returns filenames with their captions.
 */
export async function listAlbum(albumAbs: string): Promise<{ filename: string; caption: string }[]> {
  let entries: string[] = [];
  try {
    entries = (await fs.readdir(albumAbs)).filter((f) => IMAGE_EXT.test(f));
  } catch {
    return [];
  }

  const meta = await readAlbumMeta(albumAbs);
  const order = meta.order ?? [];
  const descriptions = meta.descriptions ?? {};

  const ordered = order.filter((f: string) => entries.includes(f));
  const rest = entries.filter((f: string) => !ordered.includes(f)).sort((a, b) => a.localeCompare(b));
  const final = [...ordered, ...rest];

  return final.map((filename) => ({ filename, caption: descriptions[filename] ?? '' }));
}
