"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import dynamic from "next/dynamic";

const PageSectionRenderer = dynamic(
  () => import("@/components/page-sections/PageSectionRenderer"),
  { ssr: false },
);
const StoriesBar = dynamic(() => import("@/components/stories/StoriesBar"), {
  ssr: false,
});
const PopupManager = dynamic(() => import("@/components/popups/PopupManager"), {
  ssr: false,
});
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMobile,
  faShirt,
  faLaptop,
  faHome,
  faBook,
  faGamepad,
  faFutbol,
  faStethoscope,
  faBolt,
  faComment,
  faTv,
  faX,
} from "@fortawesome/free-solid-svg-icons";

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
  category?: { id: number; name: string };
}
interface Category {
  id: number;
  name: string;
  slug: string;
}
interface Slide {
  id?: number;
  title: string;
  description: string;
  bgColor: string;
  image?: string;
  link?: string;
  isActive?: boolean;
}
interface Section {
  type: string;
  title: string;
  sort: string;
  count: number;
  categoryId?: number;
}

export default function HomePage() {
  const { isWishlisted, toggle } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [amazing, setAmazing] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideIdx, setSlideIdx] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionProducts, setSectionProducts] = useState<
    Record<number, Product[]>
  >({});
  const [pageSections, setPageSections] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIdx((prev) => {
        if (slides.length === 0) return 0;
        return (prev + 1) % slides.length;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Product[] }>("/products?sort=newest&take=12"),
      api.get<{ data: Product[] }>("/products?sort=newest&take=8"),
      api.get<{ id: number; name: string; slug: string }[]>("/categories"),
      api.get<Slide[]>("/slides/active"),
      api.get<{ sections: Section[] }>("/settings/public"),
      api.get<any[]>("/page-sections").catch(() => []),
    ])
      .then(([prodRes, amaRes, cats, slidesData, settings, pSections]) => {
        setProducts(prodRes.data);
        setAmazing(amaRes.data);
        setCategories(cats);
        setSlides(slidesData || []);
        setSections(settings.sections || []);
        setPageSections(Array.isArray(pSections) ? pSections : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (sections.length === 0) return;
    Promise.all(
      sections.map((sec, i) => {
        let url = `/products?sort=${sec.sort}&take=${sec.count}`;
        if (sec.type === "category" && sec.categoryId)
          url += `&categoryId=${sec.categoryId}`;
        return api
          .get<{ data: Product[] }>(url)
          .then((res) => ({ i, products: res.data }));
      }),
    ).then((results) => {
      const map: Record<number, Product[]> = {};
      results.forEach((r) => (map[r.i] = r.products));
      setSectionProducts(map);
    });
  }, [sections]);

  const catIcons = [
    faMobile,
    faShirt,
    faLaptop,
    faHome,
    faBook,
    faGamepad,
    faFutbol,
    faStethoscope,
  ];

  return (
    <>
      <Header />

      {/* Hero Banner */}
      {slides.length > 0 && (
        <section className="dk-container pt-4">
          <div className="relative rounded-2xl overflow-hidden h-[200px] md:h-[340px]">
            {slides.map((slide, i) => (
              <Link
                key={i}
                href={slide.link || "/products"}
                className={`absolute inset-0 bg-gradient-to-br ${slide.bgColor} flex items-center px-6 md:px-12 transition-opacity duration-500 ${i === slideIdx ? "opacity-100" : "opacity-0"}`}
              >
                {slide.image && (
                  <img
                    src={mediaUrl(slide.image)}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="relative z-10 text-white max-w-xl">
                  <h2 className="text-lg md:text-3xl font-bold mb-1 md:mb-3">
                    {slide.title}
                  </h2>
                  <p className="text-xs md:text-base text-white/80 mb-3 md:mb-6">
                    {slide.description}
                  </p>
                  <span className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-4 md:px-6 py-1.5 md:py-2.5 text-xs md:text-sm font-medium hover:bg-white/30 transition">
                    مشاهده محصولات
                  </span>
                </div>
              </Link>
            ))}
            {/* Dots */}
            <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    setSlideIdx(i);
                  }}
                  className={`w-2 md:w-2.5 h-2 md:h-2.5 rounded-full transition-all ${i === slideIdx ? "bg-white w-6 md:w-8" : "bg-white/50"}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Icons */}
      {categories.length > 0 && (
        <section className="dk-container py-6">
          <div className="dk-card p-4">
            <div className="flex gap-6 overflow-x-auto scrollbar-hide justify-between">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  className="flex flex-col items-center gap-2 shrink-0 group"
                >
                  <div className="w-14 h-14 rounded-full bg-[var(--dk-bg)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    <FontAwesomeIcon
                      icon={catIcons[i % catIcons.length]}
                      className="w-6 h-6"
                    />
                  </div>
                  <span className="text-[11px] text-[var(--dk-text-light)] group-hover:text-[var(--dk-primary)] whitespace-nowrap">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stories */}
      <StoriesBar />

      {/* Amazing Offers */}
      {amazing.length > 0 && (
        <section className="dk-container pb-6">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #e53e3e 0%, #c53030 100%)",
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faBolt} className="text-2xl" />
                  <h3 className="text-lg font-bold text-white">شگفت‌انگیز</h3>
                </div>
                <Link
                  href="/products"
                  className="text-xs text-white/70 hover:text-white"
                >
                  مشاهده همه
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {amazing.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="shrink-0 w-44 bg-white/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/20 transition group"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-white/20 mb-2">
                      <img
                        src={mediaUrl(p.images?.[0])}
                        alt={p.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="text-xs text-white/90 line-clamp-2 min-h-[2rem]">
                      {p.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-white">
                        {(p.salePrice || p.price).toLocaleString()}
                      </span>
                      {p.salePrice && p.salePrice < p.price && (
                        <span className="bg-white text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          %
                          {Math.round(
                            ((p.price - p.salePrice) / p.price) * 100,
                          )}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Sections */}
      {sections.map((sec, i) => (
        <section key={i} className="dk-container pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[var(--dk-text)]">
              {sec.title || "جدیدترین محصولات"}
            </h3>
            <Link
              href="/products"
              className="text-sm"
              style={{ color: "var(--dk-primary)" }}
            >
              مشاهده همه
            </Link>
          </div>

          {!sectionProducts[i] ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="dk-card p-3 animate-pulse">
                  <div className="aspect-square rounded-lg bg-[var(--dk-bg)] mb-3" />
                  <div className="h-3 bg-[var(--dk-bg)] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[var(--dk-bg)] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sectionProducts[i].map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  wishlisted={isWishlisted(product.id)}
                  onToggleWishlist={() => toggle(product.id)}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Page Builder Sections */}
      <PageSectionRenderer sections={pageSections} />

      {/* Popup Manager */}
      <PopupManager />

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
