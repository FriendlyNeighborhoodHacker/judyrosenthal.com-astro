import type { APIRoute } from 'astro';
import { devGuard } from '../../../lib/devEdit';
import {
  verifyCredentials,
  createSessionToken,
  COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const guard = devGuard();
  if (guard) return guard;

  let data: { username?: string; password?: string };
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const username = (data.username ?? '').trim();
  const password = data.password ?? '';
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Missing username or password' }), { status: 400 });
  }

  if (!(await verifyCredentials(username, password))) {
    return new Response(JSON.stringify({ error: 'Invalid username or password' }), { status: 401 });
  }

  const token = await createSessionToken(username);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Auth is not configured' }), { status: 500 });
  }

  cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return new Response(JSON.stringify({ ok: true, username }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
