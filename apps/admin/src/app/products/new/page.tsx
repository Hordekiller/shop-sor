'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    salePrice: '',
    stock: '0',
    categoryId: '',
    sku: '',
  });

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(console.error);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/products', {
        title: form.title,
        slug: form.slug || form.title.replace(/\s+/g, '-').toLowerCase(),
        description: form.description,
        price: parseFloat(form.price) || 0,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        stock: parseInt(form.stock) || 0,
        categoryId: parseInt(form.categoryId),
        sku: form.sku || undefined,
      });
      router.push('/products');
    } catch (err) {
      alert(err);
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">محصول جدید</h2>
        <p className="text-sm text-gray-500 mt-1">اطلاعات محصول جدید را وارد کنید</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">عنوان محصول</label>
          <input
            type="text"
            required
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">نامک (slug)</label>
          <input
            type="text"
            className="w-full rounded-lg border px-3 py-2 text-sm text-gray-500"
            placeholder="خالی بگذارید تا自動 تولید شود"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">توضیحات</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">قیمت (ریال)</label>
            <input
              type="number"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">قیمت تخفیف‌خورده</label>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">موجودی</label>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1"> SKU</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">دسته‌بندی</label>
          <select
            required
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">انتخاب کنید</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره محصول'}
          </button>
          <a
            href="/products"
            className="rounded-lg border px-6 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            انصراف
          </a>
        </div>
      </form>
    </div>
  );
}
