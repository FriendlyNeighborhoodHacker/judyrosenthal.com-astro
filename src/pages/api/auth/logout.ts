import type { APIRoute } from 'astro';
import { devGuard } from '../../../lib/devEdit';
import { COOKIE_NAME } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  const guard = devGuard();
  if (guard) return guard;

  cookies.delete(COOKIE_NAME, { path: '/', httpOnly: true, sameSite: 'lax' });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
