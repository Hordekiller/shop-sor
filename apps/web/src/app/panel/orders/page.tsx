"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const statusTextColors: Record<string, string> = {
  pending: "#FF9F43",
  confirmed: "#00BAD1",
  processing: "#7367F0",
  shipped: "#808390",
  delivered: "#28C76F",
  cancelled: "#FF4C51",
};

export default function PanelOrders() {
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
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-20 rounded-2xl animate-pulse"
            style={{ background: "#e5e7eb" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1
        className="text-xl font-bold mb-1"
        style={{ color: "var(--dk-text)" }}
      >
        سفارشات من
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--dk-text-light)" }}>
        مشاهده و پیگیری وضعیت سفارشات
      </p>

      {orders.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl border bg-white"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <Icon
            icon="tabler:shopping-cart-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--dk-text-light)" }}
          />
          <p className="text-sm mb-4" style={{ color: "var(--dk-text-light)" }}>
            هنوز سفارشی ثبت نکرده‌اید.
          </p>
          <Link
            href="/products"
            className="inline-block px-5 py-2.5 rounded-xl text-sm text-white font-medium"
            style={{ background: "var(--dk-primary)" }}
          >
            مشاهده محصولات
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/panel/orders/${order.id}`}
              className="block rounded-2xl border bg-white p-4 transition hover:shadow-sm"
              style={{ borderColor: "var(--dk-border)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        statusColors[order.status] || "rgba(128,131,144,0.12)",
                    }}
                  >
                    <Icon
                      icon={
                        order.status === "delivered"
                          ? "tabler:circle-check"
                          : order.status === "cancelled"
                            ? "tabler:circle-x"
                            : "tabler:truck"
                      }
                      className="w-5 h-5"
                      style={{
                        color: statusTextColors[order.status] || "#808390",
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--dk-text-light)" }}
                    >
                      {toJalaliHuman(order.createdAt)}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--dk-text-light)" }}
                    >
                      {order.items.length} قلم کالا
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">
                    {order.total.toLocaleString()} تومان
                  </p>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs mt-1 font-medium"
                    style={{
                      background:
                        statusColors[order.status] || "rgba(128,131,144,0.12)",
                      color: statusTextColors[order.status] || "#808390",
                    }}
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
  );
}
