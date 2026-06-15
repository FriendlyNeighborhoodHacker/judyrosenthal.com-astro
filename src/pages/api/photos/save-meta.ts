import type { APIRoute } from 'astro';
import { devGuard, resolveAlbumDir, readAlbumMeta, writeAlbumMeta, listAlbum } from '../../../lib/devEdit';

export const prerender = false;

/**
 * Persist photo order and/or captions for an album to its descriptions.json
 * sidecar. Body: { album, order?: string[], descriptions?: Record<string,string> }
 */
export const POST: APIRoute = async ({ request }) => {
  const guard = devGuard();
  if (guard) return guard;

  let data: { album?: string; order?: string[]; descriptions?: Record<string, string> };
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { album, order, descriptions } = data;
  if (!album) {
    return new Response(JSON.stringify({ error: 'Missing album' }), { status: 400 });
  }

  try {
    const albumAbs = resolveAlbumDir(album);
    const meta = await readAlbumMeta(albumAbs);

    if (Array.isArray(order)) meta.order = order;
    if (descriptions && typeof descriptions === 'object') meta.descriptions = descriptions;

    await writeAlbumMeta(albumAbs, meta);
    const photos = await listAlbum(albumAbs);

    return new Response(JSON.stringify({ ok: true, photos }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
