import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { devGuard, validateSlug, resolveAlbumDir, FAMILY_IMAGES_DIR } from '../../../lib/devEdit';

export const prerender = false;

// SectionHero globs jpeg/jpg/png/gif only — a webp can't be used as a hero.
const HERO_EXT = /\.(jpe?g|png|gif)$/i;

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const guard = devGuard();
  if (guard) return guard;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  let slug: string;
  try {
    slug = validateSlug(body.slug);
  } catch (err) {
    return json({ error: String(err) }, 400);
  }

  const file = String(body.file ?? '');
  if (!file || file !== path.basename(file)) return json({ error: 'Invalid file' }, 400);
  const ext = path.extname(file).toLowerCase();
  if (!HERO_EXT.test(ext)) {
    return json({ error: 'Hero must be a jpeg, jpg, png, or gif (not webp)' }, 400);
  }

  // Resolve and validate the source album image.
  let source: string;
  try {
    const albumAbs = resolveAlbumDir(`family/${slug}_album`);
    source = path.join(albumAbs, file);
    if (!source.startsWith(albumAbs + path.sep)) return json({ error: 'Invalid path' }, 400);
    await fs.access(source);
  } catch {
    return json({ error: 'Album image not found' }, 404);
  }

  // Replace any existing hero, then copy the chosen album image in.
  for (const e of ['.jpeg', '.jpg', '.png', '.gif']) {
    await fs.rm(path.join(FAMILY_IMAGES_DIR, `${slug}_hero${e}`), { force: true });
  }
  const filename = `${slug}_hero${ext === '.jpeg' ? '.jpeg' : ext}`;
  await fs.copyFile(source, path.join(FAMILY_IMAGES_DIR, filename));

  return json({ ok: true, filename });
};
