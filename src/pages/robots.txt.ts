import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/*$/, '/');
  const sitemap = new URL(`${base}sitemap-index.xml`, site ?? new URL('https://fatimarem.edu.ar')).href;

  const cuerpo = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /panel',
    '',
    `Sitemap: ${sitemap}`,
    ''
  ].join('\n');

  return new Response(cuerpo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
