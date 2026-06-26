import type { APIRoute } from 'astro';
import { devGuard } from '../../../lib/devEdit';
import { getSessionUser } from '../../../lib/auth';

export const prerender = false;

// Reports the current logged-in user (or null) by reading the httpOnly session.
// The dev toolbar uses this to decide whether to show Edit vs. Log in, because
// prerendered content pages can't read cookies in their own frontmatter.
export const GET: APIRoute = async ({ cookies }) => {
  const guard = devGuard();
  if (guard) return guard;

  const user = await getSessionUser(cookies);
  return new Response(JSON.stringify({ user }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
