'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  _count: { products: number; children: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', parentId: '', sortOrder: '0' });

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>('/categories');
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', {
        name: form.name,
        slug: form.slug || form.name.replace(/\s+/g, '-').toLowerCase(),
        parentId: form.parentId ? parseInt(form.parentId) : undefined,
        sortOrder: parseInt(form.sortOrder) || 0,
      });
      setShowForm(false);
      setForm({ name: '', slug: '', parentId: '', sortOrder: '0' });
      fetchCategories();
    } catch (err) {
      alert(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">دسته‌بندی‌ها</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          {showForm ? 'انصراف' : 'دسته جدید'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm">
          <input
            type="text"
            placeholder="نام دسته"
            required
            className="rounded-lg border px-3 py-2 text-sm flex-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="slug"
            className="rounded-lg border px-3 py-2 text-sm flex-1"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          >
            <option value="">دسته والد</option>
            {categories.filter((c) => !c.parentId).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          >
            ایجاد
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">در حال بارگذاری...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-right">
              <tr>
                <th className="px-4 py-3 font-medium">شناسه</th>
                <th className="px-4 py-3 font-medium">نام</th>
                <th className="px-4 py-3 font-medium">slug</th>
                <th className="px-4 py-3 font-medium">محصولات</th>
                <th className="px-4 py-3 font-medium">زیردسته</th>
                <th className="px-4 py-3 font-medium">ترتیب</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{cat.id}</td>
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                  <td className="px-4 py-3">{cat._count.products}</td>
                  <td className="px-4 py-3">{cat._count.children}</td>
                  <td className="px-4 py-3">{cat.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(cat.id)}
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
