"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { api, API_URL } from "@/lib/api";
import { toJalaliHuman } from "@/lib/date";

const statusLabels: Record<string, string> = {
  pending: "در انتظار",
  confirmed: "تایید شده",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

const statusBadgeColors: Record<string, string> = {
  pending: "#FF9F43",
  confirmed: "#00BAD1",
  processing: "#7367F0",
  shipped: "#808390",
  delivered: "#28C76F",
  cancelled: "#FF4C51",
};

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  vendorId?: number;
  vendorName?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  shippingCost: number;
  discount: number;
  taxAmount: number;
  createdAt: string;
  items: OrderItem[];
  shippingAddress?: string;
  paymentMethod?: string;
  notes?: string;
  trackingCode?: string;
  shippingMethod?: string;
  subtotal?: number;
}

export default function PanelOrderDetail() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    api
      .get<Order>(`/orders/${params.id}`)
      .then(setOrder)
      .catch(() => router.push("/panel/orders"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div
          className="h-8 w-48 rounded-xl animate-pulse"
          style={{ background: "#e5e7eb" }}
        />
        <div
          className="h-64 rounded-2xl animate-pulse"
          style={{ background: "#e5e7eb" }}
        />
      </div>
    );
  }

  if (!order) return null;

  const statusColor = statusBadgeColors[order.status] || "#808390";

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/panel/orders"
        className="inline-flex items-center gap-1.5 text-sm mb-4 hover:opacity-70"
        style={{ color: "var(--dk-primary)" }}
      >
        <Icon icon="tabler:arrow-right" className="w-4 h-4" />
        بازگشت به سفارشات
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--dk-text)" }}>
            {order.orderNumber}
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--dk-text-light)" }}>
            ثبت شده در {toJalaliHuman(order.createdAt)}
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: `${statusColor}15`, color: statusColor }}
        >
          {statusLabels[order.status] || order.status}
        </span>
      </div>

      {/* Items */}
      <div
        className="rounded-2xl border bg-white mb-4"
        style={{ borderColor: "var(--dk-border)" }}
      >
        <div
          className="p-4 border-b font-medium text-sm"
          style={{ borderColor: "var(--dk-border)" }}
        >
          کالاهای سفارش
        </div>
        <div className="divide-y" style={{ borderColor: "var(--dk-border)" }}>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <Link
                  href={`/products/${item.productId}`}
                  className="text-sm font-medium hover:text-[var(--dk-primary)]"
                >
                  {item.productName}
                </Link>
                {item.vendorName && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--dk-text-light)" }}
                  >
                    فروشنده: {item.vendorName}
                  </p>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm">
                  {item.unitPrice.toLocaleString()} تومان
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--dk-text-light)" }}
                >
                  x {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div
        className="rounded-2xl border bg-white p-4 mb-4"
        style={{ borderColor: "var(--dk-border)" }}
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--dk-text-light)" }}>جمع کالاها</span>
            <span>
              {(
                order.total -
                order.shippingCost -
                order.taxAmount +
                order.discount
              ).toLocaleString()}{" "}
              تومان
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span style={{ color: "var(--dk-text-light)" }}>تخفیف</span>
              <span style={{ color: "#28C76F" }}>
                -{order.discount.toLocaleString()} تومان
              </span>
            </div>
          )}
          {order.taxAmount > 0 && (
            <div className="flex justify-between">
              <span style={{ color: "var(--dk-text-light)" }}>
                مالیات بر ارزش افزوده
              </span>
              <span>{order.taxAmount.toLocaleString()} تومان</span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: "var(--dk-text-light)" }}>هزینه ارسال</span>
            <span>
              {order.shippingCost > 0
                ? `${order.shippingCost.toLocaleString()} تومان`
                : "رایگان"}
            </span>
          </div>
          <div
            className="flex justify-between font-bold pt-2 border-t"
            style={{ borderColor: "var(--dk-border)" }}
          >
            <span>مجموع</span>
            <span>{order.total.toLocaleString()} تومان</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div
        className="rounded-2xl border bg-white p-4 mb-4"
        style={{ borderColor: "var(--dk-border)" }}
      >
        <div className="space-y-3 text-sm">
          <div className="flex gap-2">
            <Icon
              icon="tabler:map-pin"
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "var(--dk-text-light)" }}
            />
            <span>{order.shippingAddress || "—"}</span>
          </div>
          <div className="flex gap-2">
            <Icon
              icon="tabler:credit-card"
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "var(--dk-text-light)" }}
            />
            <span>{order.paymentMethod || "—"}</span>
          </div>
          {order.shippingMethod && (
            <div className="flex gap-2">
              <Icon
                icon="tabler:truck"
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "var(--dk-text-light)" }}
              />
              <span>روش ارسال: {order.shippingMethod}</span>
            </div>
          )}
          {order.trackingCode && (
            <div className="flex gap-2">
              <Icon
                icon="tabler:package"
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "var(--dk-text-light)" }}
              />
              <span>
                کد رهگیری:{" "}
                <span dir="ltr" className="font-medium">
                  {order.trackingCode}
                </span>
              </span>
            </div>
          )}
          {order.notes && (
            <div className="flex gap-2">
              <Icon
                icon="tabler:note"
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "var(--dk-text-light)" }}
              />
              <span>{order.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={async () => {
            const token = localStorage.getItem("web_token");
            try {
              const res = await fetch(
                `${API_URL}/invoices/${order.id}/download`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              if (!res.ok) throw new Error("Download failed");
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `invoice-${order.orderNumber}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (e) {
              alert("خطا در دانلود فاکتور");
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition hover:bg-gray-50"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <Icon icon="tabler:file-text" className="w-4 h-4" />
          دانلود فاکتور PDF
        </button>
        {(order.status === "delivered" || order.status === "cancelled") &&
          order.items.length > 0 && (
            <a
              href={`/products/${order.items[0].productId}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90 text-white"
              style={{ background: "var(--dk-primary)" }}
            >
              <Icon icon="tabler:refresh" className="w-4 h-4" />
              خرید مجدد
            </a>
          )}
      </div>
    </div>
  );
}
