import {MetadataRoute} from "next";

export default function sitemap() : MetadataRoute.Sitemap {
  const baseUrl = "https://www.cxgrd.com";

  const routes = [
    '',
    '/about',
    '/changelog',
    '/docs',
    '/docs/installation',
    '/docs/team',
    '/docs/commands/auth-login',
    '/docs/commands/check',
    '/docs/commands/config',
    '/docs/commands/doctor',
    '/docs/commands/init-hooks',
    '/docs/commands/input',
    '/docs/commands/prompt',
    '/docs/commands/scan',
    '/docs/commands/watch',
    '/pricing',
    {path : '/legal/privacy', priority : 0.4},
    {path : '/legal/terms', priority : 0.4},
    {path : '/legal/refund', priority : 0.4},
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes;

}