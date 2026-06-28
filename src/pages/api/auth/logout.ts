import type { APIRoute } from 'astro';
import { devGuard } from '../../../lib/devEdit';
import { COOKIE_NAME } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async () => {
  const guard = devGuard();
  if (guard) return guard;

  // Set-Cookie with Max-Age=0 tells the browser to immediately expire the cookie.
  // This is more reliable than Astro's cookies.delete() which may not produce
  // a correct Set-Cookie header for clearing the cookie in all environments.
  const clearCookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookie,
    },
  });
};