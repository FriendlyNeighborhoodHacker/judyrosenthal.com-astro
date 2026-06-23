import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { devGuard, validateSlug, FAMILY_IMAGES_DIR } from '../../../lib/devEdit';

export const prerender = false;

// SectionHero globs jpeg/jpg/png/gif only — restrict hero uploads to those.
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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Expected multipart/form-data' }, 400);
  }

  let slug: string;
  try {
    slug = validateSlug(form.get('slug'));
  } catch (err) {
    return json({ error: String(err) }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'No file uploaded' }, 400);

  const ext = path.extname(file.name).toLowerCase();
  if (!HERO_EXT.test(ext)) {
    return json({ error: 'Hero must be a jpeg, jpg, png, or gif' }, 400);
  }

  await fs.mkdir(FAMILY_IMAGES_DIR, { recursive: true });

  // Remove any existing hero (any supported extension) before writing the new one.
  for (const e of ['.jpeg', '.jpg', '.png', '.gif']) {
    await fs.rm(path.join(FAMILY_IMAGES_DIR, `${slug}_hero${e}`), { force: true });
  }

  const filename = `${slug}_hero${ext === '.jpeg' ? '.jpeg' : ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(FAMILY_IMAGES_DIR, filename), buffer);

  return json({ ok: true, filename });
};
