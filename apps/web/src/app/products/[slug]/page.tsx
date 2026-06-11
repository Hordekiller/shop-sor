'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { toJalaliHuman } from '@/lib/date';
import Link from 'next/link';

interface Product {
  id: number; title: string; slug: string; description: string;
  price: number; salePrice: number | null; stock: number;
  images: string[]; category: { id: number; name: string };
  shop: { id: number; name: string };
  reviews: { id: number; rating: number; comment: string; user: { id: number; name: string }; createdAt: string }[];
  createdAt: string;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    setLoading(true);
    api.get<Product>(`/products/${slug}`)
      .then((p) => {
        setProduct(p);
        setActiveImg(0);
        return api.get<{ data: Product[] }>(`/products?categoryId=${p.category?.id}&sort=newest&take=6`);
      })
      .then((res) => setRelated(res.data.filter((r) => r.slug !== slug)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      title: product.title,
      price: product.salePrice || product.price,
      image: product.images?.[0] || null,
      quantity,
      stock: product.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    try {
      const newReview = await api.post<any>(`/products/${product.id}/reviews`, {
        rating: reviewForm.rating, comment: reviewForm.comment,
      });
      setProduct({ ...product, reviews: [...product.reviews, newReview] });
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) { alert(err); }
  };

  const avgRating = product && product.reviews?.length
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : '۰';

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
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">محصول مورد نظر یافت نشد</h2>
          <p className="text-sm text-[var(--dk-text-light)] mb-6">لینک درخواستی可能存在 باگ یا حذف شده است</p>
          <Link href="/products" className="dk-btn-primary">مشاهده محصولات</Link>
        </div>
      </>
    );
  }

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const images = product.images?.length > 0
    ? product.images.map((i) => `http://localhost:8000${i}`)
    : ['https://placehold.co/600x600/e2e8f0/94a3b8?text=No+Image'];

  return (
    <>
      <Header />

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 left-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20">&times;</button>
          <img src={images[activeImg]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                className={`w-3 h-3 rounded-full ${i === activeImg ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </div>
      )}

      <div className="dk-container py-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-[var(--dk-text-light)] mb-5 flex items-center flex-wrap gap-1">
          <Link href="/" className="hover:text-[var(--dk-primary)] transition">خانه</Link>
          <span className="mx-1">/</span>
          <Link href="/products" className="hover:text-[var(--dk-primary)] transition">محصولات</Link>
          <span className="mx-1">/</span>
          <Link href={`/category/${product.category?.id}`} className="hover:text-[var(--dk-primary)] transition">{product.category?.name}</Link>
          <span className="mx-1">/</span>
          <span className="text-[var(--dk-text)] truncate max-w-[200px]">{product.title}</span>
        </nav>

        {/* Main Section */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Gallery */}
          <div className="md:col-span-5">
            <div className="dk-card p-3">
              <div className="aspect-square rounded-xl overflow-hidden bg-[var(--dk-bg)] mb-3 cursor-zoom-in relative group"
                onClick={() => images.length > 0 && setLightbox(true)}>
                <img src={images[activeImg] || images[0]} alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                {hasDiscount && (
                  <span className="absolute top-3 right-3 dk-badge-amazing text-xs">%{discountPercent}</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition flex items-center justify-center">
                  <span className="text-white/0 group-hover:text-white/70 text-3xl transition">🔍</span>
                </div>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                        i === activeImg ? 'border-[var(--dk-primary)] shadow-sm' : 'border-transparent hover:border-[var(--dk-border)]'
                      }`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
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
                <h1 className="text-lg font-bold leading-7 flex-1">{product.title}</h1>
                {product.shop && (
                  <span className="text-[10px] text-[var(--dk-text-light)] shrink-0 bg-[var(--dk-bg)] px-2 py-1 rounded-full">
                    {product.shop.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-[var(--dk-gold)]">{'★'.repeat(Math.round(Number(avgRating)))}</span>
                  <span className="text-[var(--dk-gold)] font-bold">{avgRating}</span>
                </div>
                <span className="text-[var(--dk-text-light)]">({product.reviews?.length || 0} نظر)</span>
                <span className="w-px h-4 bg-[var(--dk-border)]" />
                <span className="text-green-600 text-xs">
                  {product.stock > 0 ? `موجود (${product.stock} عدد)` : 'ناموجود'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--dk-text-light)] border-t border-[var(--dk-border)] pt-3">
                <span>دسته: <Link href={`/category/${product.category?.id}`} className="text-[var(--dk-primary)] hover:underline">{product.category?.name}</Link></span>
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
                  <p className="text-sm text-[var(--dk-text-light)] italic">توضیحاتی ثبت نشده است</p>
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
                      <span className="text-3xl font-bold text-[var(--dk-primary)]">{product.salePrice!.toLocaleString()}</span>
                      <span className="text-xs text-[var(--dk-text-light)]">تومان</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="dk-price-old text-sm">{product.price.toLocaleString()} تومان</span>
                      <span className="dk-badge-amazing text-xs">%{discountPercent}</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">شما {(product.price - product.salePrice!).toLocaleString()} تومان صرفه‌جویی می‌کنید</p>
                  </>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{product.price.toLocaleString()}</span>
                    <span className="text-xs text-[var(--dk-text-light)]">تومان</span>
                  </div>
                )}
              </div>

              {/* Stock status bar */}
              <div className={`h-2 rounded-full overflow-hidden bg-[var(--dk-bg)] ${product.stock > 0 ? '' : 'opacity-30'}`}>
                <div className={`h-full rounded-full transition-all ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={product.stock > 0 ? 'text-green-600' : 'text-red-500'}>
                  {product.stock > 0
                    ? product.stock > 10 ? 'موجودی کافی' : 'موجودی محدود'
                    : 'ناموجود'}
                </span>
                {product.stock > 0 && (
                  <span className="text-[var(--dk-text-light)]">{product.stock} عدد در انبار</span>
                )}
              </div>

              {/* Quantity + Add to cart */}
              {product.stock > 0 && (
                <>
                  <div className="flex items-center justify-between rounded-xl bg-[var(--dk-bg)] p-1 border border-[var(--dk-border)]">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg font-medium hover:shadow-sm transition disabled:opacity-50"
                      disabled={quantity <= 1}>
                      −
                    </button>
                    <span className="font-bold text-sm min-w-[3ch] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg font-medium hover:shadow-sm transition disabled:opacity-50"
                      disabled={quantity >= product.stock}>
                      +
                    </button>
                  </div>

                  <button onClick={handleAddToCart}
                    className={`w-full rounded-xl py-3.5 font-medium text-sm transition-all active:scale-95 ${
                      added ? 'bg-green-500 text-white' : 'text-white hover:brightness-110'
                    }`}
                    style={added ? {} : { background: 'var(--dk-primary)' }}>
                    {added ? (
                      <span className="flex items-center justify-center gap-2">✓ به سبد خرید اضافه شد</span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">افزودن به سبد خرید</span>
                    )}
                  </button>
                </>
              )}

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
            <h3 className="text-lg font-bold">نظرات کاربران</h3>
            <span className="bg-[var(--dk-primary)] text-white text-xs px-2.5 py-0.5 rounded-full">{product.reviews?.length || 0}</span>
          </div>

          {/* Review stats */}
          {product.reviews?.length > 0 && (
            <div className="dk-card p-5 mb-6 flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-[var(--dk-gold)]">{avgRating}</div>
                <div className="text-[var(--dk-gold)] text-sm mt-1">{'★'.repeat(5)}</div>
                <div className="text-xs text-[var(--dk-text-light)] mt-1">از {product.reviews.length} نظر</div>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map((star) => {
                  const count = product.reviews.filter((r) => r.rating === star).length;
                  const pct = (count / product.reviews.length) * 100;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-8 text-left">{star} ★</span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--dk-bg)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--dk-gold)]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-[var(--dk-text-light)]">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review form */}
          <div className="dk-card p-5 mb-6 border border-[var(--dk-border)]">
            <h4 className="text-sm font-medium mb-3">ثبت نظر جدید</h4>
            <form onSubmit={handleReview} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--dk-text-light)]">امتیاز شما:</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((r) => (
                    <button key={r} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: r })}
                      className={`text-xl transition hover:scale-110 ${
                        r <= reviewForm.rating ? 'text-[var(--dk-gold)]' : 'text-[var(--dk-border)]'
                      }`}>
                      ★
                    </button>
                  ))}
                </div>
                <span className="text-xs text-[var(--dk-text-light)]">
                  {['', 'خیلی بد', 'بد', 'معمولی', 'خوب', 'عالی'][reviewForm.rating]}
                </span>
              </div>
              <textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="نظر خود را بنویسید... (حداقل ۱۰ کاراکتر)"
                required minLength={10}
                className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)] transition"
                rows={3} />
              <button type="submit" className="dk-btn-primary text-sm">ثبت نظر</button>
            </form>
          </div>

          {/* Review list */}
          <div className="space-y-3">
            {product.reviews?.map((review) => (
              <div key={review.id} className="dk-card p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--dk-primary)] to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                      {(review.user?.name || 'ن')[0]}
                    </div>
                    <div>
                      <span className="text-sm font-medium block">{review.user?.name || 'کاربر ناشناس'}</span>
                      <span className="text-[var(--dk-gold)] text-xs">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--dk-text-light)]">{toJalaliHuman(review.createdAt)}</span>
                </div>
                <p className="text-sm text-[var(--dk-text-light)] mr-12">{review.comment}</p>
              </div>
            ))}
            {(!product.reviews || product.reviews.length === 0) && (
              <div className="text-center py-12 text-[var(--dk-text-light)]">
                <div className="text-4xl mb-3">💬</div>
                <p>هنوز نظری ثبت نشده است. اولین نفری باشید که نظر می‌دهید!</p>
              </div>
            )}
          </div>
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-10 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">محصولات مرتبط</h3>
              <Link href={`/category/${product.category?.id}`} className="text-sm" style={{ color: 'var(--dk-primary)' }}>
                مشاهده همه
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
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
                <li><a href="#" className="hover:text-[var(--dk-primary)]">درباره ما</a></li>
                <li><a href="#" className="hover:text-[var(--dk-primary)]">تماس با ما</a></li>
                <li><a href="#" className="hover:text-[var(--dk-primary)]">فرصت‌های شغلی</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">خدمات مشتریان</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li><a href="#" className="hover:text-[var(--dk-primary)]">راهنمای خرید</a></li>
                <li><a href="#" className="hover:text-[var(--dk-primary)]">شرایط بازگشت</a></li>
                <li><a href="#" className="hover:text-[var(--dk-primary)]">پرسش‌های متداول</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">راهنمایی</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li><a href="#" className="hover:text-[var(--dk-primary)]">نحوه ثبت سفارش</a></li>
                <li><a href="#" className="hover:text-[var(--dk-primary)]">روش‌های پرداخت</a></li>
                <li><a href="#" className="hover:text-[var(--dk-primary)]">روش‌های ارسال</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">با ما همراه شوید</h4>
              <div className="flex gap-3">
                {['📱', '💬', '📺', '🐦'].map((icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-[var(--dk-bg)] flex items-center justify-center text-lg hover:bg-[var(--dk-primary)] hover:text-white transition">
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--dk-border)] pt-6 text-center text-xs text-[var(--dk-text-light)]">
            <p>استفاده از مطالب فروشگاه اینترنتی اطلس شاپ فقط برای مقاصد غیرتجاری و با ذکر منبع بلامانع است.</p>
            <p className="mt-2">کلیه حقوق این سایت متعلق به اطلس شاپ می‌باشد.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
