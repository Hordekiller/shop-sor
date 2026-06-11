"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import { toJalaliHuman } from "@/lib/date";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  items: { id: number; quantity: number }[];
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  pending: "در انتظار",
  confirmed: "تایید شده",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

const statusColors: Record<string, string> = {
  pending: "rgba(255,159,67,0.12)",
  confirmed: "rgba(0,186,209,0.12)",
  processing: "rgba(115,103,240,0.12)",
  shipped: "rgba(128,131,144,0.12)",
  delivered: "rgba(40,199,111,0.12)",
  cancelled: "rgba(255,76,81,0.12)",
};

const statTextColors: Record<string, string> = {
  pending: "#FF9F43",
  confirmed: "#00BAD1",
  processing: "#7367F0",
  shipped: "#808390",
  delivered: "#28C76F",
  cancelled: "#FF4C51",
};

const quickLinks = [
  {
    label: "سفارشات من",
    href: "/panel/orders",
    icon: "tabler:shopping-cart",
    desc: "مشاهده و پیگیری سفارشات",
    color: "#7367F0",
  },
  {
    label: "کیف پول",
    href: "/panel/wallet",
    icon: "tabler:wallet",
    desc: "مدیریت کیف پول و تراکنش‌ها",
    color: "#FF9F43",
  },
  {
    label: "علاقه‌مندی‌ها",
    href: "/panel/wishlist",
    icon: "tabler:heart",
    desc: "محصولات مورد علاقه",
    color: "#FF4C51",
  },
  {
    label: "آدرس‌ها",
    href: "/panel/addresses",
    icon: "tabler:map-pin",
    desc: "مدیریت آدرس‌های تحویل",
    color: "#28C76F",
  },
  {
    label: "اطلاعات حساب",
    href: "/panel/profile",
    icon: "tabler:user",
    desc: "ویرایش اطلاعات شخصی",
    color: "#00BAD1",
  },
];

export default function PanelDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    walletBalance: 0,
    wishlistCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api
        .get<{ data: Order[]; total: number }>("/orders?take=5")
        .catch(() => ({ data: [], total: 0 })),
      api
        .get<{ balance: number }>("/wallet/balance")
        .catch(() => ({ balance: 0 })),
      api.get<any[]>("/wishlist").catch(() => []),
    ])
      .then(([ordersRes, wallet, wishlist]) => {
        const orders = ordersRes.data;
        setRecentOrders(orders.slice(0, 5));
        setStats({
          totalOrders: ordersRes.total || orders.length,
          totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
          walletBalance: wallet.balance || 0,
          wishlistCount: Array.isArray(wishlist) ? wishlist.length : 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-24 rounded-2xl animate-pulse"
              style={{ background: "#e5e7eb" }}
            />
          ))}
        </div>
        <div
          className="h-48 rounded-2xl animate-pulse"
          style={{ background: "#e5e7eb" }}
        />
      </div>
    );
  }

  const statCards = [
    {
      label: "کل سفارشات",
      value: stats.totalOrders,
      icon: "tabler:shopping-cart",
      color: "#7367F0",
      bg: "rgba(115,103,240,0.12)",
    },
    {
      label: "مجموع خرید",
      value: `${stats.totalSpent.toLocaleString()} تومان`,
      icon: "tabler:currency-dollar",
      color: "#28C76F",
      bg: "rgba(40,199,111,0.12)",
    },
    {
      label: "کیف پول",
      value: `${stats.walletBalance.toLocaleString()} تومان`,
      icon: "tabler:wallet",
      color: "#FF9F43",
      bg: "rgba(255,159,67,0.12)",
    },
    {
      label: "علاقه‌مندی‌ها",
      value: stats.wishlistCount,
      icon: "tabler:heart",
      color: "#FF4C51",
      bg: "rgba(255,76,81,0.12)",
    },
  ];

  return (
    <div className="animate-fade-in">
      <h1
        className="text-xl font-bold mb-1"
        style={{ color: "var(--dk-text)" }}
      >
        داشبورد
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--dk-text-light)" }}>
        خلاصه فعالیت‌های حساب شما
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-4 border border-[var(--dk-border)] bg-white"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: card.bg }}
              >
                <Icon
                  icon={card.icon}
                  className="w-5 h-5"
                  style={{ color: card.color }}
                />
              </div>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--dk-text)" }}
            >
              {card.value}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--dk-text-light)" }}
            >
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl p-4 border bg-white transition hover:shadow-md"
            style={{ borderColor: "var(--dk-border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${link.color}15` }}
            >
              <Icon
                icon={link.icon}
                className="w-5 h-5"
                style={{ color: link.color }}
              />
            </div>
            <p className="font-medium text-sm">{link.label}</p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--dk-text-light)" }}
            >
              {link.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-[var(--dk-border)] bg-white">
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <h2 className="font-bold text-sm">آخرین سفارشات</h2>
          <Link
            href="/panel/orders"
            style={{ color: "var(--dk-primary)" }}
            className="text-xs font-medium"
          >
            مشاهده همه
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Icon
              icon="tabler:shopping-cart-off"
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: "var(--dk-text-light)" }}
            />
            <p className="text-sm" style={{ color: "var(--dk-text-light)" }}>
              هنوز سفارشی ثبت نکرده‌اید.
            </p>
            <Link
              href="/products"
              className="inline-block mt-3 px-5 py-2 rounded-xl text-sm text-white font-medium"
              style={{ background: "var(--dk-primary)" }}
            >
              شروع خرید
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--dk-border)" }}>
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/panel/orders/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="text-sm font-medium">{order.orderNumber}</p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--dk-text-light)" }}
                  >
                    {toJalaliHuman(order.createdAt)}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">
                    {order.total.toLocaleString()} تومان
                  </p>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs mt-1 font-medium"
                    style={{
                      background:
                        statusColors[order.status] || "rgba(128,131,144,0.12)",
                      color: statTextColors[order.status] || "#808390",
                    }}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
