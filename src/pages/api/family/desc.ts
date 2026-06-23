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

  let descPath: string;
  try {
    descPath = familyFile(String(body.slug ?? ''), '_desc.md');
  } catch (err) {
    return json({ error: String(err) }, 400);
  }

  const markdown = typeof body.markdown === 'string' ? body.markdown.trim() : '';

  try {
    if (markdown) {
      await fs.mkdir(FAMILY_IMAGES_DIR, { recursive: true });
      await fs.writeFile(descPath, markdown + '\n', 'utf-8');
    } else {
      // Blank description → remove the file so the auto relationship sentence returns.
      await fs.rm(descPath, { force: true });
    }
  } catch (err) {
    return json({ error: String(err) }, 500);
  }

  return json({ ok: true });
};
