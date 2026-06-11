"use client";

import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href
        ? {
            item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://atlas-shop.com"}${item.href}`,
          }
        : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-xs text-[var(--dk-text-light)] mb-5 flex items-center flex-wrap gap-1">
        <Link href="/" className="hover:text-[var(--dk-primary)] transition">
          خانه
        </Link>
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="mx-1">/</span>
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-[var(--dk-primary)] transition truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--dk-text)] truncate max-w-[200px]">
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
