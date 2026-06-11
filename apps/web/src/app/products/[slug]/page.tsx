import { Metadata } from "next";
import ProductDetailPage from "./page-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://atlas-shop.com";

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "محصول مورد نظر یافت نشد",
      alternates: { canonical: `${SITE_URL}/products/${slug}` },
    };
  }

  const images = (() => {
    try {
      return typeof product.images === "string"
        ? JSON.parse(product.images)
        : product.images || [];
    } catch {
      return [];
    }
  })();

  const title = `${product.title} | فروشگاه اطلس`;
  const description =
    product.metaDesc ||
    product.description?.slice(0, 160) ||
    `خرید ${product.title} با بهترین قیمت در فروشگاه اطلس`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/products/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: images.length > 0 ? [`${SITE_URL}${images[0]}`] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.metaDesc || product.description || "",
        sku: product.sku || undefined,
        image: (() => {
          try {
            const imgs =
              typeof product.images === "string"
                ? JSON.parse(product.images)
                : product.images || [];
            return imgs.length > 0
              ? imgs.map((i: string) => `${SITE_URL}${i}`)
              : undefined;
          } catch {
            return undefined;
          }
        })(),
        offers: {
          "@type": "Offer",
          price: product.salePrice || product.price,
          priceCurrency: "IRR",
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
        ...(product.category ? { category: product.category.name } : {}),
        ...(product.averageRating > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.averageRating,
                reviewCount: product.numReviews || 0,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailPage />
    </>
  );
}
