"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useCompare } from "@/context/CompareContext";

export default function PanelCompare() {
  const { items, remove, clear } = useCompare();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setLoading(false);
      setProducts([]);
      return;
    }
    Promise.all(
      items.map((id: number) =>
        api.get<any>(`/products/${id}`).catch(() => null),
      ),
    ).then((results) => {
      setProducts(results.filter(Boolean));
      setLoading(false);
    });
  }, [items]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl animate-pulse"
            style={{ background: "#e5e7eb" }}
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <Icon
          icon="tabler:arrows-exchange"
          className="w-16 h-16 mx-auto mb-4"
          style={{ color: "var(--dk-text-disabled)" }}
        />
        <h2
          className="font-bold text-lg mb-2"
          style={{ color: "var(--dk-text)" }}
        >
          لیست مقایسه خالی است
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--dk-text-light)" }}>
          محصولاتی را برای مقایسه انتخاب کنید
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium"
          style={{ background: "var(--dk-primary)" }}
        >
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--dk-text)" }}>
          لیست مقایسه ({products.length})
        </h1>
        <button
          onClick={clear}
          className="text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50"
          style={{ color: "#ef4444" }}
        >
          <Icon icon="tabler:trash" className="w-4 h-4" />
          پاک کردن همه
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p: any) => (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-[var(--dk-border)] overflow-hidden"
          >
            <div className="aspect-square bg-[var(--dk-bg)] flex items-center justify-center p-4">
              {p.images?.[0] ? (
                <img
                  src={mediaUrl(p.images[0])}
                  alt={p.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Icon
                  icon="tabler:photo-off"
                  className="w-12 h-12"
                  style={{ color: "var(--dk-text-disabled)" }}
                />
              )}
            </div>
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-sm line-clamp-2">{p.title}</h3>
              <div className="space-y-1.5 text-xs">
                {p.salePrice ? (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--dk-text-light)" }}>قیمت</span>
                    <span
                      className="font-bold"
                      style={{ color: "var(--dk-primary)" }}
                    >
                      {p.salePrice.toLocaleString()} تومان
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--dk-text-light)" }}>قیمت</span>
                    <span>{p.price.toLocaleString()} تومان</span>
                  </div>
                )}
                {p.brand?.name && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--dk-text-light)" }}>برند</span>
                    <span>{p.brand.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--dk-text-light)" }}>موجودی</span>
                  <span
                    className={p.stock > 0 ? "text-green-600" : "text-red-500"}
                  >
                    {p.stock > 0 ? "موجود" : "ناموجود"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Link
                  href={`/products/${p.slug}`}
                  className="flex-1 text-center rounded-lg py-2 text-xs font-medium border transition hover:bg-[var(--dk-bg)]"
                  style={{ borderColor: "var(--dk-border)" }}
                >
                  مشاهده
                </Link>
                <button
                  onClick={() => remove(p.id)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition"
                  style={{ color: "#ef4444", border: "1px solid #ef4444" }}
                >
                  <Icon icon="tabler:x" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
