import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import { devGuard, resolvePageFile, splitFrontmatter, joinFrontmatter } from '../../lib/devEdit';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const guard = devGuard();
  if (guard) return guard;

  const page = url.searchParams.get('page');
  if (!page) {
    return new Response(JSON.stringify({ error: 'Missing ?page=' }), { status: 400 });
  }

  try {
    const file = await resolvePageFile(page);
    const raw = await fs.readFile(file, 'utf-8');
    const { frontmatter, body } = splitFrontmatter(raw);
    return new Response(JSON.stringify({ file, frontmatter, body }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 404 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const guard = devGuard();
  if (guard) return guard;

  let data: { page?: string; frontmatter?: string; body?: string };
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { page, frontmatter = '', body = '' } = data;
  if (!page) {
    return new Response(JSON.stringify({ error: 'Missing page' }), { status: 400 });
  }

  try {
    const file = await resolvePageFile(page);
    const content = joinFrontmatter({ frontmatter, body });
    await fs.writeFile(file, content, 'utf-8');
    return new Response(JSON.stringify({ ok: true, file }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};
