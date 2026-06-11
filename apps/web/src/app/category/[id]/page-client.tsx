"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useWishlist } from "@/context/WishlistContext";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInbox } from "@fortawesome/free-solid-svg-icons";

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
}

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  children?: { id: number; name: string; slug: string }[];
}

export default function CategoryPageClient() {
  const { id } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [cat, setCat] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isWishlisted, toggle } = useWishlist();
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 24;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<{ data: Product[]; total: number }>(
        `/products?categoryId=${id}&sort=${sort}&page=${page}&take=${perPage}`,
      ),
      api.get<CategoryData>(`/categories/${id}`).catch(() => null),
    ])
      .then(([prodRes, catData]) => {
        setProducts(prodRes.data);
        setTotal(prodRes.total);
        if (catData) setCat(catData);
      })
      .finally(() => setLoading(false));
  }, [id, sort, page]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <>
      <Header />
      <div className="dk-container py-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-[var(--dk-text-light)] mb-4">
          <Link href="/" className="hover:text-[var(--dk-primary)]">
            خانه
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/products" className="hover:text-[var(--dk-primary)]">
            محصولات
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--dk-text)]">
            {cat?.name || "دسته‌بندی"}
          </span>
        </nav>

        {/* Category Header */}
        <div className="dk-card p-5 mb-5">
          <div className="flex items-center gap-4">
            {cat?.image && (
              <img
                src={mediaUrl(cat.image)}
                alt={cat.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
            )}
            <div>
              <h1 className="text-xl font-bold">{cat?.name || "دسته‌بندی"}</h1>
              {cat?.description && (
                <p className="text-sm text-[var(--dk-text-light)] mt-1">
                  {cat.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Subcategories */}
        {cat?.children && cat.children.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            {cat.children.map((child) => (
              <Link
                key={child.id}
                href={`/category/${child.id}`}
                className="px-4 py-2 rounded-full border border-[var(--dk-border)] text-sm hover:border-[var(--dk-primary)] hover:text-[var(--dk-primary)] transition"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        {/* Sort + Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[var(--dk-text-light)]">{total} محصول</p>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="rounded-lg bg-[var(--dk-bg)] border-0 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
          >
            <option value="newest">جدیدترین</option>
            <option value="cheapest">ارزان‌ترین</option>
            <option value="expensive">گران‌ترین</option>
            <option value="popular">محبوب‌ترین</option>
          </select>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="dk-card p-3 animate-pulse">
                <div className="aspect-square rounded-lg bg-[var(--dk-bg)] mb-3" />
                <div className="h-3 bg-[var(--dk-bg)] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[var(--dk-bg)] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faInbox} className="text-5xl mb-4 block" />
            <p className="text-[var(--dk-text-light)]">
              هیچ محصولی در این دسته وجود ندارد.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlisted={isWishlisted(product.id)}
                onToggleWishlist={() => toggle(product.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-[var(--dk-bg)] disabled:opacity-30"
            >
              قبلی
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${
                    page === p ? "text-white" : "border hover:bg-[var(--dk-bg)]"
                  }`}
                  style={page === p ? { background: "var(--dk-primary)" } : {}}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-[var(--dk-bg)] disabled:opacity-30"
            >
              بعدی
            </button>
          </div>
        )}
      </div>
    </>
  );
}
