import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://bytedigital.co.nz',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // NOTE: the `page` arg is an absolute URL, not a path. Matching it against
      // path prefixes silently matches nothing, so parse the pathname first.
      filter: (page) => {
        const { pathname } = new URL(page);
        const PRIVATE_PATHS = [
          '/admin-login/',
          '/chatbot-dashboard/',
          '/c/',
          // The cold-arrival funnel overlay: an unindexable utility page like
          // /c/, not content worth ranking.
          '/website/',
          '/rebuild/',
        ];
        return !PRIVATE_PATHS.some(
          (path) => pathname === path || pathname.startsWith(path),
        );
      },
    }),
    mdx(),
  ],
  build: {
    inlineStylesheets: 'auto',
    format: 'directory',
  },
  image: {
    domains: [],
  },
  compressHTML: true,
});
