"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import JalaliDate from "@/components/JalaliDate";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const persianMonths = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
  totalShops: number;
  totalCoupons: number;
  recentOrders: {
    id: number;
    orderNumber: string;
    total: number;
    status: string;
    user: { name: string; email: string };
    createdAt: string;
  }[];
}

interface MonthlySale {
  month: string;
  revenue: number;
}
interface LowStockItem {
  id: number;
  title: string;
  slug: string;
  stock: number;
}
interface ViewedProduct {
  id: number;
  title: string;
  viewCount: number;
}
interface UserReport {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
}

const statusLabels: Record<string, string> = {
  pending: "در انتظار",
  confirmed: "تایید شده",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};
const statusBadge: Record<string, string> = {
  pending: "v-badge-warning",
  confirmed: "v-badge-info",
  processing: "v-badge-primary",
  shipped: "v-badge-secondary",
  delivered: "v-badge-success",
  cancelled: "v-badge-error",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [mostViewed, setMostViewed] = useState<ViewedProduct[]>([]);
  const [userReport, setUserReport] = useState<UserReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Stats>("/admin/stats").catch(() => null),
      api.get<MonthlySale[]>("/admin/monthly-sales").catch(() => []),
      api
        .get<{ products: LowStockItem[] }>("/admin/low-stock?threshold=5")
        .catch(() => ({ products: [] })),
      api.get<ViewedProduct[]>("/admin/most-viewed?take=5").catch(() => []),
      api.get<UserReport>("/admin/user-report").catch(() => null),
    ])
      .then(([s, m, l, v, u]) => {
        if (s) setStats(s);
        if (m) setMonthlySales(m);
        if (l) setLowStock(l.products);
        if (v) setMostViewed(v);
        if (u) setUserReport(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const revenueData =
    monthlySales.length > 0
      ? monthlySales.map((m) => m.revenue)
      : Array(12).fill(0);
  const revenueMonths =
    monthlySales.length > 0
      ? monthlySales.map((m) => {
          const parts = m.month.split("-");
          const monthIndex = parseInt(parts[1]) - 1;
          return persianMonths[monthIndex] || m.month;
        })
      : persianMonths;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div
            key={n}
            className="rounded-xl bg-white p-5 shadow-sm border animate-pulse h-28"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--v-text)" }}
        >
          <Icon
            icon="tabler:layout-dashboard"
            className="w-7 h-7"
            style={{ color: "var(--v-primary)" }}
          />
          داشبورد
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--v-text-secondary)" }}
        >
          خلاصه فعالیت‌های فروشگاه اطلس شاپ
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="کل فروش"
          value={`${(stats?.totalRevenue || 0).toLocaleString()} تومان`}
          icon="tabler:currency-dollar"
          color="#7367F0"
          bgColor="rgba(115, 103, 240, 0.12)"
        />
        <StatCard
          label="سفارشات امروز"
          value={String(stats?.ordersToday || 0)}
          icon="tabler:shopping-cart"
          color="#28C76F"
          bgColor="rgba(40, 199, 111, 0.12)"
        />
        <StatCard
          label="محصولات"
          value={String(stats?.totalProducts || 0)}
          icon="tabler:package"
          color="#FF9F43"
          bgColor="rgba(255, 159, 67, 0.12)"
        />
        <StatCard
          label="کاربران"
          value={String(stats?.totalUsers || 0)}
          icon="tabler:users"
          color="#00BAD1"
          bgColor="rgba(0, 186, 209, 0.12)"
        />
        <StatCard
          label="فروشندگان"
          value={String(stats?.totalShops || 0)}
          icon="tabler:building-store"
          color="#FF4C51"
          bgColor="rgba(255, 76, 81, 0.12)"
        />
        <StatCard
          label="تخفیف‌ها"
          value={String(stats?.totalCoupons || 0)}
          icon="tabler:ticket"
          color="#808390"
          bgColor="rgba(128, 131, 144, 0.12)"
        />
        <StatCard
          label="مجموع سفارشات"
          value={String(stats?.totalOrders || 0)}
          icon="tabler:clipboard-list"
          color="#7367F0"
          bgColor="rgba(115, 103, 240, 0.12)"
        />
        <StatCard
          label="درآمد امروز"
          value={`${(stats?.revenueToday || 0).toLocaleString()} تومان`}
          icon="tabler:coin"
          color="#28C76F"
          bgColor="rgba(40, 199, 111, 0.12)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-xl bg-white shadow-sm border overflow-hidden">
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--v-border, #e0e0e6)" }}
          >
            <div>
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--v-text)" }}
              >
                نمودار فروش
              </h3>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--v-text-secondary)" }}
              >
                فروش ماهانه در یک سال اخیر
              </p>
            </div>
          </div>
          <div className="p-2" dir="ltr">
            <Chart
              options={{
                chart: {
                  type: "area",
                  toolbar: { show: false },
                  fontFamily: "inherit",
                  animations: { enabled: false },
                },
                colors: ["#7367F0"],
                stroke: { curve: "smooth", width: 2 },
                fill: {
                  type: "gradient",
                  gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.3,
                    opacityTo: 0,
                  },
                },
                dataLabels: { enabled: false },
                grid: {
                  borderColor: "#e0e0e6",
                  padding: { left: -10, right: 0, bottom: -10 },
                },
                xaxis: {
                  categories: revenueMonths,
                  labels: { style: { colors: "#81858b", fontSize: "11px" } },
                  axisBorder: { show: false },
                  axisTicks: { show: false },
                },
                yaxis: {
                  labels: { style: { colors: "#81858b", fontSize: "11px" } },
                },
                tooltip: { theme: "light" },
              }}
              series={[{ name: "فروش (تومان)", data: revenueData }]}
              type="area"
              height={350}
            />
          </div>
        </div>

        {/* Side widgets */}
        <div className="space-y-6">
          {/* New/Active Users */}
          <div className="rounded-xl bg-white shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(0, 186, 209, 0.12)" }}
              >
                <Icon
                  icon="tabler:users"
                  className="w-5 h-5"
                  style={{ color: "#00BAD1" }}
                />
              </div>
              <div>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--v-text)" }}
                >
                  کاربران
                </h3>
                <p
                  className="text-xs"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  ۳۰ روز اخیر
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p
                  className="text-lg font-bold"
                  style={{ color: "var(--v-text)" }}
                >
                  {userReport?.newUsers || 0}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  جدید
                </p>
              </div>
              <div>
                <p
                  className="text-lg font-bold"
                  style={{ color: "var(--v-text)" }}
                >
                  {userReport?.activeUsers || 0}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  فعال
                </p>
              </div>
              <div>
                <p
                  className="text-lg font-bold"
                  style={{ color: "var(--v-text)" }}
                >
                  {userReport?.totalUsers || 0}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  کل
                </p>
              </div>
            </div>
          </div>

          {/* Low Stock */}
          <div className="rounded-xl bg-white shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255, 76, 81, 0.12)" }}
                >
                  <Icon
                    icon="tabler:alert-triangle"
                    className="w-5 h-5"
                    style={{ color: "#FF4C51" }}
                  />
                </div>
                <div>
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--v-text)" }}
                  >
                    موجودی کم
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    کمتر از ۵ عدد
                  </p>
                </div>
              </div>
              <Link
                href="/inventory"
                className="text-xs"
                style={{ color: "var(--v-primary)" }}
              >
                مشاهده همه
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <p
                className="text-xs"
                style={{ color: "var(--v-text-secondary)" }}
              >
                همه محصولات موجودی کافی دارند
              </p>
            ) : (
              <div className="space-y-2">
                {lowStock.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span
                      className="text-xs truncate ml-2"
                      style={{ color: "var(--v-text)" }}
                    >
                      {p.title}
                    </span>
                    <span
                      className={`text-xs font-bold ${p.stock === 0 ? "text-red-500" : "text-amber-500"}`}
                    >
                      {p.stock}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Viewed */}
          <div className="rounded-xl bg-white shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(115, 103, 240, 0.12)" }}
              >
                <Icon
                  icon="tabler:eye"
                  className="w-5 h-5"
                  style={{ color: "#7367F0" }}
                />
              </div>
              <div>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--v-text)" }}
                >
                  پربازدیدترین
                </h3>
                <p
                  className="text-xs"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  محصولات
                </p>
              </div>
            </div>
            {mostViewed.length === 0 ? (
              <p
                className="text-xs"
                style={{ color: "var(--v-text-secondary)" }}
              >
                داده‌ای وجود ندارد
              </p>
            ) : (
              <div className="space-y-2">
                {mostViewed.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span
                      className="text-xs truncate ml-2"
                      style={{ color: "var(--v-text)" }}
                    >
                      <span
                        className="font-bold ml-1"
                        style={{ color: "var(--v-primary)" }}
                      >
                        {i + 1}.
                      </span>
                      {p.title}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      {p.viewCount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--v-border, #e0e0e6)" }}
        >
          <div>
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--v-text)" }}
            >
              آخرین سفارشات
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--v-text-secondary)" }}
            >
              آخرین سفارشات ثبت شده در فروشگاه
            </p>
          </div>
          <a href="/orders" className="v-btn v-btn-secondary v-btn-sm">
            مشاهده همه
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="v-table">
            <thead>
              <tr>
                <th>شماره</th>
                <th>مشتری</th>
                <th>مبلغ</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders?.map((order) => (
                <tr key={order.id}>
                  <td className="font-medium">{order.orderNumber}</td>
                  <td>{order.user?.name || order.user?.email}</td>
                  <td className="font-medium">
                    {order.total.toLocaleString()} تومان
                  </td>
                  <td>
                    <span
                      className={`v-badge ${statusBadge[order.status] || "v-badge-secondary"}`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td
                    className="text-xs"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    <JalaliDate date={order.createdAt} showTime />
                  </td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    هنوز سفارشی ثبت نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-xl bg-white shadow-sm border p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center"
            style={{ background: bgColor }}
          >
            <Icon icon={icon} className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: "var(--v-text-secondary)" }}>
              {label}
            </p>
            <p
              className="text-xl font-bold mt-0.5"
              style={{ color: "var(--v-text)" }}
            >
              {value}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
