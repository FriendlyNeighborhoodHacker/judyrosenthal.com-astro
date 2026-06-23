import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import { devGuard, familyFile, FAMILY_IMAGES_DIR } from '../../../lib/devEdit';

export const prerender = false;

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const POSITIONS = new Set(['top', 'center', 'bottom']);

export const POST: APIRoute = async ({ request }) => {
  const guard = devGuard();
  if (guard) return guard;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  let metaPath: string;
  try {
    metaPath = familyFile(String(body.slug ?? ''), '_metadata.json');
  } catch (err) {
    return json({ error: String(err) }, 400);
  }

  const height = String(body.hero_image_height ?? '').trim();
  const position = String(body.hero_image_position ?? '').trim();
  const offset = String(body.hero_image_offset ?? '').trim();
  if (position && !POSITIONS.has(position)) {
    return json({ error: 'position must be top, center, or bottom' }, 400);
  }

  // Preserve other metadata keys (links, etc.); a blank value clears that key.
  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
  } catch {
    meta = {};
  }

  const set = (key: string, value: string) => {
    if (value) meta[key] = value;
    else delete meta[key];
  };
  set('hero_image_height', height);
  set('hero_image_position', position);
  set('hero_image_offset', offset);

  try {
    if (Object.keys(meta).length) {
      await fs.mkdir(FAMILY_IMAGES_DIR, { recursive: true });
      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');
    } else {
      await fs.rm(metaPath, { force: true });
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }

  return json({ ok: true });
};
