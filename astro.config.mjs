// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

// https://astro.build/config
// Pure static build. Dev-mode editing tools (content editor + photo manager)
// run only during `astro dev` via API routes guarded by import.meta.env.DEV.
export default defineConfig({
  integrations: [mdx()],
  output: 'static',
});
