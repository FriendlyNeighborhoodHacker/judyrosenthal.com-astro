import { createMarkdownProcessor, type MarkdownProcessor } from '@astrojs/markdown-remark';

// Reuse Astro's own markdown engine so family descriptions render the same way
// as the rest of the site (GFM, smartypants, etc.). Memoized so the processor
// is built once per build rather than per page.
let processorPromise: Promise<MarkdownProcessor> | null = null;

export async function renderMarkdown(source: string): Promise<string> {
  if (!processorPromise) {
    processorPromise = createMarkdownProcessor({ gfm: true, smartypants: true });
  }
  const processor = await processorPromise;
  const { code } = await processor.render(source);
  return code;
}
