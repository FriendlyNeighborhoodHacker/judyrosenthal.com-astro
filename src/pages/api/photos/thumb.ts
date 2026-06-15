import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { devGuard, resolveAlbumDir } from '../../../lib/devEdit';

export const prerender = false;

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

/**
 * Serves the raw source image for an album so the photo manager can show
 * thumbnails (the dev server doesn't expose src/assets directly as URLs).
 */
export const GET: APIRoute = async ({ url }) => {
  const guard = devGuard();
  if (guard) return guard;

  const album = url.searchParams.get('album');
  const file = url.searchParams.get('file');
  if (!album || !file) {
    return new Response('Missing album or file', { status: 400 });
  }
  if (file !== path.basename(file)) {
    return new Response('Invalid filename', { status: 400 });
  }

  try {
    const albumAbs = resolveAlbumDir(album);
    const target = path.join(albumAbs, file);
    if (!target.startsWith(albumAbs + path.sep)) {
      return new Response('Invalid path', { status: 400 });
    }
    const ext = path.extname(file).toLowerCase();
    const mime = MIME[ext];
    if (!mime) return new Response('Unsupported type', { status: 415 });

    const buffer = await fs.readFile(target);
    return new Response(buffer, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'no-store' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
};
