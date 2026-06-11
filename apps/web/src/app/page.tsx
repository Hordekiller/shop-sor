'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
  category: { id: number; name: string };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Product[] }>('/products?sort=newest&take=12'),
      api.get<{ id: number; name: string }[]>('/categories'),
    ])
      .then(([prodRes, cats]) => {
        setProducts(prodRes.data);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h2 className="text-4xl font-bold mb-4">به اطلس شاپ خوش آمدید</h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            فروشگاه اینترنتی چند فروشندگی با تنوع بی‌نظیر محصولات
          </p>
          <a
            href="/products"
            className="inline-block rounded-lg bg-white px-8 py-3 text-indigo-700 font-medium hover:bg-indigo-50"
          >
            مشاهده محصولات
          </a>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`/category/${cat.id}`}
                className="shrink-0 rounded-full bg-white px-5 py-2 text-sm shadow-sm border hover:border-indigo-300 hover:text-indigo-600"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">جدیدترین محصولات</h3>
          <a href="/products" className="text-sm text-indigo-600 hover:underline">مشاهده همه</a>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map((n) => (
              <div key={n} className="rounded-xl bg-white p-4 shadow-sm animate-pulse">
                <div className="aspect-square rounded-lg bg-gray-200 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <p className="text-center text-gray-500 py-12">هیچ محصولی یافت نشد.</p>
        )}
      </section>

      <footer className="bg-white border-t py-8 text-center text-sm text-gray-500">
        <p>تمام حقوق مادی و معنوی این فروشگاه متعلق به اطلس شاپ می‌باشد.</p>
      </footer>
    </>
  );
}
