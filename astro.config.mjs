// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// https://astro.build/config
// Pure static build (no server adapter needed — the host has no Node).
//
// The dev-mode editing tools (content editor + photo manager) live in
// src/pages/edit.astro, src/pages/manage-photos.astro and src/pages/api/**.
// They are server-rendered and therefore can't exist in a static build, so
// `npm run build` (scripts/build-static.mjs) temporarily moves them out of
// src/pages before building and restores them afterwards. During `astro dev`
// they are fully available.
export default defineConfig({
  integrations: [mdx()],
  output: 'static',
});
