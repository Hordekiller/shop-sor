"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  sortOrder: number;
  _count: { posts: number };
  children: BlogCategory[];
}

export default function BlogCategoriesPage() {
  const [cats, setCats] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    sortOrder: "0",
  });

  const fetchCats = async () => {
    setLoading(true);
    try {
      const data = await api.get<BlogCategory[]>("/blog/categories");
      setCats(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      description: "",
      parentId: "",
      sortOrder: "0",
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        sortOrder: Number(form.sortOrder),
      };
      if (form.parentId) payload.parentId = Number(form.parentId);

      if (editId) {
        await api.put(`/blog/admin/categories/${editId}`, payload);
      } else {
        await api.post("/blog/admin/categories", payload);
      }
      resetForm();
      fetchCats();
    } catch (err: any) {
      alert(err?.message || "خطا");
    }
  };

  const handleEdit = (cat: BlogCategory) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      parentId: String(cat.parentId || ""),
      sortOrder: String(cat.sortOrder),
    });
    setEditId(cat.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این دسته‌بندی اطمینان دارید؟")) return;
    try {
      await api.delete(`/blog/admin/categories/${id}`);
      fetchCats();
    } catch {
      alert("خطا در حذف");
    }
  };

  const renderTree = (items: BlogCategory[], depth = 0) => (
    <div style={{ marginRight: depth * 20 }}>
      {items.map((cat) => (
        <div
          key={cat.id}
          className="border rounded-lg mb-2 overflow-hidden"
          style={{ borderColor: "var(--v-border)" }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 bg-white">
            <div className="flex items-center gap-2">
              <Icon
                icon={
                  cat.children?.length ? "tabler:folder" : "tabler:folder-open"
                }
                className="w-4 h-4"
                style={{ color: "var(--v-primary)" }}
              />
              <span className="text-sm font-medium">{cat.name}</span>
              {cat.description && (
                <span
                  className="text-xs"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  — {cat.description}
                </span>
              )}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "#F3F4F6", color: "#6B7280" }}
              >
                {cat._count.posts} پست
              </span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleEdit(cat)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <Icon
                  icon="tabler:edit"
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--v-primary)" }}
                />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-1 rounded hover:bg-red-50"
              >
                <Icon
                  icon="tabler:trash"
                  className="w-3.5 h-3.5"
                  style={{ color: "#ef4444" }}
                />
              </button>
            </div>
          </div>
          {cat.children &&
            cat.children.length > 0 &&
            renderTree(cat.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  const flattenCats = (
    items: BlogCategory[],
    prefix = "",
  ): { id: number; name: string }[] => {
    let result: { id: number; name: string }[] = [];
    for (const cat of items) {
      const label = prefix ? `${prefix} > ${cat.name}` : cat.name;
      result.push({ id: cat.id, name: label });
      if (cat.children?.length) {
        result = result.concat(flattenCats(cat.children, label));
      }
    }
    return result;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
          دسته‌بندی وبلاگ
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="v-btn v-btn-primary"
        >
          <Icon icon="tabler:plus" className="w-4 h-4" />
          دسته جدید
        </button>
      </div>

      {showForm && (
        <div className="v-card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">
              {editId ? "ویرایش دسته" : "دسته جدید"}
            </h3>
            <button
              onClick={resetForm}
              className="p-1 rounded hover:bg-gray-100"
            >
              <Icon icon="tabler:x" className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">نام *</label>
              <input
                type="text"
                required
                className="v-input"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (!editId && !form.slug)
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                      slug: e.target.value
                        .replace(/\s+/g, "-")
                        .replace(/[^a-zA-Z0-9\-]/g, "")
                        .toLowerCase(),
                    }));
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسلاگ</label>
              <input
                type="text"
                className="v-input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                دسته والد
              </label>
              <select
                className="v-select"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              >
                <option value="">بدون والد</option>
                {flattenCats(cats)
                  .filter((c) => c.id !== editId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ترتیب</label>
              <input
                type="number"
                className="v-input"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">توضیحات</label>
              <textarea
                className="v-input"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>
          <button onClick={handleSave} className="v-btn v-btn-primary">
            {editId ? "ویرایش" : "ایجاد"} دسته
          </button>
        </div>
      )}

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl animate-pulse mb-2"
            style={{ background: "#e5e7eb" }}
          />
        ))
      ) : cats.length === 0 ? (
        <div className="text-center py-16">
          <Icon
            icon="tabler:folder-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هیچ دسته‌بندی وجود ندارد.
          </p>
        </div>
      ) : (
        renderTree(cats)
      )}
    </div>
  );
}
