import {MetadataRoute} from "next";

export default function sitemap() : MetadataRoute.Sitemap {
  const baseUrl = "https://www.cxgrd.com";

  const routes = [
    '',
    '/about',
    '/changelog',
    '/docs',
    '/docs/quickstart',
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
    '/docs/merge-policies',
    '/docs/ai-vs-cxgrd',
    '/faq',
    '/pricing',
    '/legal/privacy',
    '/legal/terms',
    '/legal/refund',
    '/solutions/pacbtm',
    '/solutions/review-ai-pr',
    '/solutions/ai-hallucinations',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes;

}