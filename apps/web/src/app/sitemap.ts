import { MetadataRoute } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const SITE_URL = "https://atlas-shop.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/rules`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/auth/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];
  let customPages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];

  try {
    const [productsRes, categoriesRes, pagesRes, blogRes] = await Promise.all([
      fetch(`${API_URL}/products?take=1000&sort=newest`)
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      fetch(`${API_URL}/categories`)
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${API_URL}/pages`)
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${API_URL}/blog/posts?limit=500`)
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
    ]);

    const products = productsRes.data || [];
    productPages = products.map((p: any) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt || p.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const categories = Array.isArray(categoriesRes) ? categoriesRes : [];
    categoryPages = categories.map((c: any) => ({
      url: `${SITE_URL}/category/${c.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const pages = Array.isArray(pagesRes)
      ? pagesRes.filter((p: any) => p.isActive)
      : [];
    customPages = pages.map((p: any) => ({
      url: `${SITE_URL}/page/${p.slug}`,
      lastModified: new Date(p.updatedAt || p.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    const blogData = blogRes.data || [];
    blogPages = [
      {
        url: `${SITE_URL}/blog`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
      ...blogData.map((p: any) => ({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: new Date(p.publishedAt || p.createdAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    // fallback to static pages only
  }

  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
    ...customPages,
    ...blogPages,
  ];
}
