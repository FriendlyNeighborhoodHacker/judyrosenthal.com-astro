import type { APIRoute } from 'astro';
import { devGuard, resolveAlbumDir, listAlbum } from '../../../lib/devEdit';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const guard = devGuard();
  if (guard) return guard;

  const album = url.searchParams.get('album');
  if (!album) {
    return new Response(JSON.stringify({ error: 'Missing ?album=' }), { status: 400 });
  }

  try {
    const albumAbs = resolveAlbumDir(album);
    const photos = await listAlbum(albumAbs);
    return new Response(JSON.stringify({ album, photos }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 400 });
  }
};
