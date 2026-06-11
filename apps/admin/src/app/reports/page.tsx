"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
}

interface MonthlySale {
  month: string;
  revenue: number;
}
interface DailySale {
  date: string;
  revenue: number;
  orders: number;
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

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySale[]>([]);
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [mostViewed, setMostViewed] = useState<ViewedProduct[]>([]);
  const [userReport, setUserReport] = useState<UserReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);
  const [tab, setTab] = useState<"overview" | "sales" | "products">("overview");

  useEffect(() => {
    Promise.all([
      api.get<Stats>("/admin/stats"),
      api.get<MonthlySale[]>("/admin/monthly-sales"),
      api.get<UserReport>("/admin/user-report"),
      api.get<LowStockItem[]>("/admin/low-stock?threshold=5"),
      api.get<ViewedProduct[]>("/admin/most-viewed?take=10"),
    ])
      .then(([s, m, u, l, v]) => {
        setStats(s);
        setMonthlySales(m);
        setUserReport(u);
        setLowStock(l);
        setMostViewed(v);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api
      .get<DailySale[]>(`/admin/sales-report?range=${range}`)
      .then(setDailySales);
  }, [range]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-24 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const totalMonthly = monthlySales.reduce((s, m) => s + m.revenue, 0);
  const avgOrderValue = stats?.totalOrders
    ? Math.round((stats.totalRevenue || 0) / stats.totalOrders)
    : 0;
  const conversionRate = stats?.totalUsers
    ? ((stats.totalOrders / stats.totalUsers) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            گزارشات
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            آمار و تحلیل فروشگاه
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon="tabler:currency-dollar"
          label="کل فروش"
          value={`${(stats?.totalRevenue || 0).toLocaleString()} تومان`}
          color="#7367F0"
        />
        <SummaryCard
          icon="tabler:clipboard-list"
          label="مجموع سفارشات"
          value={String(stats?.totalOrders || 0)}
          color="#28C76F"
        />
        <SummaryCard
          icon="tabler:receipt"
          label="میانگین ارزش سفارش"
          value={`${avgOrderValue.toLocaleString()} تومان`}
          color="#FF9F43"
        />
        <SummaryCard
          icon="tabler:trending-up"
          label="نرخ تبدیل"
          value={`${conversionRate}%`}
          color="#00BAD1"
        />
      </div>

      {/* Tabs */}
      <div
        className="flex gap-2"
        style={{ borderBottom: "1px solid var(--v-divider)" }}
      >
        {[
          { key: "overview", label: "خلاصه" },
          { key: "sales", label: "فروش" },
          { key: "products", label: "محصولات" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
            style={{
              color:
                tab === t.key ? "var(--v-primary)" : "var(--v-text-secondary)",
              borderColor: tab === t.key ? "var(--v-primary)" : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Grid */}
          <div className="lg:col-span-2 v-card p-0">
            <div
              className="px-6 py-4"
              style={{ borderBottom: "1px solid var(--v-divider)" }}
            >
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--v-text)" }}
              >
                خلاصه فروشگاه
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatItem
                  label="کل کاربران"
                  value={String(stats?.totalUsers || 0)}
                />
                <StatItem
                  label="کاربران جدید (30 روز)"
                  value={String(userReport?.newUsers || 0)}
                />
                <StatItem
                  label="کاربران فعال (30 روز)"
                  value={String(userReport?.activeUsers || 0)}
                />
                <StatItem
                  label="فروشندگان"
                  value={String(stats?.totalShops || 0)}
                />
                <StatItem
                  label="کل محصولات"
                  value={String(stats?.totalProducts || 0)}
                />
                <StatItem
                  label="کل تخفیف‌ها"
                  value={String(stats?.totalCoupons || 0)}
                />
                <StatItem
                  label="سفارشات امروز"
                  value={String(stats?.ordersToday || 0)}
                />
                <StatItem
                  label="درآمد امروز"
                  value={`${(stats?.revenueToday || 0).toLocaleString()} تومان`}
                />
              </div>
            </div>
          </div>

          {/* Low Stock */}
          <div className="v-card p-5">
            <div className="flex items-center gap-3 mb-4">
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
                  محصولات رو به اتمام
                </h3>
                <p
                  className="text-xs"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  موجودی کمتر از ۵
                </p>
              </div>
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
                {lowStock.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-1"
                  >
                    <span
                      className="text-xs truncate ml-2 flex-1"
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
        </div>
      )}

      {tab === "sales" && (
        <div className="space-y-6">
          {/* Monthly Sales Chart */}
          <div className="v-card p-0">
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--v-divider)" }}
            >
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--v-text)" }}
              >
                فروش ماهانه
              </h3>
              <span
                className="text-xs"
                style={{ color: "var(--v-text-secondary)" }}
              >
                ۱۲ ماه اخیر
              </span>
            </div>
            <div className="p-2" dir="ltr">
              <Chart
                options={{
                  chart: {
                    type: "bar",
                    toolbar: { show: false },
                    fontFamily: "inherit",
                  },
                  colors: ["#7367F0"],
                  plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
                  dataLabels: { enabled: false },
                  grid: {
                    borderColor: "var(--v-divider)",
                    padding: { left: -10, right: 0 },
                  },
                  xaxis: {
                    categories: monthlySales.map((m) => {
                      const parts = m.month.split("-");
                      return persianMonths[parseInt(parts[1]) - 1] || m.month;
                    }),
                    labels: { style: { colors: "#81858b", fontSize: "11px" } },
                  },
                  yaxis: {
                    labels: { style: { colors: "#81858b", fontSize: "11px" } },
                  },
                  tooltip: {
                    theme: "light",
                    y: {
                      formatter: (v: number) => `${v.toLocaleString()} تومان`,
                    },
                  },
                }}
                series={[
                  { name: "فروش", data: monthlySales.map((m) => m.revenue) },
                ]}
                type="bar"
                height={350}
              />
            </div>
          </div>

          {/* Daily Sales */}
          <div className="v-card p-0">
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--v-divider)" }}
            >
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--v-text)" }}
              >
                فروش روزانه
              </h3>
              <div className="flex gap-2">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setRange(d)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${range === d ? "text-white" : ""}`}
                    style={{
                      background:
                        range === d
                          ? "var(--v-primary)"
                          : "var(--v-surface-hover)",
                      color: range === d ? "#fff" : "var(--v-text-secondary)",
                    }}
                  >
                    {d} روز
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="v-table">
                <thead>
                  <tr>
                    <th>تاریخ</th>
                    <th>تعداد سفارش</th>
                    <th>فروش</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.map((d) => (
                    <tr key={d.date}>
                      <td>
                        <JalaliDate date={d.date} />
                      </td>
                      <td>{d.orders}</td>
                      <td className="font-medium">
                        {d.revenue.toLocaleString()} تومان
                      </td>
                    </tr>
                  ))}
                  {dailySales.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-8"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        داده‌ای وجود ندارد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Viewed */}
          <div className="v-card p-0">
            <div
              className="px-6 py-4"
              style={{ borderBottom: "1px solid var(--v-divider)" }}
            >
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--v-text)" }}
              >
                پربازدیدترین محصولات
              </h3>
            </div>
            <div className="p-4">
              {mostViewed.length === 0 ? (
                <p
                  className="text-xs text-center py-8"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  داده‌ای وجود ندارد
                </p>
              ) : (
                <div className="space-y-2">
                  {mostViewed.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg"
                      style={{ background: "var(--v-surface-hover)" }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i < 3 ? "" : ""}`}
                          style={{
                            background:
                              i < 3
                                ? ["#FFD700", "#C0C0C0", "#CD7F32"][i]
                                : "#e0e0e0",
                            color: i < 3 ? "#000" : "#666",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--v-text)" }}
                        >
                          {p.title}
                        </span>
                      </div>
                      <span className="text-xs font-bold">
                        {p.viewCount} بازدید
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock */}
          <div className="v-card p-0">
            <div
              className="px-6 py-4"
              style={{ borderBottom: "1px solid var(--v-divider)" }}
            >
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--v-text)" }}
              >
                محصولات رو به اتمام
              </h3>
            </div>
            <div className="p-4">
              {lowStock.length === 0 ? (
                <p
                  className="text-xs text-center py-8"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  همه محصولات موجودی کافی دارند
                </p>
              ) : (
                <div className="space-y-1">
                  {lowStock.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg"
                      style={{ background: "var(--v-surface-hover)" }}
                    >
                      <span
                        className="text-xs"
                        style={{ color: "var(--v-text)" }}
                      >
                        {p.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.stock === 0 ? "bg-red-500" : "bg-amber-500"}`}
                            style={{ width: `${Math.min(p.stock * 20, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold ${p.stock === 0 ? "text-red-500" : "text-amber-500"}`}
                        >
                          {p.stock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="v-card p-5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}1e` }}
        >
          <Icon icon={icon} className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--v-text-secondary)" }}>
            {label}
          </p>
          <p
            className="text-base font-bold mt-0.5"
            style={{ color: "var(--v-text)" }}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--v-text-secondary)" }}>
        {label}
      </p>
      <p className="text-lg font-bold mt-1" style={{ color: "var(--v-text)" }}>
        {value}
      </p>
    </div>
  );
}
