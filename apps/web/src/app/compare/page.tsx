"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { useCompare } from "@/context/CompareContext";
import Header from "@/components/Header";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faStarHalfStroke,
  faScaleBalanced,
  faTrash,
  faShoppingCart,
} from "@fortawesome/free-solid-svg-icons";
import { useCart } from "@/context/CartContext";

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  stock: number;
  description: string;
  images: string[];
  category: { id: number; name: string; slug: string };
  averageRating: number;
  numReviews: number;
  attrDefs?: { id: number; name: string; values: string[] }[];
  variants?: {
    id: number;
    name: string;
    price?: number;
    stock: number;
    isActive?: boolean;
  }[];
}

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(items.map((id) => api.get<Product>(`/products/${id}`)))
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [items]);

  const allAttrKeys = [
    ...new Set(products.flatMap((p) => p.attrDefs?.map((a) => a.name) || [])),
  ];

  const getAttrValue = (product: Product, key: string) => {
    const attr = product.attrDefs?.find((a) => a.name === key);
    return attr ? attr.values.join(", ") : "—";
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="dk-container py-8 animate-pulse space-y-4">
          <div className="h-8 bg-[var(--dk-bg)] rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-[var(--dk-bg)] rounded-xl"
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="dk-container py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faScaleBalanced}
              className="text-2xl text-[var(--dk-primary)]"
            />
            <h1 className="text-xl font-bold">مقایسه محصولات</h1>
            <span className="text-sm text-[var(--dk-text-light)]">
              ({items.length} محصول)
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={clear}
              className="text-sm text-red-500 hover:text-red-600 transition flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
              پاک کردن همه
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <FontAwesomeIcon
              icon={faScaleBalanced}
              className="text-6xl text-[var(--dk-text-light)] mb-4"
            />
            <h2 className="text-lg font-bold mb-2">
              محصولی برای مقایسه وجود ندارد
            </h2>
            <p className="text-sm text-[var(--dk-text-light)] mb-6">
              محصولات مورد نظر خود را انتخاب کرده و مقایسه کنید
            </p>
            <Link href="/products" className="dk-btn-primary">
              مشاهده محصولات
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-right px-4 py-3 w-32 min-w-[120px] bg-[var(--dk-bg)] rounded-r-xl border-b" />
                  {products.map((p) => (
                    <th
                      key={p.id}
                      className="px-3 py-3 text-center border-b min-w-[200px] align-top"
                    >
                      <button
                        onClick={() => remove(p.id)}
                        className="float-left text-[var(--dk-text-light)] hover:text-red-500 transition"
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="w-3.5 h-3.5"
                        />
                      </button>
                      <Link href={`/products/${p.slug}`}>
                        <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden bg-[var(--dk-bg)] mb-2">
                          <img
                            src={mediaUrl(p.images?.[0])}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-sm font-medium leading-5 line-clamp-2 min-h-[2.5rem]">
                          {p.title}
                        </div>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price */}
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium text-[var(--dk-text-light)]">
                    قیمت
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="px-3 py-3 text-center">
                      <span className="font-bold text-[var(--dk-primary)]">
                        {(p.salePrice || p.price).toLocaleString()}
                      </span>
                      <span className="text-xs text-[var(--dk-text-light)] mr-1">
                        تومان
                      </span>
                      {p.salePrice && p.salePrice < p.price && (
                        <div className="text-xs text-[var(--dk-text-light)] line-through mt-0.5">
                          {p.price.toLocaleString()} تومان
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium text-[var(--dk-text-light)]">
                    امتیاز
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="font-bold text-[var(--dk-gold)]">
                          {p.averageRating > 0
                            ? p.averageRating.toFixed(1)
                            : "—"}
                        </span>
                        <span className="flex text-[var(--dk-gold)] text-xs">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <FontAwesomeIcon
                              key={i}
                              icon={
                                i <= Math.round(p.averageRating)
                                  ? faStar
                                  : faStar
                              }
                              className={
                                i <= Math.round(p.averageRating)
                                  ? ""
                                  : "opacity-25"
                              }
                            />
                          ))}
                        </span>
                        <span className="text-xs text-[var(--dk-text-light)]">
                          ({p.numReviews})
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Category */}
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium text-[var(--dk-text-light)]">
                    دسته‌بندی
                  </td>
                  {products.map((p) => (
                    <td
                      key={p.id}
                      className="px-3 py-3 text-center text-[var(--dk-text)]"
                    >
                      <Link
                        href={`/category/${p.category?.id}`}
                        className="hover:text-[var(--dk-primary)]"
                      >
                        {p.category?.name || "—"}
                      </Link>
                    </td>
                  ))}
                </tr>

                {/* Stock */}
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium text-[var(--dk-text-light)]">
                    موجودی
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="px-3 py-3 text-center">
                      {p.stock > 0 ? (
                        <span className="text-green-600 font-medium">
                          موجود ({p.stock})
                        </span>
                      ) : (
                        <span className="text-red-500 font-medium">
                          ناموجود
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Variants / Colors */}
                {products.some((p) => p.variants && p.variants.length > 0) && (
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium text-[var(--dk-text-light)]">
                      تنوع
                    </td>
                    {products.map((p) => (
                      <td
                        key={p.id}
                        className="px-3 py-3 text-center text-xs text-[var(--dk-text)]"
                      >
                        {p.variants && p.variants.length > 0
                          ? p.variants
                              .filter((v) => v.isActive)
                              .map((v) => v.name)
                              .join("، ")
                          : "—"}
                      </td>
                    ))}
                  </tr>
                )}

                {/* Dynamic Attributes */}
                {allAttrKeys.map((key) => (
                  <tr key={key} className="border-b">
                    <td className="px-4 py-3 font-medium text-[var(--dk-text-light)]">
                      {key}
                    </td>
                    {products.map((p) => (
                      <td
                        key={p.id}
                        className="px-3 py-3 text-center text-[var(--dk-text)]"
                      >
                        {getAttrValue(p, key)}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Add to cart */}
                <tr>
                  <td className="px-4 py-3" />
                  {products.map((p) => (
                    <td key={p.id} className="px-3 py-4 text-center">
                      <button
                        onClick={() => {
                          addItem({
                            productId: p.id,
                            title: p.title,
                            price: p.salePrice || p.price,
                            image: p.images?.[0] || null,
                            quantity: 1,
                            stock: p.stock,
                          });
                        }}
                        className="w-full rounded-xl py-2.5 text-sm font-medium text-white transition hover:brightness-110"
                        style={{ background: "var(--dk-primary)" }}
                      >
                        <FontAwesomeIcon
                          icon={faShoppingCart}
                          className="ml-1.5"
                        />
                        افزودن به سبد خرید
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
