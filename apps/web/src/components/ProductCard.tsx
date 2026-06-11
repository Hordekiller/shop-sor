"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import {
  faStar,
  faStarHalfStroke,
  faScaleBalanced,
  faShoppingCart,
} from "@fortawesome/free-solid-svg-icons";
import { useCompare } from "@/context/CompareContext";
import { useCart } from "@/context/CartContext";
import { mediaUrl } from "@/lib/media";

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
  category?: { id: number; name: string };
  averageRating?: number;
  numReviews?: number;
}

export default function ProductCard({
  product,
  wishlisted,
  onToggleWishlist,
}: {
  product: Product;
  wishlisted?: boolean;
  onToggleWishlist?: () => void;
}) {
  const { has, toggle: toggleCompare } = useCompare();
  const { addItem } = useCart();
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const imgSrc = mediaUrl(product.images?.[0]);

  const rating = product.averageRating || 0;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const inCompare = has(product.id);

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="dk-card overflow-hidden">
          <div className="relative aspect-square bg-[var(--dk-bg)] overflow-hidden">
            <img
              src={imgSrc}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {hasDiscount && (
              <span className="absolute top-2 right-2 dk-badge-amazing">
                %{discountPercent}
              </span>
            )}
          </div>

          <div className="p-3 space-y-2">
            <h3 className="text-xs leading-5 line-clamp-2 text-[var(--dk-text)] group-hover:text-[var(--dk-primary)] transition-colors min-h-[2.5rem]">
              {product.title}
            </h3>

            <div className="flex items-center gap-1 text-[11px]">
              <span className="flex text-[var(--dk-gold)]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <FontAwesomeIcon
                    key={i}
                    icon={
                      i <= fullStars
                        ? faStar
                        : i === fullStars + 1 && hasHalf
                          ? faStarHalfStroke
                          : faStar
                    }
                    className={
                      i <= fullStars || (i === fullStars + 1 && hasHalf)
                        ? ""
                        : "opacity-25"
                    }
                  />
                ))}
              </span>
              <span className="mr-1 text-[var(--dk-gold)] font-medium">
                {rating > 0 ? rating.toFixed(1) : ""}
              </span>
              {product.numReviews !== undefined && product.numReviews > 0 && (
                <span className="text-[var(--dk-text-light)]">
                  ({product.numReviews})
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              {hasDiscount ? (
                <>
                  <span className="dk-price text-sm">
                    {product.salePrice!.toLocaleString()}
                  </span>
                  <span className="dk-price-old">
                    {product.price.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="dk-price text-sm">
                  {product.price.toLocaleString()}
                </span>
              )}
              <span className="text-[10px] text-[var(--dk-text-light)]">
                تومان
              </span>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addItem({
                  productId: product.id,
                  title: product.title,
                  price: product.salePrice ?? product.price,
                  image: imgSrc,
                  quantity: 1,
                  stock: 99,
                  slug: product.slug,
                });
              }}
              className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] bg-[var(--dk-primary)] text-white border border-[var(--dk-primary)] hover:brightness-110 transition"
            >
              <FontAwesomeIcon icon={faShoppingCart} className="w-3 h-3" />
              افزودن به سبد خرید
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCompare(product.id);
              }}
              className={`w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] border transition ${
                inCompare
                  ? "bg-[var(--dk-primary)]/5 border-[var(--dk-primary)] text-[var(--dk-primary)]"
                  : "border-[var(--dk-border)] text-[var(--dk-text-light)] hover:border-[var(--dk-primary)] hover:text-[var(--dk-primary)]"
              }`}
            >
              <FontAwesomeIcon icon={faScaleBalanced} className="w-3 h-3" />
              {inCompare ? "حذف از مقایسه" : "مقایسه"}
            </button>
          </div>
        </div>
      </Link>
      {onToggleWishlist && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleWishlist();
          }}
          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition z-10"
        >
          <FontAwesomeIcon
            icon={wishlisted ? faHeartSolid : faHeartRegular}
            className={wishlisted ? "text-red-500" : "text-gray-400"}
          />
        </button>
      )}
    </div>
  );
}
