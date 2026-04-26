import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://bytedigital.co.nz',
  integrations: [
    sitemap(),
    mdx(),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    domains: [],
  },
  compressHTML: true,
});
