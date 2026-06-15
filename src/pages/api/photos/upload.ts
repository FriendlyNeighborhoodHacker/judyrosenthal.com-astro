import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { devGuard, resolveAlbumDir, readAlbumMeta, writeAlbumMeta } from '../../../lib/devEdit';

export const prerender = false;

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

/** Sanitize an uploaded filename to a safe basename. */
function safeName(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._ -]/g, '_');
}

export const POST: APIRoute = async ({ request }) => {
  const guard = devGuard();
  if (guard) return guard;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), { status: 400 });
  }

  const album = form.get('album');
  if (typeof album !== 'string' || !album) {
    return new Response(JSON.stringify({ error: 'Missing album' }), { status: 400 });
  }

  let albumAbs: string;
  try {
    albumAbs = resolveAlbumDir(album);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 400 });
  }

  await fs.mkdir(albumAbs, { recursive: true });

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return new Response(JSON.stringify({ error: 'No files uploaded' }), { status: 400 });
  }

  const saved: string[] = [];
  for (const file of files) {
    let name = safeName(file.name);
    if (!IMAGE_EXT.test(name)) continue;

    // Avoid overwriting: if exists, append a numeric suffix.
    let dest = path.join(albumAbs, name);
    let counter = 1;
    while (await fileExists(dest)) {
      const ext = path.extname(name);
      const base = name.slice(0, -ext.length);
      dest = path.join(albumAbs, `${base}_${counter}${ext}`);
      counter++;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(dest, buffer);
    saved.push(path.basename(dest));
  }

  // Append newly saved files to the explicit order so they show up at the end.
  if (saved.length) {
    const meta = await readAlbumMeta(albumAbs);
    const order = meta.order ?? [];
    meta.order = [...order, ...saved.filter((s) => !order.includes(s))];
    await writeAlbumMeta(albumAbs, meta);
  }

  return new Response(JSON.stringify({ ok: true, saved }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
