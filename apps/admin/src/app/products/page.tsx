'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Product {
  id: number;
  title: string;
  price: number;
  salePrice: number | null;
  stock: number;
  isActive: boolean;
  category: { id: number; name: string };
  _count: { reviews: number };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Product[] }>('/products?sort=newest')
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">محصولات</h2>
        <a
          href="/products/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          محصول جدید
        </a>
      </div>

      {loading ? (
        <p className="text-gray-500">در حال بارگذاری...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">هیچ محصولی یافت نشد.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-right">
              <tr>
                <th className="px-4 py-3 font-medium">شناسه</th>
                <th className="px-4 py-3 font-medium">عنوان</th>
                <th className="px-4 py-3 font-medium">دسته‌بندی</th>
                <th className="px-4 py-3 font-medium">قیمت</th>
                <th className="px-4 py-3 font-medium">موجودی</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{product.id}</td>
                  <td className="px-4 py-3 font-medium">{product.title}</td>
                  <td className="px-4 py-3 text-gray-500">{product.category?.name}</td>
                  <td className="px-4 py-3">
                    {product.salePrice ? (
                      <>
                        <span className="text-red-500">{product.salePrice.toLocaleString()}</span>
                        <span className="mr-1 text-xs text-gray-400 line-through">
                          {product.price.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span>{product.price.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {product.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
