"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { toJalaliHuman } from "@/lib/date";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox } from "@fortawesome/free-solid-svg-icons";

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
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    api
      .get<{ data: Order[]; total: number }>("/orders")
      .then((d) => setOrders(d.data))
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="dk-container py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="dk-card p-6 h-20" />
            ))}
          </div>
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
          <Link href="/profile" className="hover:text-[var(--dk-primary)]">
            پروفایل
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--dk-text)]">سفارشات</span>
        </nav>

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold">سفارشات من</h1>
          <Link
            href="/profile"
            className="text-sm"
            style={{ color: "var(--dk-primary)" }}
          >
            پروفایل
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 dk-card p-8">
            <FontAwesomeIcon icon={faBox} className="text-5xl mb-4 block" />
            <p className="text-[var(--dk-text-light)] mb-6">
              هنوز سفارشی ثبت نکرده‌اید.
            </p>
            <Link
              href="/products"
              className="dk-btn-primary inline-block text-sm"
            >
              مشاهده محصولات
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block dk-card p-4 hover:border-[var(--dk-primary)] transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-[var(--dk-text-light)] mt-1">
                      {toJalaliHuman(order.createdAt)}
                    </p>
                    <p className="text-xs text-[var(--dk-text-light)] mt-0.5">
                      {order.items.length} قلم کالا
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="dk-price text-sm">
                      {order.total.toLocaleString()} تومان
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${statusColors[order.status] || "bg-gray-100"}`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
