"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faClipboardList,
  faMoneyBillWave,
  faHourglassHalf,
  faPlus,
  faChartBar,
  faTruck,
  faComment,
  faMobile,
  faTv,
  faX,
} from "@fortawesome/free-solid-svg-icons";

const exampleStats = {
  products: 24,
  orders: 156,
  revenue: 85200000,
  pending: 8,
};

const exampleOrders = [
  {
    id: 1001,
    customer: "علی محمدی",
    date: "۱۴۰۵/۰۳/۱۰",
    total: 1250000,
    status: "pending",
  },
  {
    id: 1002,
    customer: "سارا احمدی",
    date: "۱۴۰۵/۰۳/۱۰",
    total: 890000,
    status: "processing",
  },
  {
    id: 1003,
    customer: "رضا کریمی",
    date: "۱۴۰۵/۰۳/۰۹",
    total: 2450000,
    status: "completed",
  },
  {
    id: 1004,
    customer: "مریم حسینی",
    date: "۱۴۰۵/۰۳/۰۹",
    total: 560000,
    status: "completed",
  },
  {
    id: 1005,
    customer: "حسین رضایی",
    date: "۱۴۰۵/۰۳/۰۸",
    total: 1780000,
    status: "cancelled",
  },
];

const statusBadge: Record<string, { label: string; cls: string }> = {
  pending: { label: "در انتظار", cls: "bg-amber-100 text-amber-700" },
  processing: { label: "در حال پردازش", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "تکمیل شده", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "لغو شده", cls: "bg-red-100 text-red-700" },
};

