"use client";

import { useEffect, useState, FormEvent } from "react";
import { api } from "@/lib/api";

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number | null;
  maxUsesPerUser: number;
  maxDiscountAmount: number | null;
  usedCount: number;
  totalDiscount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  applicableProducts: string;
  applicableCategories: string;
  _count?: { usages: number };
}

interface CouponStats {
  totalUsages: number;
  totalDiscount: number;
  usages: Array<{
    user: { name: string };
    order: { orderNumber: string };
    discount: number;
    usedAt: string;
  }>;
}

interface FormData {
  code: string;
  type: string;
  value: string;
  minOrder: string;
  maxUses: string;
  maxUsesPerUser: string;
  maxDiscountAmount: string;
  startsAt: string;
  expiresAt: string;
  applicableProducts: string;
  applicableCategories: string;
}

const defaultForm: FormData = {
  code: "",
  type: "percent",
  value: "",
  minOrder: "0",
  maxUses: "",
  maxUsesPerUser: "1",
  maxDiscountAmount: "",
  startsAt: "",
  expiresAt: "",
  applicableProducts: "",
  applicableCategories: "",
};

const typeOptions = [
  { value: "percent", label: "درصد" },
  { value: "fixed", label: "مبلغ ثابت" },
  { value: "free_shipping", label: "ارسال رایگان" },
];

const typeLabels: Record<string, string> = {
  percent: "درصد",
  fixed: "ثابت",
  free_shipping: "رایگان",
};

