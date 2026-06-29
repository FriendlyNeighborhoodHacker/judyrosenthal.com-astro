import type { APIRoute } from 'astro';
import { devGuard } from '../../../lib/devEdit';
import { COOKIE_NAME } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const guard = devGuard();
  if (guard) return guard;

  // Redirect back to the page the user was on (or home).
  const referer = url.searchParams.get('next') ?? '/';

  // Clear the session cookie via the response headers.
  // The browser MUST process Set-Cookie from a navigation response.
  const clearCookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: referer,
      'Set-Cookie': clearCookie,
    },
  });
};