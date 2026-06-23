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

  // Clean incoming links: keep only entries with both a title and a url.
  const incoming = Array.isArray(body.links) ? (body.links as unknown[]) : [];
  const links = incoming
    .map((l) => (l && typeof l === 'object' ? (l as Record<string, unknown>) : {}))
    .map((l) => ({ title: String(l.title ?? '').trim(), url: String(l.url ?? '').trim() }))
    .filter((l) => l.title && l.url);

  // Preserve other metadata keys (hero_*, etc.).
  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
  } catch {
    meta = {};
  }

  if (links.length) meta.links = links;
  else delete meta.links;

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

  return json({ ok: true, links });
};
