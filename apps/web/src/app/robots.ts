import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/profile", "/orders", "/auth/"],
    },
    sitemap: "https://atlas-shop.com/sitemap.xml",
  };
}
