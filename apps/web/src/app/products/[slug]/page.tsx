'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import { toJalaliHuman } from '@/lib/date';

interface Review {
  id: number;
  rating: number;
  comment: string;
  user: { id: number; name: string };
  createdAt: string;
}

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
  reviews: Review[];
  createdAt: string;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    api.get<Product>(`/products/${slug}`)
      .then(setProduct)
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
      const newReview = await api.post<Review>(`/products/${product.id}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      setProduct({ ...product, reviews: [...product.reviews, newReview] });
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      alert(err);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="animate-pulse grid md:grid-cols-2 gap-8">
            <div className="aspect-square rounded-xl bg-gray-200" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-12 bg-gray-200 rounded" />
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
        <div className="mx-auto max-w-7xl px-4 py-12 text-center text-gray-500">محصول یافت نشد.</div>
      </>
    );
  }

  const mainImg = product.images?.[0]
    ? `http://localhost:8000${product.images[0]}`
    : 'https://placehold.co/600x600/e2e8f0/64748b?text=No+Image';

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="text-sm text-gray-500 mb-6">
          <a href="/" className="hover:text-indigo-600">خانه</a>
          <span className="mx-2">/</span>
          <a href="/products" className="hover:text-indigo-600">محصولات</a>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{product.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={mainImg} alt={product.title} className="w-full h-full object-cover" />
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
            <p className="text-sm text-gray-500 mb-4">
              فروشنده: {product.shop?.name} | دسته: {product.category?.name}
            </p>

            <div className="flex items-baseline gap-2 mb-4">
              {product.salePrice ? (
                <>
                  <span className="text-3xl font-bold text-red-500">{product.salePrice.toLocaleString()}</span>
                  <span className="text-lg text-gray-400 line-through">{product.price.toLocaleString()}</span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-800">{product.price.toLocaleString()}</span>
              )}
              <span className="text-sm text-gray-400">ریال</span>
            </div>

            <div className="mb-4">
              <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `موجودی: ${product.stock} عدد` : 'ناموجود'}
              </span>
            </div>

            {product.stock > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`flex-1 rounded-lg py-3 font-medium text-white ${
                    added ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {added ? '✓ اضافه شد' : 'افزودن به سبد خرید'}
                </button>
              </div>
            )}

            {product.description && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">توضیحات</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{product.description}</p>
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <p className="text-xs text-gray-400">شناسه محصول: {product.id}</p>
              <p className="text-xs text-gray-400">تاریخ انتشار: {toJalaliHuman(product.createdAt)}</p>
            </div>
          </div>
        </div>

        <section className="mt-12 border-t pt-8">
          <h3 className="text-lg font-bold mb-4">نظرات ({product.reviews?.length || 0})</h3>

          <form onSubmit={handleReview} className="bg-white rounded-xl p-4 shadow-sm border mb-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">امتیاز:</span>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                className="rounded border px-3 py-1 text-sm"
              >
                {[5,4,3,2,1].map((r) => (
                  <option key={r} value={r}>{r} ستاره</option>
                ))}
              </select>
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="نظر خود را بنویسید..."
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
            />
            <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700">
              ثبت نظر
            </button>
          </form>

          <div className="space-y-3">
            {product.reviews?.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{review.user?.name || 'کاربر'}</span>
                    <span className="text-yellow-500 text-xs">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                  </div>
                  <span className="text-xs text-gray-400">{toJalaliHuman(review.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
            {(!product.reviews || product.reviews.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">هنوز نظری ثبت نشده است.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
