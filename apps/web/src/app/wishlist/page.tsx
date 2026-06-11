"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import { api } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
  category?: { id: number; name: string };
}

export default function WishlistPage() {
  const router = useRouter();
  const { wishlisted, toggle } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    api
      .get<{ data: { product: Product }[] }>("/wishlist")
      .then((res) => setProducts(res.data.map((w) => w.product)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <Header />
      <div className="dk-container py-6">
        <nav className="text-xs text-[var(--dk-text-light)] mb-5">
          <Link href="/" className="hover:text-[var(--dk-primary)]">
            خانه
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--dk-text)]">علاقه‌مندی‌ها</span>
        </nav>

        <div className="flex items-center gap-2 mb-6">
          <FontAwesomeIcon icon={faHeart} className="text-red-500" />
          <h1 className="text-xl font-bold">علاقه‌مندی‌ها</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, n) => (
              <div key={n} className="dk-card p-3 animate-pulse">
                <div className="aspect-square rounded-lg bg-[var(--dk-bg)] mb-3" />
                <div className="h-3 bg-[var(--dk-bg)] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[var(--dk-bg)] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <FontAwesomeIcon
              icon={faHeart}
              className="text-6xl mb-4 text-gray-300"
            />
            <p className="text-[var(--dk-text-light)] mb-6">
              لیست علاقه‌مندی‌های شما خالی است!
            </p>
            <Link href="/products" className="dk-btn-primary inline-block">
              مشاهده محصولات
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-[var(--dk-text-light)] mb-3">
              {products.length} محصول در لیست علاقه‌مندی‌ها
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  wishlisted={wishlisted.has(product.id)}
                  onToggleWishlist={() => toggle(product.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
