import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL || 'https://fatimarem.edu.ar';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: {
    format: 'file'
  },
  integrations: [
    sitemap({
      filter: (page) => !/\/(admin|panel)(-|\.|$)/.test(page),
      serialize: (item) => {
        const url = new URL(item.url);
        if (!url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(url.pathname)) {
          url.pathname += '.html';
          item.url = url.href;
        }
        return item;
      }
    })
  ]
});
