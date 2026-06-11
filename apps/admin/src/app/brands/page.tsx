"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isActive: boolean;
  _count: { products: number };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: "", description: "", logo: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Brand[]>("/brands")
      .then(setBrands)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", logo: "" });
    setShowForm(true);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setForm({
      name: brand.name,
      description: brand.description || "",
      logo: brand.logo || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await api.put<Brand>(`/brands/${editing.id}`, form);
        setBrands(
          brands.map((b) => (b.id === editing.id ? { ...b, ...updated } : b)),
        );
      } else {
        const created = await api.post<Brand>("/brands", form);
        setBrands([...brands, created]);
      }
      setShowForm(false);
    } catch (err) {
      alert(err);
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این برند اطمینان دارید؟")) return;
    try {
      await api.delete(`/brands/${id}`);
      setBrands(brands.filter((b) => b.id !== id));
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            برندها
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            مدیریت برندهای فروشگاه
          </p>
        </div>
        <button onClick={openCreate} className="v-btn v-btn-primary">
          <Icon icon="tabler:plus" className="w-4 h-4" />
          برند جدید
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowForm(false)}
        >
          <div
            className="v-card p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh", overflow: "auto" }}
          >
            <h3
              className="text-lg font-bold mb-4"
              style={{ color: "var(--v-text)" }}
            >
              {editing ? "ویرایش برند" : "برند جدید"}
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  نام برند *
                </label>
                <input
                  type="text"
                  required
                  className="v-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  توضیحات
                </label>
                <textarea
                  className="v-input"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  لوگو (URL)
                </label>
                <input
                  type="text"
                  className="v-input"
                  dir="ltr"
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="v-btn v-btn-primary"
              >
                {saving ? "در حال ذخیره..." : "ذخیره"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="v-btn v-btn-secondary"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
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
      ) : brands.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:trademark-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هیچ برندی ثبت نشده است.
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
                  <th>نامک</th>
                  <th>محصولات</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td className="font-medium">{brand.id}</td>
                    <td className="font-medium flex items-center gap-2">
                      {brand.logo && (
                        <img
                          src={brand.logo}
                          alt=""
                          className="w-6 h-6 object-contain rounded"
                        />
                      )}
                      {brand.name}
                    </td>
                    <td style={{ color: "var(--v-text-secondary)" }} dir="ltr">
                      {brand.slug}
                    </td>
                    <td>{brand._count.products}</td>
                    <td>
                      <span
                        className={`v-badge ${brand.isActive ? "v-badge-success" : "v-badge-secondary"}`}
                      >
                        {brand.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(brand)}
                          className="v-btn v-btn-secondary v-btn-sm"
                        >
                          <Icon icon="tabler:edit" className="w-3.5 h-3.5" />
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
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
