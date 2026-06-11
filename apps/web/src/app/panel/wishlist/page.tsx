"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";

interface WishlistItem {
  id: number;
  productId: number;
  product: {
    id: number;
    title: string;
    slug: string;
    price: number;
    discountPercent: number;
    images: string[];
  };
}

export default function PanelWishlist() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    api
      .get<{ data: WishlistItem[] }>("/wishlist")
      .then((res) => setItems(res.data || []))
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleRemove = async (productId: number) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } catch {
      alert("خطا در حذف از علاقه‌مندی‌ها");
    }
  };

  const addToCart = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post("/cart/add", { productId, quantity: 1, variantId: 0 });
      alert("به سبد خرید اضافه شد");
    } catch {
      alert("خطا");
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-40 rounded-2xl animate-pulse"
            style={{ background: "#e5e7eb" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1
        className="text-xl font-bold mb-1"
        style={{ color: "var(--dk-text)" }}
      >
        علاقه‌مندی‌ها
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--dk-text-light)" }}>
        محصولات مورد علاقه شما
      </p>

      {items.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl border bg-white"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <Icon
            icon="tabler:heart-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--dk-text-light)" }}
          />
          <p className="text-sm mb-4" style={{ color: "var(--dk-text-light)" }}>
            هیچ محصولی در لیست علاقه‌مندی‌ها نیست.
          </p>
          <Link
            href="/products"
            className="inline-block px-5 py-2.5 rounded-xl text-sm text-white font-medium"
            style={{ background: "var(--dk-primary)" }}
          >
            مشاهده محصولات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => {
            const img = item.product.images?.[0];
            const discountedPrice =
              item.product.discountPercent > 0
                ? item.product.price * (1 - item.product.discountPercent / 100)
                : null;
            return (
              <div
                key={item.id}
                className="rounded-2xl border bg-white overflow-hidden transition hover:shadow-sm"
                style={{ borderColor: "var(--dk-border)" }}
              >
                <Link
                  href={`/products/${item.product.slug || item.product.id}`}
                  className="block"
                >
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                    {img ? (
                      <img
                        src={mediaUrl(img)}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon
                        icon="tabler:photo"
                        className="w-8 h-8"
                        style={{ color: "var(--dk-text-light)" }}
                      />
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link
                    href={`/products/${item.product.slug || item.product.id}`}
                  >
                    <p className="text-sm font-medium line-clamp-2 mb-2 hover:text-[var(--dk-primary)]">
                      {item.product.title}
                    </p>
                  </Link>
                  <div className="flex items-center justify-between">
                    <div>
                      {discountedPrice ? (
                        <div>
                          <span
                            className="text-xs line-through"
                            style={{ color: "var(--dk-text-light)" }}
                          >
                            {item.product.price.toLocaleString()} تومان
                          </span>
                          <p className="font-bold text-sm">
                            {Math.round(discountedPrice).toLocaleString()} تومان
                          </p>
                        </div>
                      ) : (
                        <p className="font-bold text-sm">
                          {item.product.price.toLocaleString()} تومان
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => addToCart(item.product.id, e)}
                        className="p-2 rounded-xl hover:bg-green-50 transition"
                        style={{ color: "#28C76F" }}
                        title="افزودن به سبد خرید"
                      >
                        <Icon
                          icon="tabler:shopping-cart-plus"
                          className="w-4 h-4"
                        />
                      </button>
                      <button
                        onClick={() => handleRemove(item.product.id)}
                        className="p-2 rounded-xl hover:bg-red-50 transition"
                        style={{ color: "#ef4444" }}
                        title="حذف از علاقه‌مندی‌ها"
                      >
                        <Icon icon="tabler:heart-off" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