export default function VendorPage() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(exampleStats);
  const [orders] = useState(exampleOrders);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{
        products: number;
        orders: number;
        revenue: number;
        pending: number;
      }>("/vendor/stats")
      .then(setStats)
      .catch(() => setStats(exampleStats))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />

      <div className="dk-container pt-4 pb-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--dk-text-light)] mb-6">
          <Link href="/" className="hover:text-[var(--dk-primary)] transition">
            خانه
          </Link>
          <span>/</span>
          <span className="text-[var(--dk-text)] font-medium">پنل فروشنده</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">پنل مدیریت فروشنده</h1>
          <div className="flex gap-3">
            <Link
              href="/vendor/products"
              className="dk-btn-primary text-sm !py-2 !px-4"
            >
              مدیریت محصولات
            </Link>
            <Link
              href="/vendor/orders"
              className="bg-[var(--dk-secondary)] text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              مدیریت سفارشات
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="dk-card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--dk-text-light)]">
                محصولات
              </span>
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: "var(--dk-bg)",
                  color: "var(--dk-primary)",
                }}
              >
                <FontAwesomeIcon icon={faBox} className="w-5 h-5" />
              </span>
            </div>
            <p className="text-3xl font-bold">
              {loading ? "..." : stats.products}
            </p>
          </div>

          <div className="dk-card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--dk-text-light)]">
                سفارشات
              </span>
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: "var(--dk-bg)",
                  color: "var(--dk-primary)",
                }}
              >
                <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5" />
              </span>
            </div>
            <p className="text-3xl font-bold">
              {loading ? "..." : stats.orders}
            </p>
          </div>

          <div className="dk-card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--dk-text-light)]">
                درآمد کل
              </span>
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: "var(--dk-bg)",
                  color: "var(--dk-primary)",
                }}
              >
                <FontAwesomeIcon icon={faMoneyBillWave} className="w-5 h-5" />
              </span>
            </div>
            <p className="text-2xl font-bold">
              {loading ? "..." : stats.revenue.toLocaleString()}{" "}
              <span className="text-sm font-normal text-[var(--dk-text-light)]">
                تومان
              </span>
            </p>
          </div>

          <div className="dk-card p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--dk-text-light)]">
                سفارشات در انتظار
              </span>
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: "var(--dk-bg)",
                  color: "var(--dk-primary)",
                }}
              >
                <FontAwesomeIcon icon={faHourglassHalf} className="w-5 h-5" />
              </span>
            </div>
            <p
              className="text-3xl font-bold"
              style={{ color: "var(--dk-primary)" }}
            >
              {loading ? "..." : stats.pending}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dk-card p-6 mb-8">
          <h2 className="font-bold text-lg mb-4">دسترسی سریع</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => addToast("به زودی...")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: "var(--dk-bg)", color: "var(--dk-text)" }}
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4 ml-1.5" />{" "}
              افزودن محصول جدید
            </button>
            <button
              onClick={() => addToast("به زودی...")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: "var(--dk-bg)", color: "var(--dk-text)" }}
            >
              <FontAwesomeIcon icon={faChartBar} className="w-4 h-4 ml-1.5" />{" "}
              گزارش فروش
            </button>
            <button
              onClick={() => addToast("به زودی...")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: "var(--dk-bg)", color: "var(--dk-text)" }}
            >
              <FontAwesomeIcon icon={faTruck} className="w-4 h-4 ml-1.5" />{" "}
              بروزرسانی وضعیت ارسال
            </button>
            <button
              onClick={() => addToast("به زودی...")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: "var(--dk-bg)", color: "var(--dk-text)" }}
            >
              <FontAwesomeIcon icon={faComment} className="w-4 h-4 ml-1.5" />{" "}
              پیام‌های خریداران
            </button>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="dk-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">آخرین سفارشات</h2>
            <Link
              href="/vendor/orders"
              className="text-sm hover:underline"
              style={{ color: "var(--dk-primary)" }}
            >
              مشاهده همه سفارشات
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--dk-border)]">
                  <th className="text-right py-3 px-4 font-medium text-[var(--dk-text-light)]">
                    #
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--dk-text-light)]">
                    مشتری
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--dk-text-light)]">
                    تاریخ
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--dk-text-light)]">
                    مبلغ
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--dk-text-light)]">
                    وضعیت
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--dk-text-light)]">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--dk-border)] hover:bg-[var(--dk-bg)] transition"
                  >
                    <td className="py-3 px-4">{order.id}</td>
                    <td className="py-3 px-4">{order.customer}</td>
                    <td className="py-3 px-4 text-[var(--dk-text-light)]">
                      {order.date}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {order.total.toLocaleString()} تومان
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[order.status].cls}`}
                      >
                        {statusBadge[order.status].label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/vendor/orders/${order.id}`}
                        className="text-xs hover:underline"
                        style={{ color: "var(--dk-primary)" }}
                      >
                        جزئیات
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[var(--dk-border)] py-8 mt-4">
        <div className="dk-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-sm mb-3">اطلس شاپ</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li>
                  <a href="/about" className="hover:text-[var(--dk-primary)]">
                    درباره ما
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-[var(--dk-primary)]">
                    تماس با ما
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    فرصت‌های شغلی
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">خدمات مشتریان</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    راهنمای خرید
                  </a>
                </li>
                <li>
                  <a href="/rules" className="hover:text-[var(--dk-primary)]">
                    شرایط بازگشت
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    پرسش‌های متداول
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">راهنمایی</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    نحوه ثبت سفارش
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    روش‌های پرداخت
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    روش‌های ارسال
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">با ما همراه شوید</h4>
              <div className="flex gap-3">
                {[faMobile, faComment, faTv, faX].map((icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-full bg-[var(--dk-bg)] flex items-center justify-center text-lg hover:bg-[var(--dk-primary)] hover:text-white transition"
                  >
                    <FontAwesomeIcon icon={icon} className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--dk-border)] pt-6 text-center text-xs text-[var(--dk-text-light)]">
            <p>
              استفاده از مطالب فروشگاه اینترنتی اطلس شاپ فقط برای مقاصد غیرتجاری
              و با ذکر منبع بلامانع است.
            </p>
            <p className="mt-2">
              کلیه حقوق این سایت متعلق به اطلس شاپ می‌باشد.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
