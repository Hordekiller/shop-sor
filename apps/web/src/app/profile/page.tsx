"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { toJalaliHuman } from "@/lib/date";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import {
  faHome,
  faBriefcase,
  faMapMarkerAlt,
  faStar,
  faEdit,
  faTrash,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { provinces, Province } from "@/lib/iran-provinces";

interface Address {
  id: number;
  title: string;
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  addressText: string;
  postalCode: string;
  isDefault: boolean;
}

const emptyAddressForm = {
  title: "خانه",
  receiverName: "",
  phone: "",
  province: "",
  city: "",
  addressText: "",
  postalCode: "",
  isDefault: false,
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    api
      .get<any>("/auth/me")
      .then((u) => {
        setUser(u);
        setForm({ name: u.name || "", phone: u.phone || "" });
      })
      .catch(() => {
        localStorage.removeItem("web_token");
        window.dispatchEvent(new Event("auth:change"));
        router.push("/auth/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!loading && user) {
      api
        .get<Address[]>("/addresses")
        .then(setAddresses)
        .catch(() => {});
    }
  }, [loading, user]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put<any>("/auth/profile", form);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || "خطا");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("web_token");
    localStorage.removeItem("web_user");
    window.dispatchEvent(new Event("auth:change"));
    router.push("/");
  };

  const openAddForm = () => {
    setAddressForm(emptyAddressForm);
    setEditingId(null);
    setShowAddressForm(true);
  };

  const openEditForm = (addr: Address) => {
    setAddressForm({
      title: addr.title,
      receiverName: addr.receiverName,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      addressText: addr.addressText,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowAddressForm(true);
  };

  const handleAddressSave = async (e: FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    try {
      if (editingId) {
        const updated = await api.put<Address>(
          `/addresses/${editingId}`,
          addressForm,
        );
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingId ? updated : a)),
        );
      } else {
        const created = await api.post<Address>("/addresses", addressForm);
        setAddresses((prev) => [...prev, created]);
      }
      setShowAddressForm(false);
      setAddressForm(emptyAddressForm);
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || "خطا");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || "خطا");
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const updated = await api.put<Address>(`/addresses/${id}/default`, {});
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id })),
      );
    } catch (err: any) {
      alert(err.message || "خطا");
    }
  };

  const selectedProvinceCities = addressForm.province
    ? provinces.find((p) => p.name === addressForm.province)?.cities || []
    : [];

  const titleOptions = ["خانه", "محل کار", "سایر"];
  const titleIcons: Record<string, any> = {
    خانه: faHome,
    "محل کار": faBriefcase,
    سایر: faMapMarkerAlt,
  };
  const titleColors: Record<string, string> = {
    خانه: "bg-blue-100 text-blue-600",
    "محل کار": "bg-purple-100 text-purple-600",
    سایر: "bg-gray-100 text-gray-600",
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="dk-container py-8">
          <div className="animate-pulse dk-card p-6 h-64" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="dk-container py-6">
        <nav className="text-xs text-[var(--dk-text-light)] mb-5">
          <Link href="/" className="hover:text-[var(--dk-primary)]">
            خانه
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--dk-text)]">پروفایل</span>
        </nav>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="dk-card p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--dk-bg)] flex items-center justify-center text-2xl font-bold mx-auto mb-3">
              {(user?.name || "ک")[0]}
            </div>
            <h2 className="font-bold">{user?.name || "کاربر"}</h2>
            <p className="text-sm text-[var(--dk-text-light)]">{user?.email}</p>
            <button
              onClick={handleLogout}
              className="mt-4 px-6 py-2 rounded-xl border text-sm text-red-500 hover:bg-red-50"
            >
              خروج از حساب
            </button>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="dk-card p-6">
              <h3 className="font-bold text-sm mb-3">کیف پول</h3>
              <Link
                href="/wallet"
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--dk-bg)] hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm2-6h4v4h-4v-4z" />
                  </svg>
                  <span className="text-sm font-medium">مشاهده کیف پول</span>
                </div>
                <svg
                  className="w-4 h-4 text-[var(--dk-text-light)] rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            <div className="dk-card p-6">
              <h3 className="font-bold text-sm mb-4">اطلاعات حساب</h3>
              <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm font-medium mb-1 block">نام</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    شماره موبایل
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="dk-btn-primary text-sm disabled:opacity-50"
                >
                  {saving ? (
                    "در حال ذخیره..."
                  ) : saved ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />{" "}
                      ذخیره شد
                    </>
                  ) : (
                    "ذخیره تغییرات"
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[var(--dk-border)]">
                <h3 className="font-bold text-sm mb-3">سفارشات</h3>
                <Link
                  href="/orders"
                  className="dk-btn-primary text-sm inline-block"
                >
                  مشاهده سفارشات
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 dk-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">آدرس‌های من</h3>
            <button
              onClick={openAddForm}
              className="dk-btn-primary text-sm flex items-center gap-1"
            >
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
              افزودن آدرس
            </button>
          </div>

          {addresses.length === 0 ? (
            <p className="text-sm text-[var(--dk-text-light)]">
              آدرسی ثبت نشده است.
            </p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`rounded-xl border p-4 ${
                    addr.isDefault
                      ? "border-[var(--dk-primary)]"
                      : "border-[var(--dk-border)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${titleColors[addr.title] || "bg-gray-100 text-gray-600"}`}
                        >
                          <FontAwesomeIcon
                            icon={titleIcons[addr.title] || faMapMarkerAlt}
                            className="w-3 h-3"
                          />
                          {addr.title}
                        </span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--dk-primary)]">
                            <FontAwesomeIcon
                              icon={faStar}
                              className="w-3 h-3"
                            />
                            پیش‌فرض
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        {addr.receiverName} | {addr.phone}
                      </p>
                      <p className="text-xs text-[var(--dk-text-light)]">
                        {addr.province}، {addr.city}
                      </p>
                      <p className="text-xs text-[var(--dk-text-light)] line-clamp-2">
                        {addr.addressText}
                      </p>
                      <p className="text-xs text-[var(--dk-text-light)]">
                        کد پستی: {addr.postalCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="p-2 rounded-lg text-xs text-[var(--dk-primary)] hover:bg-[var(--dk-bg)]"
                          title="تنظیم به عنوان پیش‌فرض"
                        >
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="w-3.5 h-3.5"
                          />
                        </button>
                      )}
                      <button
                        onClick={() => openEditForm(addr)}
                        className="p-2 rounded-lg text-xs text-gray-500 hover:bg-[var(--dk-bg)]"
                        title="ویرایش"
                      >
                        <FontAwesomeIcon
                          icon={faEdit}
                          className="w-3.5 h-3.5"
                        />
                      </button>
                      {deleteConfirmId === addr.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(addr.id)}
                            className="px-2 py-1 rounded-lg text-xs bg-red-500 text-white"
                          >
                            حذف
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded-lg text-xs border"
                          >
                            انصراف
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(addr.id)}
                          className="p-2 rounded-lg text-xs text-red-500 hover:bg-red-50"
                          title="حذف"
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="w-3.5 h-3.5"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddressForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="font-bold text-sm mb-4">
              {editingId ? "ویرایش آدرس" : "افزودن آدرس جدید"}
            </h3>
            <form onSubmit={handleAddressSave} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">عنوان</label>
                <select
                  value={addressForm.title}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, title: e.target.value })
                  }
                  className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                >
                  {titleOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  نام دریافت‌کننده
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.receiverName}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      receiverName: e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  شماره تماس
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, phone: e.target.value })
                  }
                  className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    استان
                  </label>
                  <select
                    required
                    value={addressForm.province}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        province: e.target.value,
                        city: "",
                      })
                    }
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  >
                    <option value="">انتخاب استان</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">شهر</label>
                  <select
                    required
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    disabled={!addressForm.province}
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)] disabled:opacity-50"
                  >
                    <option value="">انتخاب شهر</option>
                    {selectedProvinceCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  کد پستی
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.postalCode}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      postalCode: e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">آدرس</label>
                <textarea
                  required
                  value={addressForm.addressText}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      addressText: e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({
                      ...addressForm,
                      isDefault: e.target.checked,
                    })
                  }
                  className="accent-[var(--dk-primary)]"
                />
                تنظیم به عنوان پیش‌فرض
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="dk-btn-primary text-sm flex-1 disabled:opacity-50"
                >
                  {addressSaving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingId(null);
                    setAddressForm(emptyAddressForm);
                  }}
                  className="px-5 py-2.5 rounded-xl border text-sm"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
