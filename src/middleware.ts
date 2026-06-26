/**
 * Auth gate for the DEV-ONLY editing tools.
 *
 * In production this is a no-op (and the build script stashes this file out
 * entirely), so the static build stays fully static with no adapter. Under
 * `astro dev` it requires a valid session for the editing pages and write APIs.
 */
import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './lib/auth';

/** Pages that require a login before they'll render. */
const PROTECTED_PAGES = ['/edit', '/edit-person', '/manage-photos'];

function isProtected(pathname: string): boolean {
  if (PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return true;
  }
  // All write APIs are protected, except the auth endpoints themselves.
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    return true;
  }
  return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Never gate (or even run) in the static production build.
  if (!import.meta.env.DEV) return next();

  const { pathname } = context.url;
  if (!isProtected(pathname)) return next();

  const user = await getSessionUser(context.cookies);
  if (user) return next();

  // API requests get a clean 401; page requests get redirected to the login form.
  if (pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const next_ = encodeURIComponent(pathname + context.url.search);
  return context.redirect(`/login?next=${next_}`);
});
