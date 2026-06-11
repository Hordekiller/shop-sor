"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import { provinces } from "@/lib/iran-provinces";

interface Address {
  id: number;
  title: string;
  province: string;
  city: string;
  district: string;
  street: string;
  alley: string;
  building: string;
  floor: string;
  unit: string;
  fullAddress: string;
  postalCode: string;
  isDefault: boolean;
}

export default function PanelAddresses() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    province: "",
    city: "",
    district: "",
    street: "",
    alley: "",
    building: "",
    floor: "",
    unit: "",
    postalCode: "",
    isDefault: false,
  });

  const resetForm = () => {
    setForm({
      title: "",
      province: "",
      city: "",
      district: "",
      street: "",
      alley: "",
      building: "",
      floor: "",
      unit: "",
      postalCode: "",
      isDefault: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    loadAddresses();
  }, [router]);

  const loadAddresses = () => {
    api
      .get<Address[]>("/addresses")
      .then(setAddresses)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  const openEdit = (addr: Address) => {
    setForm({
      title: addr.title,
      province: addr.province,
      city: addr.city,
      district: addr.district || "",
      street: addr.street || "",
      alley: addr.alley || "",
      building: addr.building || "",
      floor: addr.floor || "",
      unit: addr.unit || "",
      postalCode: addr.postalCode || "",
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, form);
      } else {
        await api.post("/addresses", form);
      }
      resetForm();
      loadAddresses();
    } catch {
      alert("خطا در ذخیره آدرس");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آدرس حذف شود؟")) return;
    try {
      await api.delete(`/addresses/${id}`);
      loadAddresses();
    } catch {
      alert("خطا در حذف آدرس");
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.put(`/addresses/${id}`, { isDefault: true });
      loadAddresses();
    } catch {
      alert("خطا در تنظیم آدرس پیش‌فرض");
    }
  };

  const cities = form.province
    ? provinces.find((p) => p.name === form.province)?.cities || []
    : [];

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((n) => (
          <div
            key={n}
            className="h-24 rounded-2xl animate-pulse"
            style={{ background: "#e5e7eb" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--dk-text)" }}>
            آدرس‌ها
          </h1>
          <p className="text-sm" style={{ color: "var(--dk-text-light)" }}>
            مدیریت آدرس‌های تحویل سفارش
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white font-medium transition hover:opacity-90"
            style={{ background: "var(--dk-primary)" }}
          >
            <Icon icon="tabler:plus" className="w-4 h-4" />
            آدرس جدید
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-white p-5 mb-6"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <h2 className="font-bold text-sm mb-4">
            {editingId ? "ویرایش آدرس" : "آدرس جدید"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                عنوان
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
                placeholder="مثلاً: منزل، محل کار"
                required
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                استان
              </label>
              <select
                value={form.province}
                onChange={(e) =>
                  setForm({ ...form, province: e.target.value, city: "" })
                }
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
                required
              >
                <option value="">انتخاب کنید</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                شهر
              </label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
                required
                disabled={!form.province}
              >
                <option value="">انتخاب کنید</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                محله
              </label>
              <input
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                خیابان
              </label>
              <input
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                کوچه
              </label>
              <input
                value={form.alley}
                onChange={(e) => setForm({ ...form, alley: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                ساختمان
              </label>
              <input
                value={form.building}
                onChange={(e) => setForm({ ...form, building: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                طبقه
              </label>
              <input
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                واحد
              </label>
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                کد پستی
              </label>
              <input
                value={form.postalCode}
                onChange={(e) =>
                  setForm({ ...form, postalCode: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ borderColor: "var(--dk-border)" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault}
              onChange={(e) =>
                setForm({ ...form, isDefault: e.target.checked })
              }
            />
            <label htmlFor="isDefault" className="text-sm">
              آدرس پیش‌فرض
            </label>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm text-white font-medium transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--dk-primary)" }}
            >
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 rounded-xl text-sm border transition hover:bg-gray-50"
              style={{
                borderColor: "var(--dk-border)",
                color: "var(--dk-text-light)",
              }}
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <div
          className="text-center py-16 rounded-2xl border bg-white"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <Icon
            icon="tabler:map-pin-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--dk-text-light)" }}
          />
          <p className="text-sm" style={{ color: "var(--dk-text-light)" }}>
            آدرسی ثبت نشده است.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-2xl border bg-white p-4"
              style={{
                borderColor: addr.isDefault
                  ? "var(--dk-primary)"
                  : "var(--dk-border)",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{addr.title}</span>
                  {addr.isDefault && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(40,199,111,0.12)",
                        color: "#28C76F",
                      }}
                    >
                      پیش‌فرض
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(addr)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-xs"
                    style={{ color: "var(--dk-text-light)" }}
                  >
                    <Icon icon="tabler:pencil" className="w-4 h-4" />
                  </button>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-xs"
                      style={{ color: "var(--dk-text-light)" }}
                      title="تنظیم به عنوان پیش‌فرض"
                    >
                      <Icon icon="tabler:star" className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-xs"
                    style={{ color: "#ef4444" }}
                  >
                    <Icon icon="tabler:trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs" style={{ color: "var(--dk-text-light)" }}>
                {addr.province}، {addr.city}
                {addr.district && `، ${addr.district}`}
                {addr.street && `، ${addr.street}`}
              </p>
              {addr.postalCode && (
                <p
                  className="text-xs mt-1 font-mono"
                  style={{ color: "var(--dk-text-light)" }}
                >
                  کد پستی: {addr.postalCode}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
