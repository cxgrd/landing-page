import {MetadataRoute} from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/team/', '/billing/', '/auth/'],
    },
    sitemap: 'https://cxgrd.com/sitemap.xml',
  }
}