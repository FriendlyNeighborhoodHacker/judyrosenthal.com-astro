import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { devGuard, resolveAlbumDir, readAlbumMeta, writeAlbumMeta } from '../../../lib/devEdit';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const guard = devGuard();
  if (guard) return guard;

  let data: { album?: string; filename?: string };
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { album, filename } = data;
  if (!album || !filename) {
    return new Response(JSON.stringify({ error: 'Missing album or filename' }), { status: 400 });
  }

  // Only allow a plain basename (no path separators).
  if (filename !== path.basename(filename)) {
    return new Response(JSON.stringify({ error: 'Invalid filename' }), { status: 400 });
  }

  try {
    const albumAbs = resolveAlbumDir(album);
    const target = path.join(albumAbs, filename);
    if (!target.startsWith(albumAbs + path.sep)) {
      return new Response(JSON.stringify({ error: 'Invalid path' }), { status: 400 });
    }
    await fs.unlink(target);

    // Remove from sidecar order + descriptions.
    const meta = await readAlbumMeta(albumAbs);
    if (meta.order) meta.order = meta.order.filter((f) => f !== filename);
    if (meta.descriptions) delete meta.descriptions[filename];
    await writeAlbumMeta(albumAbs, meta);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
