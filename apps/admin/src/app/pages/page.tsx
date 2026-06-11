"use client";

import { useEffect, useState, FormEvent } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import TiptapEditor from "@/components/TiptapEditor";

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDesc: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    metaTitle: "",
    metaDesc: "",
    sortOrder: "0",
    isActive: true,
  });

  const fetchPages = async () => {
    try {
      const data = await api.get<Page[]>("/pages");
      setPages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      content: "",
      metaTitle: "",
      metaDesc: "",
      sortOrder: "0",
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (p: Page) => {
    setForm({
      title: p.title,
      slug: p.slug,
      content: p.content || "",
      metaTitle: p.metaTitle || "",
      metaDesc: p.metaDesc || "",
      sortOrder: String(p.sortOrder),
      isActive: p.isActive,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || form.title.replace(/\s+/g, "-").toLowerCase(),
        content: form.content,
        metaTitle: form.metaTitle || undefined,
        metaDesc: form.metaDesc || undefined,
        sortOrder: parseInt(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editingId) {
        await api.put(`/pages/${editingId}`, payload);
      } else {
        await api.post("/pages", payload);
      }
      resetForm();
      fetchPages();
    } catch (err) {
      alert(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف این صفحه؟")) return;
    try {
      await api.delete(`/pages/${id}`);
      fetchPages();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            صفحات
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            مدیریت صفحات (درباره ما، تماس با ما، قوانین و...)
          </p>
        </div>
        <button onClick={openNew} className="v-btn v-btn-primary">
          <Icon icon="tabler:plus" className="w-4 h-4" />
          صفحه جدید
        </button>
      </div>

      {showForm && (
        <div
          className="v-modal-overlay"
          onClick={() => {
            if (!saving) setShowForm(false);
          }}
        >
          <div
            className="v-modal max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="v-modal-header">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Icon
                  icon={editingId ? "tabler:edit" : "tabler:plus"}
                  className="w-4 h-4"
                />
                {editingId ? "ویرایش صفحه" : "صفحه جدید"}
              </h3>
              <button
                onClick={resetForm}
                className="v-btn v-btn-sm"
                style={{ color: "var(--v-text-disabled)" }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    عنوان صفحه
                  </label>
                  <input
                    type="text"
                    required
                    className="v-input"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    slug
                  </label>
                  <input
                    type="text"
                    className="v-input"
                    placeholder="خالی = خودکار"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  محتوای صفحه
                </label>
                <TiptapEditor
                  value={form.content}
                  onChange={(html) => setForm({ ...form, content: html })}
                  placeholder="محتوای صفحه را وارد کنید..."
                  minHeight={350}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    عنوان SEO
                  </label>
                  <input
                    type="text"
                    className="v-input"
                    value={form.metaTitle}
                    onChange={(e) =>
                      setForm({ ...form, metaTitle: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    توضیحات SEO
                  </label>
                  <input
                    type="text"
                    className="v-input"
                    value={form.metaDesc}
                    onChange={(e) =>
                      setForm({ ...form, metaDesc: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    ترتیب
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    وضعیت
                  </label>
                  <label className="flex items-center gap-3 mt-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) =>
                          setForm({ ...form, isActive: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div
                        className="w-10 h-5 rounded-full transition after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"
                        style={{
                          background: form.isActive
                            ? "var(--v-success)"
                            : "var(--v-border)",
                        }}
                      />
                    </div>
                    <span className="text-sm">
                      {form.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="v-btn v-btn-primary"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Icon icon="tabler:device-floppy" className="w-4 h-4" />{" "}
                      {editingId ? "بروزرسانی" : "ذخیره"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="v-btn v-btn-secondary"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg animate-pulse"
              style={{ background: "var(--v-bg)" }}
            />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:file-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هیچ صفحه‌ای یافت نشد. اولین صفحه را ایجاد کنید.
          </p>
        </div>
      ) : (
        <div className="v-card p-0 overflow-hidden">
          <table className="v-table">
            <thead>
              <tr>
                <th>عنوان</th>
                <th>slug</th>
                <th>وضعیت</th>
                <th>ترتیب</th>
                <th>تاریخ</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.title}</td>
                  <td style={{ color: "var(--v-text-secondary)" }}>
                    /{p.slug}
                  </td>
                  <td>
                    <span
                      className={`v-badge ${p.isActive ? "v-badge-success" : "v-badge-secondary"}`}
                    >
                      {p.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td>{p.sortOrder}</td>
                  <td
                    className="text-xs"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {new Date(p.createdAt).toLocaleDateString("fa-IR")}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="v-btn v-btn-secondary v-btn-sm"
                      >
                        <Icon icon="tabler:edit" className="w-3.5 h-3.5" />
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
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
      )}
    </div>
  );
}
