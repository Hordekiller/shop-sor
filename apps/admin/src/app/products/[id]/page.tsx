'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
    isActive: true,
  });
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<Category[]>('/categories'),
      api.get<any>(`/products/${id}`),
    ]).then(([cats, product]) => {
      setCategories(cats);
      setForm({
        title: product.title || '',
        slug: product.slug || '',
        description: product.description || '',
        price: String(product.price || ''),
        salePrice: product.salePrice ? String(product.salePrice) : '',
        stock: String(product.stock || '0'),
        categoryId: String(product.categoryId || ''),
        sku: product.sku || '',
        isActive: product.isActive ?? true,
      });
      if (product.images) setImages(Array.isArray(product.images) ? product.images : []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('atlas_token')}` },
        body: fd,
      });
      const data = await res.json();
      if (data.url) setImages((prev) => [...prev, data.url]);
    } catch { alert('Upload failed'); }
    setUploading(false);
  };

  const removeImage = (url: string) => setImages((prev) => prev.filter((i) => i !== url));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/products/${id}`, {
        title: form.title,
        slug: form.slug || form.title.replace(/\s+/g, '-').toLowerCase(),
        description: form.description,
        price: parseFloat(form.price) || 0,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        stock: parseInt(form.stock) || 0,
        categoryId: parseInt(form.categoryId),
        sku: form.sku || null,
        isActive: form.isActive,
        images,
      });
      router.push('/products');
    } catch (err) {
      alert(err);
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">در حال بارگذاری...</p>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">ویرایش محصول</h2>
        <p className="text-sm text-gray-500 mt-1">شناسه: {id}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">عنوان محصول</label>
          <input type="text" required className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">نامک (slug)</label>
          <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm text-gray-500"
            value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">توضیحات</label>
          <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={4}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">قیمت (ریال)</label>
            <input type="number" required className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">قیمت تخفیف‌خورده</label>
            <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">موجودی</label>
            <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">تصاویر محصول</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((url) => (
              <div key={url} className="relative group">
                <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg border" />
                <button type="button" onClick={() => removeImage(url)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
              </div>
            ))}
            {uploading && <div className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center text-gray-400 text-sm">در حال آپلود...</div>}
          </div>
          <label className="cursor-pointer inline-block rounded-lg border border-dashed px-4 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600">
            انتخاب تصویر
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">دسته‌بندی</label>
            <select required className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">انتخاب کنید</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">وضعیت</label>
            <select className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.isActive ? 'active' : 'inactive'}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
          <a href="/products" className="rounded-lg border px-6 py-2 text-sm text-gray-600 hover:bg-gray-50">
            انصراف
          </a>
        </div>
      </form>
    </div>
  );
}
