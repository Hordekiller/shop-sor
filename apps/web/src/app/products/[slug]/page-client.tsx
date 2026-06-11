"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { mediaUrl, srcsetFromUrl, defaultSizes } from "@/lib/media";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { toJalaliHuman } from "@/lib/date";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faComment,
  faStar,
  faStarHalfStroke,
  faHeart,
  faMobile,
  faTv,
  faX,
  faCheck,
  faXmark,
  faScaleBalanced,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  images: string[];
  category: { id: number; name: string };
  shop: { id: number; name: string };
  reviews: {
    id: number;
    rating: number;
    comment: string;
    user: { id: number; name: string };
    createdAt: string;
  }[];
  createdAt: string;
  variants?: Variant[];
  attrDefs?: AttrDef[];
  minOrderQty?: number;
  maxOrderQty?: number;
}

interface Variant {
  id: number;
  name: string;
  sku?: string;
  price?: number;
  stock: number;
  attributes: Record<string, string>;
  images: string[];
  isActive: boolean;
}

interface AttrDef {
  id: number;
  name: string;
  values: string[];
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { has: hasCompare, toggle: toggleCompare } = useCompare();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
    pros: "",
    cons: "",
  });
  const [reviewFormSuccess, setReviewFormSuccess] = useState("");
  const [reviewFormError, setReviewFormError] = useState("");
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(
    {},
  );
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewTab, setReviewTab] = useState<"customer" | "expert">("customer");
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsStats, setReviewsStats] = useState({
    averageRating: 0,
    numReviews: 0,
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [stockAlertSent, setStockAlertSent] = useState(false);
  const [stockAlertError, setStockAlertError] = useState("");

  const handleStockAlert = async () => {
    if (!product) return;
    const token = localStorage.getItem("web_token");
    if (!token) {
      setStockAlertError("لطفا ابتدا وارد حساب خود شوید.");
      return;
    }
    try {
      await api.post("/stock-alerts", {
        productId: product.id,
        variantId: selectedVariant?.id,
      });
      setStockAlertSent(true);
      setStockAlertError("");
    } catch (err: any) {
      setStockAlertError(err?.message || "خطا در ثبت اطلاع‌رسانی");
    }
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get<Product>(`/products/${slug}`)
      .then((p) => {
        setProduct(p);
        setActiveImg(0);
        const initialAttrs: Record<string, string> = {};
        if (p.attrDefs) {
          for (const a of p.attrDefs) {
            if (a.values.length > 0) initialAttrs[a.name] = a.values[0];
          }
        }
        setSelectedAttrs(initialAttrs);
        return api.get<{ data: Product[] }>(
          `/products?categoryId=${p.category?.id}&sort=newest&take=6`,
        );
      })
      .then((res) => setRelated(res.data.filter((r) => r.slug !== slug)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product?.variants || product.variants.length === 0) {
      setSelectedVariant(null);
      return;
    }
    const matching = product.variants.find((v) =>
      Object.entries(selectedAttrs).every(
        ([key, value]) => v.attributes[key] === value,
      ),
    );
    setSelectedVariant(matching || null);
  }, [selectedAttrs, product?.variants]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      title: product.title,
      price: selectedVariant?.price ?? (product.salePrice || product.price),
      image: displayImages[0] || product.images?.[0] || null,
      quantity,
      stock: displayStock,
      minOrderQty: product.minOrderQty,
      maxOrderQty: product.maxOrderQty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const token = localStorage.getItem("web_token");
    if (!token) {
      setReviewFormError("لطفا ابتدا وارد حساب خود شوید.");
      return;
    }
    setReviewFormSuccess("");
    setReviewFormError("");
    try {
      const prosArray = reviewForm.pros
        ? reviewForm.pros.split("\n").filter(Boolean)
        : [];
      const consArray = reviewForm.cons
        ? reviewForm.cons.split("\n").filter(Boolean)
        : [];
      await api.post(`/products/${product.id}/reviews`, {
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        pros: prosArray,
        cons: consArray,
      });
      setReviewForm({ rating: 5, title: "", comment: "", pros: "", cons: "" });
      setReviewFormSuccess("نظر شما با موفقیت ثبت شد.");
      setTimeout(() => setReviewFormSuccess(""), 3000);
      setReviewPage(1);
    } catch (err: any) {
      setReviewFormError(
        err?.message || "خطا در ثبت نظر. لطفا مجددا تلاش کنید.",
      );
    }
  };

  const handleLike = async (reviewId: number, isLiked: boolean) => {
    const token = localStorage.getItem("web_token");
    if (!token) return;
    try {
      if (isLiked) {
        await api.delete(`/reviews/${reviewId}/like`);
      } else {
        await api.post(`/reviews/${reviewId}/like`, {});
      }
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                isLiked: !isLiked,
                likes: isLiked ? (r.likes || 1) - 1 : (r.likes || 0) + 1,
              }
            : r,
        ),
      );
    } catch (err) {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!product) return;
    setReviewLoading(true);
    api
      .get(
        `/products/${product.id}/reviews?page=${reviewPage}&limit=10&expert=${reviewTab === "expert"}`,
      )
      .then((res: any) => {
        setReviews(res.data);
        setReviewTotalPages(res.totalPages);
        setReviewsStats({
          averageRating: res.averageRating,
          numReviews: res.numReviews,
        });
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewLoading(false));
  }, [product?.id, reviewPage, reviewTab]);

  // JSON-LD Structured Data
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description?.slice(0, 200),
        image: product.images?.map((i: string) => mediaUrl(i)),
        sku: product.slug,
        offers: {
          "@type": "Offer",
          url: typeof window !== "undefined" ? window.location.href : "",
          priceCurrency: "IRR",
          price: (product.salePrice || product.price) * 10, // convert to IRR
          priceValidUntil: new Date(Date.now() + 30 * 86400000)
            .toISOString()
            .split("T")[0],
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: "اطلس شاپ" },
        },
        ...((product as any).averageRating
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: (product as any).averageRating,
                reviewCount: (product as any).numReviews || 0,
              },
            }
          : {}),
      }
    : null;

  if (loading) {
    return (
      <>
        <Header />
        <div className="dk-container py-8">
          <div className="animate-pulse grid md:grid-cols-12 gap-6">
            <div className="md:col-span-5 aspect-square rounded-2xl bg-[var(--dk-bg)]" />
            <div className="md:col-span-7 space-y-4">
              <div className="h-6 bg-[var(--dk-bg)] rounded w-3/4" />
              <div className="h-4 bg-[var(--dk-bg)] rounded w-1/2" />
              <div className="h-24 bg-[var(--dk-bg)] rounded" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="dk-container py-20 text-center">
          <FontAwesomeIcon icon={faSearch} className="text-5xl mb-4" />
          <h2 className="text-xl font-bold mb-2">محصول مورد نظر یافت نشد</h2>
          <p className="text-sm text-[var(--dk-text-light)] mb-6">
            لینک درخواستی可能存在 باگ یا حذف شده است
          </p>
          <Link href="/products" className="dk-btn-primary">
            مشاهده محصولات
          </Link>
        </div>
      </>
    );
  }

  const displayOldPrice = selectedVariant?.price ? 0 : (product.salePrice ?? 0);
  const displayPrice =
    selectedVariant?.price ?? product.salePrice ?? product.price;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const displayImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : product.images;
  const hasDiscount = selectedVariant?.price
    ? false
    : !!(product.salePrice && product.salePrice < product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const images = (
    displayImages?.length > 0 ? displayImages : product.images || []
  ).map((i: string) => mediaUrl(i));

  return (
    <>
      <Header />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-4 left-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
            &times;
          </button>
          <img
            src={images[activeImg]}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImg(i);
                }}
                className={`w-3 h-3 rounded-full ${i === activeImg ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="dk-container py-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-[var(--dk-text-light)] mb-5 flex items-center flex-wrap gap-1">
          <Link href="/" className="hover:text-[var(--dk-primary)] transition">
            خانه
          </Link>
          <span className="mx-1">/</span>
          <Link
            href="/products"
            className="hover:text-[var(--dk-primary)] transition"
          >
            محصولات
          </Link>
          <span className="mx-1">/</span>
          <Link
            href={`/category/${product.category?.id}`}
            className="hover:text-[var(--dk-primary)] transition"
          >
            {product.category?.name}
          </Link>
          <span className="mx-1">/</span>
          <span className="text-[var(--dk-text)] truncate max-w-[200px]">
            {product.title}
          </span>
        </nav>

        {/* Main Section */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Gallery */}
          <div className="md:col-span-5">
            <div className="dk-card p-3">
              <div
                className="aspect-square rounded-xl overflow-hidden bg-[var(--dk-bg)] mb-3 cursor-zoom-in relative group"
                onClick={() => images.length > 0 && setLightbox(true)}
              >
                <img
                  src={images[activeImg] || images[0]}
                  alt={product.title}
                  srcSet={srcsetFromUrl(images[activeImg] || images[0])}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {hasDiscount && (
                  <span className="absolute top-3 right-3 dk-badge-amazing text-xs">
                    %{discountPercent}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="text-white/0 group-hover:text-white/70 text-3xl transition"
                  />
                </div>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                        i === activeImg
                          ? "border-[var(--dk-primary)] shadow-sm"
                          : "border-transparent hover:border-[var(--dk-border)]"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        loading="lazy"
                        srcSet={srcsetFromUrl(img)}
                        sizes="64px"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="md:col-span-4">
            <div className="dk-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-lg font-bold leading-7 flex-1">
                  {product.title}
                </h1>
                {product.shop && (
                  <span className="text-[10px] text-[var(--dk-text-light)] shrink-0 bg-[var(--dk-bg)] px-2 py-1 rounded-full">
                    {product.shop.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-[var(--dk-gold)] inline-flex gap-0.5">
                    {Array.from({
                      length: Math.round(reviewsStats.averageRating),
                    }).map((_, i) => (
                      <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        className="w-4 h-4"
                      />
                    ))}
                  </span>
                  <span className="text-[var(--dk-gold)] font-bold">
                    {reviewsStats.averageRating > 0
                      ? reviewsStats.averageRating.toFixed(1)
                      : "۰"}
                  </span>
                </div>
                <span className="text-[var(--dk-text-light)]">
                  ({reviewsStats.numReviews} نظر)
                </span>
                <span className="w-px h-4 bg-[var(--dk-border)]" />
                <span className="text-green-600 text-xs">
                  {product.stock > 0
                    ? `موجود (${product.stock} عدد)`
                    : "ناموجود"}
                </span>
              </div>

              {/* Variant Attribute Selectors */}
              {product.attrDefs && product.attrDefs.length > 0 && (
                <div className="border-t border-[var(--dk-border)] pt-3 space-y-3">
                  {product.attrDefs.map((attr) => (
                    <div key={attr.id}>
                      <span className="text-xs font-medium text-[var(--dk-text-light)] block mb-1.5">
                        {attr.name}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map((val) => {
                          const active = selectedAttrs[attr.name] === val;
                          return (
                            <button
                              key={val}
                              onClick={() =>
                                setSelectedAttrs({
                                  ...selectedAttrs,
                                  [attr.name]: val,
                                })
                              }
                              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                                active
                                  ? "border-[var(--dk-primary)] bg-[var(--dk-primary)]/10 text-[var(--dk-primary)] font-medium"
                                  : "border-[var(--dk-border)] text-[var(--dk-text-light)] hover:border-[var(--dk-primary)]"
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-[var(--dk-text-light)] border-t border-[var(--dk-border)] pt-3">
                <span>
                  دسته:{" "}
                  <Link
                    href={`/category/${product.category?.id}`}
                    className="text-[var(--dk-primary)] hover:underline"
                  >
                    {product.category?.name}
                  </Link>
                </span>
                <span>شناسه: {product.id}</span>
              </div>

              {/* Description */}
              <div className="border-t border-[var(--dk-border)] pt-3">
                <h4 className="text-sm font-medium mb-2">توضیحات</h4>
                {product.description ? (
                  <div className="text-sm text-[var(--dk-text-light)] leading-7 whitespace-pre-line max-h-40 overflow-y-auto scrollbar-hide">
                    {product.description}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--dk-text-light)] italic">
                    توضیحاتی ثبت نشده است
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Buy Box */}
          <div className="md:col-span-3">
            <div className="dk-card p-5 space-y-5 sticky top-24">
              {/* Price */}
              <div>
                {hasDiscount ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-[var(--dk-primary)]">
                        {displayPrice.toLocaleString()}
                      </span>
                      <span className="text-xs text-[var(--dk-text-light)]">
                        تومان
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="dk-price-old text-sm">
                        {product.price.toLocaleString()} تومان
                      </span>
                      <span className="dk-badge-amazing text-xs">
                        %{discountPercent}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      شما{" "}
                      {(product.price - product.salePrice!).toLocaleString()}{" "}
                      تومان صرفه‌جویی می‌کنید
                    </p>
                  </>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {displayPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-[var(--dk-text-light)]">
                      تومان
                    </span>
                    {selectedVariant?.price && (
                      <span className="dk-price-old text-xs">
                        {product.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Stock status bar */}
              <div
                className={`h-2 rounded-full overflow-hidden bg-[var(--dk-bg)] ${displayStock > 0 ? "" : "opacity-30"}`}
              >
                <div
                  className={`h-full rounded-full transition-all ${displayStock > 10 ? "bg-green-500" : displayStock > 0 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{
                    width: `${Math.min(100, (displayStock / 50) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    displayStock > 0 ? "text-green-600" : "text-red-500"
                  }
                >
                  {displayStock > 0
                    ? displayStock > 10
                      ? "موجودی کافی"
                      : "موجودی محدود"
                    : "ناموجود"}
                </span>
                {displayStock > 0 && (
                  <span className="text-[var(--dk-text-light)]">
                    {displayStock} عدد در انبار
                  </span>
                )}
              </div>

              {/* Quantity + Add to cart (Main CTA) / Stock Alert */}
              {displayStock > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center shrink-0 rounded-xl bg-[var(--dk-bg)] p-1 border border-[var(--dk-border)]">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg font-medium hover:shadow-sm transition disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="font-bold text-sm min-w-[3ch] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(displayStock, quantity + 1))
                      }
                      className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg font-medium hover:shadow-sm transition disabled:opacity-50"
                      disabled={quantity >= displayStock}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 rounded-xl py-3.5 font-medium text-sm transition-all active:scale-95 ${
                      added
                        ? "bg-green-500 text-white"
                        : "text-white hover:brightness-110"
                    }`}
                    style={added ? {} : { background: "var(--dk-primary)" }}
                  >
                    {added ? (
                      <span className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />{" "}
                        اضافه شد
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 font-bold">
                        افزودن به سبد خرید
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleStockAlert}
                    className="w-full rounded-xl py-3.5 font-medium text-sm transition-all active:scale-95 border-2"
                    style={{
                      borderColor: "var(--dk-primary)",
                      color: "var(--dk-primary)",
                    }}
                  >
                    {stockAlertSent ? (
                      <span className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />{" "}
                        به شما اطلاع می‌دهیم
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 font-bold">
                        خبرم کن
                      </span>
                    )}
                  </button>
                  {stockAlertError && (
                    <p className="text-xs text-red-500 text-center">
                      {stockAlertError}
                    </p>
                  )}
                </div>
              )}

              {/* Wishlist + Compare — secondary actions side by side */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggle(product.id)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium border transition"
                  style={{
                    borderColor: isWishlisted(product.id)
                      ? "var(--dk-primary)"
                      : "var(--dk-border)",
                    color: isWishlisted(product.id)
                      ? "var(--dk-primary)"
                      : "var(--dk-text-light)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={isWishlisted(product.id) ? faHeart : faHeartRegular}
                    className={isWishlisted(product.id) ? "text-red-500" : ""}
                  />
                  {isWishlisted(product.id) ? "علاقه‌مندی" : "علاقه‌مندی"}
                </button>
                <button
                  onClick={() => toggleCompare(product.id)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium border transition"
                  style={{
                    borderColor: hasCompare(product.id)
                      ? "var(--dk-primary)"
                      : "var(--dk-border)",
                    color: hasCompare(product.id)
                      ? "var(--dk-primary)"
                      : "var(--dk-text-light)",
                  }}
                >
                  <FontAwesomeIcon icon={faScaleBalanced} />
                  {hasCompare(product.id) ? "مقایسه" : "مقایسه"}
                </button>
              </div>

              {/* Product meta */}
              <div className="text-[10px] text-[var(--dk-text-light)] space-y-1.5 pt-3 border-t border-[var(--dk-border)]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>تاریخ انتشار: {toJalaliHuman(product.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span>شناسه محصول: {product.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>دسته‌بندی: {product.category?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-10">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                setReviewTab("customer");
                setReviewPage(1);
              }}
              className={`text-lg font-bold pb-2 border-b-2 transition ${reviewTab === "customer" ? "border-[var(--dk-primary)] text-[var(--dk-primary)]" : "border-transparent text-[var(--dk-text)]"}`}
            >
              نظرات کاربران
            </button>
            <button
              onClick={() => {
                setReviewTab("expert");
                setReviewPage(1);
              }}
              className={`text-lg font-bold pb-2 border-b-2 transition ${reviewTab === "expert" ? "border-[var(--dk-primary)] text-[var(--dk-primary)]" : "border-transparent text-[var(--dk-text)]"}`}
            >
              نظرات کارشناسی
            </button>
          </div>

          {reviewTab === "customer" && reviewsStats.numReviews > 0 && (
            <div className="dk-card p-5 mb-6 flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--dk-gold)]">
                  {reviewsStats.averageRating.toFixed(1)}
                </div>
                <div className="text-[var(--dk-gold)] text-sm mt-1 inline-flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FontAwesomeIcon
                      key={i}
                      icon={faStar}
                      className="w-4 h-4"
                    />
                  ))}
                </div>
                <div className="text-xs text-[var(--dk-text-light)] mt-1">
                  از {reviewsStats.numReviews} نظر
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  const pct =
                    reviewsStats.numReviews > 0
                      ? (count / reviewsStats.numReviews) * 100
                      : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-left inline-flex items-center gap-1">
                        {star}{" "}
                        <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--dk-bg)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--dk-gold)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-[var(--dk-text-light)]">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {reviewLoading ? (
            <div className="text-center py-12 text-[var(--dk-text-light)]">
              <p>در حال بارگذاری نظرات...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => {
                const pros =
                  typeof review.pros === "string"
                    ? (() => {
                        try {
                          return JSON.parse(review.pros);
                        } catch {
                          return [];
                        }
                      })()
                    : review.pros || [];
                const cons =
                  typeof review.cons === "string"
                    ? (() => {
                        try {
                          return JSON.parse(review.cons);
                        } catch {
                          return [];
                        }
                      })()
                    : review.cons || [];
                const media = review.media || [];

                return (
                  <div
                    key={review.id}
                    className="dk-card p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--dk-primary)] to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                          {(review.user?.name || review.expertName || "ن")[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium block">
                              {reviewTab === "expert"
                                ? `کارشناس: ${review.expertName || "کارشناس"}`
                                : review.user?.name || "کاربر ناشناس"}
                            </span>
                            {reviewTab === "expert" && (
                              <span className="text-[10px] bg-[var(--dk-primary)]/10 text-[var(--dk-primary)] px-2 py-0.5 rounded-full">
                                کارشناس
                              </span>
                            )}
                            {review.isVerified && (
                              <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  className="w-2.5 h-2.5"
                                />{" "}
                                خریدار تأیید شده
                              </span>
                            )}
                          </div>
                          <span className="text-[var(--dk-gold)] text-xs inline-flex gap-0.5">
                            {Array.from({ length: review.rating }).map(
                              (_, i) => (
                                <FontAwesomeIcon
                                  key={i}
                                  icon={faStar}
                                  className="w-3 h-3"
                                />
                              ),
                            )}
                            {Array.from({ length: 5 - review.rating }).map(
                              (_, i) => (
                                <FontAwesomeIcon
                                  key={i}
                                  icon={faStar}
                                  className="w-3 h-3 text-gray-300"
                                />
                              ),
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--dk-text-light)]">
                          {toJalaliHuman(review.createdAt)}
                        </span>
                        {typeof window !== "undefined" &&
                          localStorage.getItem("web_token") && (
                            <button
                              onClick={() =>
                                handleLike(review.id, review.isLiked)
                              }
                              className="flex items-center gap-1 text-xs transition hover:scale-110"
                            >
                              <FontAwesomeIcon
                                icon={review.isLiked ? faHeart : faHeartRegular}
                                className={
                                  review.isLiked
                                    ? "text-red-500"
                                    : "text-[var(--dk-text-light)]"
                                }
                              />
                              <span className="text-[var(--dk-text-light)]">
                                {review.likes || 0}
                              </span>
                            </button>
                          )}
                      </div>
                    </div>
                    {review.title && (
                      <p className="text-sm font-bold mb-1 mr-12">
                        {review.title}
                      </p>
                    )}
                    <p className="text-sm text-[var(--dk-text-light)] mr-12">
                      {review.comment}
                    </p>
                    {(pros.length > 0 || cons.length > 0) && (
                      <div className="grid grid-cols-2 gap-4 mt-3 mr-12">
                        {pros.length > 0 && (
                          <div>
                            <p className="text-xs text-green-600 font-medium mb-1">
                              نقاط قوت
                            </p>
                            <ul className="space-y-0.5">
                              {pros.map((p: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-xs text-[var(--dk-text-light)] flex items-center gap-1"
                                >
                                  <FontAwesomeIcon
                                    icon={faCheck}
                                    className="w-2.5 h-2.5 text-green-500"
                                  />{" "}
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {cons.length > 0 && (
                          <div>
                            <p className="text-xs text-red-600 font-medium mb-1">
                              نقاط ضعف
                            </p>
                            <ul className="space-y-0.5">
                              {cons.map((c: string, i: number) => (
                                <li
                                  key={i}
                                  className="text-xs text-[var(--dk-text-light)] flex items-center gap-1"
                                >
                                  <FontAwesomeIcon
                                    icon={faXmark}
                                    className="w-2.5 h-2.5 text-red-500"
                                  />{" "}
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {media.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3 mr-12 pb-1">
                        {media.map((m: any, i: number) =>
                          m.type === "video" ? (
                            <video
                              key={i}
                              src={mediaUrl(m.url)}
                              controls
                              className="w-24 h-24 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <img
                              key={i}
                              src={mediaUrl(m.url)}
                              alt=""
                              loading="lazy"
                              srcSet={srcsetFromUrl(m.url)}
                              sizes="96px"
                              className="w-24 h-24 rounded-lg object-cover shrink-0"
                            />
                          ),
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {reviews.length === 0 && (
                <div className="text-center py-12 text-[var(--dk-text-light)]">
                  <FontAwesomeIcon icon={faComment} className="text-4xl mb-3" />
                  <p>
                    هنوز نظری ثبت نشده است. اولین نفری باشید که نظر می‌دهید!
                  </p>
                </div>
              )}
            </div>
          )}

          {reviewTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: reviewTotalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setReviewPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                    reviewPage === i + 1
                      ? "bg-[var(--dk-primary)] text-white"
                      : "bg-[var(--dk-bg)] text-[var(--dk-text-light)] hover:bg-[var(--dk-border)]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {reviewTab === "customer" &&
            typeof window !== "undefined" &&
            localStorage.getItem("web_token") && (
              <div className="dk-card p-5 mt-6 border border-[var(--dk-border)]">
                <h4 className="text-sm font-medium mb-3">ثبت نظر جدید</h4>
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--dk-text-light)]">
                      امتیاز شما:
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() =>
                            setReviewForm({ ...reviewForm, rating: r })
                          }
                          className={`transition hover:scale-110 ${r <= reviewForm.rating ? "text-[var(--dk-gold)]" : "text-[var(--dk-border)]"}`}
                        >
                          <FontAwesomeIcon icon={faStar} className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-[var(--dk-text-light)]">
                      {
                        ["", "خیلی بد", "بد", "معمولی", "خوب", "عالی"][
                          reviewForm.rating
                        ]
                      }
                    </span>
                  </div>
                  <input
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, title: e.target.value })
                    }
                    placeholder="عنوان نظر (اختیاری)"
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)] transition"
                  />
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    placeholder="نظر خود را بنویسید... (حداقل ۱۰ کاراکتر)"
                    required
                    minLength={10}
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)] transition"
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <textarea
                      value={reviewForm.pros}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, pros: e.target.value })
                      }
                      placeholder="نقاط قوت (هر خط یک مورد)"
                      className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 transition"
                      rows={2}
                    />
                    <textarea
                      value={reviewForm.cons}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, cons: e.target.value })
                      }
                      placeholder="نقاط ضعف (هر خط یک مورد)"
                      className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 transition"
                      rows={2}
                    />
                  </div>
                  <button type="submit" className="dk-btn-primary text-sm">
                    ثبت نظر
                  </button>
                  {reviewFormSuccess && (
                    <p className="text-green-600 text-sm">
                      {reviewFormSuccess}
                    </p>
                  )}
                  {reviewFormError && (
                    <p className="text-red-600 text-sm">{reviewFormError}</p>
                  )}
                </form>
              </div>
            )}
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-10 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">محصولات مرتبط</h3>
              <Link
                href={`/category/${product.category?.id}`}
                className="text-sm"
                style={{ color: "var(--dk-primary)" }}
              >
                مشاهده همه
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wishlisted={isWishlisted(p.id)}
                  onToggleWishlist={() => toggle(p.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[var(--dk-border)] py-8 mt-4">
        <div className="dk-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-sm mb-3">اطلس شاپ</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    درباره ما
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    تماس با ما
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    فرصت‌های شغلی
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">خدمات مشتریان</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    راهنمای خرید
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    شرایط بازگشت
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    پرسش‌های متداول
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">راهنمایی</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    نحوه ثبت سفارش
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    روش‌های پرداخت
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    روش‌های ارسال
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">با ما همراه شوید</h4>
              <div className="flex gap-3">
                {[faMobile, faComment, faTv, faX].map((icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-full bg-[var(--dk-bg)] flex items-center justify-center text-lg hover:bg-[var(--dk-primary)] hover:text-white transition"
                  >
                    <FontAwesomeIcon icon={icon} className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--dk-border)] pt-6 text-center text-xs text-[var(--dk-text-light)]">
            <p>
              استفاده از مطالب فروشگاه اینترنتی اطلس شاپ فقط برای مقاصد غیرتجاری
              و با ذکر منبع بلامانع است.
            </p>
            <p className="mt-2">
              کلیه حقوق این سایت متعلق به اطلس شاپ می‌باشد.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
