import type { APIRoute } from 'astro';
import { devGuard } from '../../../lib/devEdit';
import { updateIndiFacts } from '../../../lib/gedcomEdit';

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

  const id = String(body.id ?? '');
  if (!/^@\w+@$/.test(id)) return json({ error: 'Invalid id' }, 400);

  try {
    await updateIndiFacts(id, {
      birthDate: body.birthDate as string | undefined,
      birthPlace: body.birthPlace as string | undefined,
      deathDate: body.deathDate as string | undefined,
      deathPlace: body.deathPlace as string | undefined,
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }

  return json({ ok: true });
};
