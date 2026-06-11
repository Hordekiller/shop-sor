import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://atlas-shop.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://atlas-shop.com/products', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://atlas-shop.com/cart', lastModified: new Date(), changeFrequency: 'never', priority: 0.3 },
    { url: 'https://atlas-shop.com/auth/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: 'https://atlas-shop.com/auth/register', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];
}
