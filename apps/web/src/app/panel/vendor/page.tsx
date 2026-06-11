"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface VendorData {
  id: number;
  shopName: string;
  slug: string;
  description: string;
  logo: string;
  status: string;
  productCount: number;
  orderCount: number;
  totalSales: number;
  rating: number;
}

export default function PanelVendor() {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestForm, setRequestForm] = useState(false);
  const [formData, setFormData] = useState({ shopName: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    api
      .get<VendorData>("/vendor/my-shop")
      .then(setVendor)
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/vendor/request", formData);
      setRequestForm(false);
      setFormData({ shopName: "", description: "" });
      alert("درخواست شما ثبت شد. پس از بررسی، نتیجه اطلاع‌رسانی خواهد شد.");
    } catch {
      alert("خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div
          className="h-32 rounded-2xl animate-pulse"
          style={{ background: "#e5e7eb" }}
        />
      </div>
    );
  }

  // No vendor yet – show request form
  if (!vendor) {
    return (
      <div className="animate-fade-in max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(115,103,240,0.12)" }}
          >
            <Icon
              icon="tabler:briefcase"
              className="w-8 h-8"
              style={{ color: "var(--dk-primary)" }}
            />
          </div>
          <h1
            className="text-xl font-bold mb-1"
            style={{ color: "var(--dk-text)" }}
          >
            پنل فروشندگی
          </h1>
          <p className="text-sm" style={{ color: "var(--dk-text-light)" }}>
            هنوز فروشنده نیستید. با ثبت درخواست، فروش خود را شروع کنید.
          </p>
        </div>

        {requestForm ? (
          <form
            onSubmit={handleSubmitRequest}
            className="rounded-2xl border bg-white p-5"
            style={{ borderColor: "var(--dk-border)" }}
          >
            <h2 className="font-bold text-sm mb-4">درخواست فروشندگی</h2>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--dk-text-light)" }}
                >
                  نام فروشگاه
                </label>
                <input
                  value={formData.shopName}
                  onChange={(e) =>
                    setFormData({ ...formData, shopName: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                  style={{ borderColor: "var(--dk-border)" }}
                  required
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--dk-text-light)" }}
                >
                  توضیحات
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none resize-none"
                  style={{ borderColor: "var(--dk-border)" }}
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-sm text-white font-medium transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--dk-primary)" }}
                >
                  {submitting ? "در حال ارسال..." : "ثبت درخواست"}
                </button>
                <button
                  type="button"
                  onClick={() => setRequestForm(false)}
                  className="px-5 py-2.5 rounded-xl text-sm border transition"
                  style={{
                    borderColor: "var(--dk-border)",
                    color: "var(--dk-text-light)",
                  }}
                >
                  انصراف
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <button
              onClick={() => setRequestForm(true)}
              className="px-6 py-2.5 rounded-xl text-sm text-white font-medium transition hover:opacity-90"
              style={{ background: "var(--dk-primary)" }}
            >
              ثبت درخواست فروشندگی
            </button>
          </div>
        )}
      </div>
    );
  }

  // Has vendor – show dashboard
  const statusColor =
    vendor.status === "ACTIVE"
      ? "#28C76F"
      : vendor.status === "PENDING"
        ? "#FF9F43"
        : "#FF4C51";
  const statusLabel =
    vendor.status === "ACTIVE"
      ? "فعال"
      : vendor.status === "PENDING"
        ? "در انتظار تایید"
        : "غیرفعال";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ background: "rgba(115,103,240,0.12)" }}
          >
            {vendor.logo ? (
              <img
                src={vendor.logo}
                alt={vendor.shopName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon
                icon="tabler:building-store"
                className="w-7 h-7"
                style={{ color: "var(--dk-primary)" }}
              />
            )}
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--dk-text)" }}
            >
              {vendor.shopName}
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--dk-text-light)" }}
            >
              /{vendor.slug}
            </p>
          </div>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: `${statusColor}15`, color: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "تعداد محصولات",
            value: vendor.productCount,
            icon: "tabler:package",
            color: "#7367F0",
          },
          {
            label: "تعداد سفارشات",
            value: vendor.orderCount,
            icon: "tabler:shopping-cart",
            color: "#FF9F43",
          },
          {
            label: "فروش کل",
            value: `${vendor.totalSales.toLocaleString()} تومان`,
            icon: "tabler:currency-dollar",
            color: "#28C76F",
          },
          {
            label: "امتیاز",
            value: vendor.rating > 0 ? `${vendor.rating.toFixed(1)} / 5` : "—",
            icon: "tabler:star",
            color: "#FF4C51",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border bg-white p-4"
            style={{ borderColor: "var(--dk-border)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}15` }}
              >
                <Icon
                  icon={stat.icon}
                  className="w-4 h-4"
                  style={{ color: stat.color }}
                />
              </div>
            </div>
            <p
              className="text-lg font-bold"
              style={{ color: "var(--dk-text)" }}
            >
              {stat.value}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--dk-text-light)" }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link
          href={`/vendor/${vendor.slug}`}
          className="rounded-2xl border bg-white p-4 hover:shadow-sm transition flex items-center gap-3"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(115,103,240,0.12)" }}
          >
            <Icon
              icon="tabler:eye"
              className="w-5 h-5"
              style={{ color: "var(--dk-primary)" }}
            />
          </div>
          <div>
            <p className="font-medium text-sm">مشاهده فروشگاه</p>
            <p className="text-xs" style={{ color: "var(--dk-text-light)" }}>
              نمایش عمومی فروشگاه شما
            </p>
          </div>
        </Link>
        <Link
          href="/vendor/products"
          className="rounded-2xl border bg-white p-4 hover:shadow-sm transition flex items-center gap-3"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(40,199,111,0.12)" }}
          >
            <Icon
              icon="tabler:package"
              className="w-5 h-5"
              style={{ color: "#28C76F" }}
            />
          </div>
          <div>
            <p className="font-medium text-sm">مدیریت محصولات</p>
            <p className="text-xs" style={{ color: "var(--dk-text-light)" }}>
              افزودن و ویرایش محصولات
            </p>
          </div>
        </Link>
        {vendor.status === "ACTIVE" && (
          <Link
            href="/admin"
            className="rounded-2xl border bg-white p-4 hover:shadow-sm transition flex items-center gap-3 md:col-span-2"
            style={{ borderColor: "var(--dk-border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,159,67,0.12)" }}
            >
              <Icon
                icon="tabler:layout-dashboard"
                className="w-5 h-5"
                style={{ color: "#FF9F43" }}
              />
            </div>
            <div>
              <p className="font-medium text-sm">ورود به پنل مدیریت فروشگاه</p>
              <p className="text-xs" style={{ color: "var(--dk-text-light)" }}>
                مدیریت کامل فروشگاه خود در پنل ادمین
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
