import {MetadataRoute} from "next";

export default function sitemap() : MetadataRoute.Sitemap {
  const baseUrl = "https://www.cxgrd.com";

  const routes = [
    '',
    '/about',
    '/changelog',
    'https://docs.cxgrd.com',
    'https://docs.cxgrd.com/get-started',
    'https://docs.cxgrd.com/team',
    'https://docs.cxgrd.com/commands/auth-login',
    'https://docs.cxgrd.com/commands/check',
    'https://docs.cxgrd.com/commands/config',
    'https://docs.cxgrd.com/commands/doctor',
    'https://docs.cxgrd.com/commands/init-hooks',
    'https://docs.cxgrd.com/commands/input',
    'https://docs.cxgrd.com/commands/prompt',
    'https://docs.cxgrd.com/commands/scan',
    'https://docs.cxgrd.com/commands/watch',
    'https://docs.cxgrd.com/merge-policies',
    'https://docs.cxgrd.com/ai-vs-cxgrd',
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