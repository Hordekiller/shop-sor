"use client";

import { useEffect, useState, FormEvent } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  metaTitle: string;
  metaDesc: string;
  _count: { products: number; children: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    parentId: "",
    sortOrder: "0",
    metaTitle: "",
    metaDesc: "",
  });

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>("/categories");
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      parentId: "",
      sortOrder: "0",
      metaTitle: "",
      metaDesc: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId ? String(cat.parentId) : "",
      sortOrder: String(cat.sortOrder),
      metaTitle: cat.metaTitle || "",
      metaDesc: cat.metaDesc || "",
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.replace(/\s+/g, "-").toLowerCase(),
        parentId: form.parentId ? parseInt(form.parentId) : undefined,
        sortOrder: parseInt(form.sortOrder) || 0,
        metaTitle: form.metaTitle || undefined,
        metaDesc: form.metaDesc || undefined,
      };
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
      } else {
        await api.post("/categories", payload);
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      alert(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف این دسته‌بندی؟")) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            دسته‌بندی‌ها
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            مدیریت دسته‌بندی محصولات
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="v-btn v-btn-primary"
        >
          <Icon
            icon={showForm ? "tabler:x" : "tabler:plus"}
            className="w-4 h-4"
          />
          {showForm ? "انصراف" : "دسته جدید"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="v-card mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--v-text-secondary)" }}
              >
                نام دسته
              </label>
              <input
                type="text"
                placeholder="نام دسته"
                required
                className="v-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--v-text-secondary)" }}
              >
                slug
              </label>
              <input
                type="text"
                placeholder="slug"
                className="v-input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="min-w-[160px]">
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--v-text-secondary)" }}
              >
                دسته والد
              </label>
              <select
                className="v-select"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <option value="">بدون والد</option>
                {categories
                  .filter((c) => !c.parentId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--v-text-secondary)" }}
              >
                عنوان سئو
              </label>
              <input
                type="text"
                placeholder="عنوان سئو"
                className="v-input"
                value={form.metaTitle}
                onChange={(e) =>
                  setForm({ ...form, metaTitle: e.target.value })
                }
              />
            </div>
            <div className="min-w-[180px]">
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--v-text-secondary)" }}
              >
                توضیحات سئو
              </label>
              <input
                type="text"
                placeholder="توضیحات سئو"
                className="v-input"
                value={form.metaDesc}
                onChange={(e) => setForm({ ...form, metaDesc: e.target.value })}
              />
            </div>
            <button type="submit" className="v-btn v-btn-primary">
              <Icon
                icon={editingId ? "tabler:edit" : "tabler:plus"}
                className="w-4 h-4"
              />
              {editingId ? "ویرایش" : "ایجاد"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg animate-pulse"
              style={{ background: "var(--v-bg)" }}
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:folder-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هیچ دسته‌بندی یافت نشد.
          </p>
        </div>
      ) : (
        <div className="v-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="v-table">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>نام</th>
                  <th>slug</th>
                  <th>عنوان سئو</th>
                  <th>محصولات</th>
                  <th>زیردسته</th>
                  <th>ترتیب</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.id}</td>
                    <td className="font-medium">{cat.name}</td>
                    <td style={{ color: "var(--v-text-secondary)" }}>
                      {cat.slug}
                    </td>
                    <td style={{ color: "var(--v-text-secondary)" }}>
                      {cat.metaTitle || "—"}
                    </td>
                    <td>{cat._count.products}</td>
                    <td>{cat._count.children}</td>
                    <td>{cat.sortOrder}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="v-btn v-btn-secondary v-btn-sm"
                        >
                          <Icon icon="tabler:edit" className="w-3.5 h-3.5" />
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="v-btn v-btn-sm"
                          style={{ color: "var(--v-error)" }}
                        >
                          <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
