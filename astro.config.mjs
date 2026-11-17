// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ahleaseservice.com',
  trailingSlash: 'ignore', // links and the sitemap use the ending slash
  integrations: [sitemap({ filter: (page) => !page.includes('/thank-you') && !page.includes('/admin') })],
  build: { inlineStylesheets: 'always' },
});
