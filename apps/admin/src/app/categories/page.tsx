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
  const [editingId, setEditingId] = useState<number | null>(null);
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

  const resetForm = () => {
    setForm({ name: '', slug: '', parentId: '', sortOrder: '0' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId ? String(cat.parentId) : '',
      sortOrder: String(cat.sortOrder),
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.replace(/\s+/g, '-').toLowerCase(),
        parentId: form.parentId ? parseInt(form.parentId) : undefined,
        sortOrder: parseInt(form.sortOrder) || 0,
      };

      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
      } else {
        await api.post('/categories', payload);
      }

      resetForm();
      fetchCategories();
    } catch (err) {
      alert(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف این دسته‌بندی؟')) return;
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
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          {showForm ? 'انصراف' : 'دسته جدید'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">نام دسته</label>
            <input type="text" placeholder="نام دسته" required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs text-gray-500 mb-1">slug</label>
            <input type="text" placeholder="slug"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs text-gray-500 mb-1">دسته والد</label>
            <select className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">بدون والد</option>
              {categories.filter((c) => !c.parentId).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
            {editingId ? 'ویرایش' : 'ایجاد'}
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
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEdit(cat)}
                      className="text-indigo-500 hover:text-indigo-700 text-xs">ویرایش</button>
                    <button onClick={() => handleDelete(cat.id)}
                      className="text-red-500 hover:text-red-700 text-xs">حذف</button>
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
