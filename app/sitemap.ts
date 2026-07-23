import {MetadataRoute} from "next";

export default function sitemap() : MetadataRoute.Sitemap {
  const baseUrl = "https://www.cxgrd.com";

  const routes = [
    '',
    '/about',
    '/changelog',
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