function formatValue(type: string, value: number) {
  if (type === "percent") return `%${value}`;
  if (type === "free_shipping") return "رایگان";
  return `${value.toLocaleString()} ریال`;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [statsCoupon, setStatsCoupon] = useState<Coupon | null>(null);
  const [statsData, setStatsData] = useState<CouponStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = async () => {
    try {
      const data = await api.get<Coupon[]>("/coupons");
      setCoupons(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setFormMode("create");
  };

  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrder: String(c.minOrder),
      maxUses: c.maxUses !== null ? String(c.maxUses) : "",
      maxUsesPerUser: String(c.maxUsesPerUser),
      maxDiscountAmount:
        c.maxDiscountAmount !== null ? String(c.maxDiscountAmount) : "",
      startsAt: c.startsAt ? c.startsAt.slice(0, 16) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 16) : "",
      applicableProducts: c.applicableProducts || "",
      applicableCategories: c.applicableCategories || "",
    });
    setEditingId(c.id);
    setFormMode("edit");
  };

  const cancelForm = () => {
    setFormMode(null);
    setEditingId(null);
    setForm(defaultForm);
  };

  const parseIdList = (input: string): number[] => {
    if (!input) return [];
    if (input.startsWith("[")) {
      try {
        return JSON.parse(input);
      } catch {
        return [];
      }
    }
    return input
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: parseFloat(form.value) || 0,
        minOrder: parseInt(form.minOrder) || 0,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        maxUsesPerUser: parseInt(form.maxUsesPerUser) || 1,
        maxDiscountAmount: form.maxDiscountAmount
          ? parseFloat(form.maxDiscountAmount)
          : null,
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
        applicableProducts: parseIdList(form.applicableProducts),
        applicableCategories: parseIdList(form.applicableCategories),
      };

      if (editingId) {
        await api.put(`/coupons/${editingId}`, payload);
      } else {
        await api.post("/coupons", payload);
      }

      cancelForm();
      fetchCoupons();
    } catch {
      alert("خطا در ذخیره تخفیف");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await api.delete(`/coupons/${id}`);
      setDeleteConfirm(null);
      fetchCoupons();
    } catch {
      alert("خطا در حذف تخفیف");
    }
    setDeleting(false);
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/coupons/${id}`, { isActive: !isActive });
      fetchCoupons();
    } catch {
      alert("خطا در تغییر وضعیت");
    }
  };

  const openStats = async (c: Coupon) => {
    setStatsCoupon(c);
    setStatsData(null);
    setStatsLoading(true);
    try {
      const data = await api.get<CouponStats>(`/coupons/${c.id}/stats`);
      setStatsData(data);
    } catch {
      alert("خطا در دریافت آمار");
    }
    setStatsLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">تخفیف‌ها</h2>
        <button
          onClick={formMode ? cancelForm : openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          {formMode ? "انصراف" : "تخفیف جدید"}
        </button>
      </div>

      {formMode && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl bg-white p-5 shadow-sm border space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                کد تخفیف
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">نوع</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">مقدار</label>
              <input
                type="number"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                حداقل سفارش
              </label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.minOrder}
                onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                حداکثر استفاده کل
                <span className="text-gray-400 mr-1">(اختیاری)</span>
              </label>
              <input
                type="number"
                placeholder="بدون محدودیت"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                حداکثر استفاده هر کاربر
              </label>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.maxUsesPerUser}
                onChange={(e) =>
                  setForm({ ...form, maxUsesPerUser: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                سقف تخفیف
                <span className="text-gray-400 mr-1">(اختیاری)</span>
              </label>
              <input
                type="number"
                placeholder="بدون محدودیت"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.maxDiscountAmount}
                onChange={(e) =>
                  setForm({ ...form, maxDiscountAmount: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                تاریخ شروع
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                تاریخ انقضا
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                محصولات مجاز
              </label>
              <input
                type="text"
                placeholder="شناسه محصولات با کاما"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.applicableProducts}
                onChange={(e) =>
                  setForm({ ...form, applicableProducts: e.target.value })
                }
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                خالی = همه محصولات
              </span>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                دسته‌بندی‌های مجاز
              </label>
              <input
                type="text"
                placeholder="شناسه دسته‌بندی‌ها با کاما"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.applicableCategories}
                onChange={(e) =>
                  setForm({ ...form, applicableCategories: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting
                ? "در حال ذخیره..."
                : editingId
                  ? "بروزرسانی"
                  : "ایجاد"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg border px-6 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">در حال بارگذاری...</p>
      ) : coupons.length === 0 ? (
        <p className="text-gray-500">هیچ تخفیفی یافت نشد.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-right">
              <tr>
                <th className="px-4 py-3 font-medium">کد</th>
                <th className="px-4 py-3 font-medium">نوع</th>
                <th className="px-4 py-3 font-medium">مقدار</th>
                <th className="px-4 py-3 font-medium">سقف تخفیف</th>
                <th className="px-4 py-3 font-medium">استفاده</th>
                <th className="px-4 py-3 font-medium">حداقل سفارش</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">آمار</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr
                  key={c.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {c.code}
                  </td>
                  <td className="px-4 py-3">{typeLabels[c.type] || c.type}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatValue(c.type, c.value)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.maxDiscountAmount
                      ? `${c.maxDiscountAmount.toLocaleString()} ریال`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.usedCount}
                    {c.maxUses !== null ? `/${c.maxUses}` : "/∞"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.minOrder.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(c.id, c.isActive)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {c.isActive ? "فعال" : "غیرفعال"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openStats(c)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                    >
                      آمار
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(c.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Modal */}
      {statsCoupon && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={() => setStatsCoupon(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">آمار {statsCoupon.code}</h3>
              <button
                onClick={() => setStatsCoupon(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {statsLoading ? (
              <p className="text-gray-500 text-sm">در حال بارگذاری...</p>
            ) : statsData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">
                      تعداد کل استفاده‌ها
                    </div>
                    <div className="text-lg font-bold mt-1">
                      {statsData.totalUsages}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">
                      مجموع تخفیف داده شده
                    </div>
                    <div className="text-lg font-bold mt-1">
                      {statsData.totalDiscount.toLocaleString()} ریال
                    </div>
                  </div>
                </div>

                {statsData.usages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      آخرین استفاده‌ها
                    </h4>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-right px-3 py-2 font-medium text-xs">
                              کاربر
                            </th>
                            <th className="text-right px-3 py-2 font-medium text-xs">
                              سفارش
                            </th>
                            <th className="text-right px-3 py-2 font-medium text-xs">
                              تخفیف
                            </th>
                            <th className="text-right px-3 py-2 font-medium text-xs">
                              تاریخ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {statsData.usages.map((u, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="px-3 py-2">{u.user.name}</td>
                              <td className="px-3 py-2">
                                {u.order.orderNumber}
                              </td>
                              <td className="px-3 py-2">
                                {u.discount.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                                {new Date(u.usedAt).toLocaleDateString("fa-IR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {statsData.usages.length === 0 && (
                  <p className="text-gray-400 text-sm">
                    هنوز استفاده‌ای ثبت نشده است.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2">حذف تخفیف</h3>
            <p className="text-sm text-gray-500 mb-6">
              آیا از حذف این تخفیف اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 text-white py-2.5 text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "در حال حذف..." : "حذف"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
