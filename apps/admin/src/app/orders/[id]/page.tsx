"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import JalaliDate from "@/components/JalaliDate";

interface OrderItem {
  id: number;
  productId: number;
  title: string;
  variantName?: string | null;
  quantity: number;
  price: number;
}

interface Payment {
  id: number;
  amount: number;
  status: string;
  gateway: string | null;
  referenceId: string | null;
  paidAt: string | null;
}

interface Address {
  id: number;
  title: string;
  receiverName: string;
  phone: string;
  province: string;
  city: string;
  addressText: string;
  postalCode: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  taxAmount: number;
  total: number;
  shippingMethod: string | null;
  trackingCode: string | null;
  address: Address | null;
  notes: string | null;
  user: { id: number; name: string; email: string; phone: string | null };
  items: OrderItem[];
  payments: Payment[];
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
}

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];
const statusLabels: Record<string, string> = {
  pending: "در انتظار",
  confirmed: "تایید شده",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  returned: "مرجوعی",
};
const statusColors: Record<string, string> = {
  pending: "v-badge v-badge-warning",
  confirmed: "v-badge v-badge-info",
  processing: "v-badge",
  shipped: "v-badge v-badge-secondary",
  delivered: "v-badge v-badge-success",
  cancelled: "v-badge v-badge-error",
  returned: "v-badge v-badge-error",
};
const paymentStatusLabels: Record<string, string> = {
  unpaid: "پرداخت نشده",
  paid: "پرداخت شده",
  refunded: "مسترد شده",
};
const shippingLabels: Record<string, string> = {
  post_pishtaz: "پست پیشتاز",
  post_sefareshi: "پست سفارشی",
  tipax: "تیپاکس",
  mahax: "ماهکس",
  snapp_box: "اسنپ باکس",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");

  const fetchOrder = () => {
    api
      .get<Order>(`/orders/${id}`)
      .then((o) => {
        setOrder(o);
        setTrackingInput(o.trackingCode || "");
      })
      .catch(() => router.push("/orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatus = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await api.put(`/orders/${id}/status`, {
        status: newStatus,
        trackingCode: trackingInput || undefined,
      });
      fetchOrder();
    } catch (err: any) {
      alert(err?.message || err);
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-lg animate-pulse"
            style={{ background: "var(--v-bg)" }}
          />
        ))}
      </div>
    );
  if (!order)
    return (
      <div className="v-card p-12 text-center">
        <Icon
          icon="tabler:shopping-cart-off"
          className="w-12 h-12 mx-auto mb-3"
          style={{ color: "var(--v-text-disabled)" }}
        />
        <p style={{ color: "var(--v-text-secondary)" }}>سفارش یافت نشد.</p>
      </div>
    );

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const isCancelled =
    order.status === "cancelled" || order.status === "returned";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            جزئیات سفارش
          </h1>
          <p
            className="text-sm mt-1 flex items-center gap-2"
            style={{ color: "var(--v-text-secondary)" }}
          >
            {order.orderNumber}
            <span className={statusColors[order.status]}>
              {statusLabels[order.status]}
            </span>
          </p>
        </div>
        <a href="/orders" className="v-btn v-btn-secondary">
          <Icon icon="tabler:arrow-right" className="w-4 h-4" />
          بازگشت
        </a>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="v-card mb-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 px-1">
            {STATUS_FLOW.map((s, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        active
                          ? "ring-2 ring-offset-2 ring-[var(--v-primary)]"
                          : ""
                      }`}
                      style={{
                        background: done ? "var(--v-primary)" : "var(--v-bg)",
                        color: done ? "white" : "var(--v-text-disabled)",
                      }}
                    >
                      {done ? (
                        <Icon icon="tabler:check" className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-xs whitespace-nowrap ${done ? "font-medium" : ""}`}
                      style={{
                        color: done
                          ? "var(--v-text)"
                          : "var(--v-text-disabled)",
                      }}
                    >
                      {statusLabels[s]}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div
                      className="h-0.5 flex-1 min-w-[20px] rounded-full"
                      style={{
                        background:
                          i < currentIdx
                            ? "var(--v-primary)"
                            : "var(--v-border)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div
          className="v-card mb-6 p-6 text-center"
          style={{ borderColor: "var(--v-error)" }}
        >
          <Icon
            icon="tabler:alert-triangle"
            className="w-10 h-10 mx-auto mb-2"
            style={{ color: "var(--v-error)" }}
          />
          <p className="font-bold" style={{ color: "var(--v-error)" }}>
            {statusLabels[order.status]}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="v-card p-0 overflow-hidden">
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: "var(--v-border)" }}
            >
              <h3 className="font-bold">اقلام سفارش</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="v-table">
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>تنوع</th>
                    <th>قیمت</th>
                    <th>تعداد</th>
                    <th className="text-left">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.title}</td>
                      <td style={{ color: "var(--v-text-secondary)" }}>
                        {item.variantName || "—"}
                      </td>
                      <td>{item.price.toLocaleString()}</td>
                      <td>{item.quantity}</td>
                      <td className="text-left font-medium">
                        {(item.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Change Status */}
          <div className="v-card">
            <div
              className="pb-3 border-b"
              style={{ borderColor: "var(--v-border)" }}
            >
              <h3 className="font-bold text-base flex items-center gap-2">
                <Icon
                  icon="tabler:chevron-up-down"
                  className="w-4 h-4"
                  style={{ color: "var(--v-primary)" }}
                />
                تغییر وضعیت
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              {/* Tracking Code */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  کد رهگیری مرسوله
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="v-input flex-1"
                    dir="ltr"
                    placeholder="مثال: 1234567890"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                  />
                  <button
                    onClick={() => handleStatus(order.status)}
                    disabled={changingStatus}
                    className="v-btn v-btn-secondary v-btn-sm whitespace-nowrap"
                  >
                    <Icon icon="tabler:device-floppy" className="w-4 h-4" />
                    ذخیره کد
                  </button>
                </div>
              </div>
              {/* Status buttons */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleStatus(key)}
                    disabled={changingStatus || key === order.status}
                    className={`v-btn v-btn-sm ${key === order.status ? "v-btn-secondary" : ""}`}
                    style={
                      key === order.status
                        ? {}
                        : {
                            color: "var(--v-primary)",
                            background: "rgba(115,103,240,0.08)",
                          }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="v-card">
            <div
              className="pb-3 border-b flex items-center gap-2"
              style={{ borderColor: "var(--v-border)" }}
            >
              <Icon
                icon="tabler:user"
                className="w-4 h-4"
                style={{ color: "var(--v-primary)" }}
              />
              <h3 className="font-bold text-sm">مشتری</h3>
            </div>
            <div className="pt-4 text-sm space-y-2">
              <p>
                <span style={{ color: "var(--v-text-secondary)" }}>نام:</span>{" "}
                {order.user?.name}
              </p>
              <p>
                <span style={{ color: "var(--v-text-secondary)" }}>ایمیل:</span>{" "}
                {order.user?.email}
              </p>
              <p>
                <span style={{ color: "var(--v-text-secondary)" }}>
                  موبایل:
                </span>{" "}
                {order.user?.phone || "—"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="v-card">
            <div
              className="pb-3 border-b flex items-center gap-2"
              style={{ borderColor: "var(--v-border)" }}
            >
              <Icon
                icon="tabler:info-circle"
                className="w-4 h-4"
                style={{ color: "var(--v-primary)" }}
              />
              <h3 className="font-bold text-sm">وضعیت</h3>
            </div>
            <div className="pt-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span style={{ color: "var(--v-text-secondary)" }}>
                  وضعیت سفارش
                </span>
                <span className={statusColors[order.status]}>
                  {statusLabels[order.status]}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--v-text-secondary)" }}>پرداخت</span>
                <span
                  style={{
                    color:
                      order.paymentStatus === "paid"
                        ? "var(--v-success)"
                        : "var(--v-warning)",
                  }}
                >
                  {paymentStatusLabels[order.paymentStatus] ||
                    order.paymentStatus}
                </span>
              </div>
              {order.paymentMethod && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--v-text-secondary)" }}>
                    روش پرداخت
                  </span>
                  <span>
                    {order.paymentMethod === "wallet"
                      ? "کیف پول"
                      : order.paymentMethod === "zarinpal"
                        ? "زرین‌پال"
                        : order.paymentMethod}
                  </span>
                </div>
              )}
              {order.trackingCode && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--v-text-secondary)" }}>
                    کد رهگیری
                  </span>
                  <span dir="ltr" className="font-mono text-xs">
                    {order.trackingCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Financial */}
          <div className="v-card">
            <div
              className="pb-3 border-b flex items-center gap-2"
              style={{ borderColor: "var(--v-border)" }}
            >
              <Icon
                icon="tabler:currency-dollar"
                className="w-4 h-4"
                style={{ color: "var(--v-primary)" }}
              />
              <h3 className="font-bold text-sm">مالی</h3>
            </div>
            <div className="pt-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span style={{ color: "var(--v-text-secondary)" }}>
                  زیرمجموع
                </span>
                <span>{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--v-text-secondary)" }}>
                  حمل و نقل
                </span>
                <span>
                  {order.shippingCost === 0
                    ? "رایگان"
                    : `${order.shippingCost.toLocaleString()} ریال`}
                </span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--v-text-secondary)" }}>
                    مالیات بر ارزش افزوده
                  </span>
                  <span>{order.taxAmount.toLocaleString()}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div
                  className="flex justify-between"
                  style={{ color: "var(--v-success)" }}
                >
                  <span>تخفیف</span>
                  <span>-{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div
                className="flex justify-between font-bold border-t pt-2"
                style={{ borderColor: "var(--v-border)" }}
              >
                <span>مجموع</span>
                <span style={{ color: "var(--v-primary)" }}>
                  {order.total.toLocaleString()} ریال
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="v-card">
            <div
              className="pb-3 border-b flex items-center gap-2"
              style={{ borderColor: "var(--v-border)" }}
            >
              <Icon
                icon="tabler:clock"
                className="w-4 h-4"
                style={{ color: "var(--v-primary)" }}
              />
              <h3 className="font-bold text-sm">زمان‌بندی</h3>
            </div>
            <div className="pt-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span style={{ color: "var(--v-text-secondary)" }}>
                  ثبت سفارش
                </span>
                <span className="text-xs">
                  <JalaliDate date={order.createdAt} showTime />
                </span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--v-text-secondary)" }}>
                    پرداخت
                  </span>
                  <span className="text-xs">
                    <JalaliDate date={order.paidAt} showTime />
                  </span>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--v-text-secondary)" }}>
                    تحویل
                  </span>
                  <span className="text-xs">
                    <JalaliDate date={order.deliveredAt} showTime />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping */}
          {order.shippingMethod && (
            <div className="v-card">
              <div
                className="pb-3 border-b flex items-center gap-2"
                style={{ borderColor: "var(--v-border)" }}
              >
                <Icon
                  icon="tabler:truck"
                  className="w-4 h-4"
                  style={{ color: "var(--v-primary)" }}
                />
                <h3 className="font-bold text-sm">ارسال</h3>
              </div>
              <div className="pt-4 text-sm space-y-2">
                <p>
                  {shippingLabels[order.shippingMethod] || order.shippingMethod}
                </p>
                {order.address && (
                  <div>
                    <p className="font-medium">
                      {order.address.receiverName} — {order.address.phone}
                    </p>
                    <p style={{ color: "var(--v-text-secondary)" }}>
                      {order.address.province}، {order.address.city}،{" "}
                      {order.address.addressText}
                    </p>
                    <p style={{ color: "var(--v-text-secondary)" }}>
                      کد پستی: {order.address.postalCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {order.notes && (
            <div className="v-card">
              <div
                className="pb-3 border-b flex items-center gap-2"
                style={{ borderColor: "var(--v-border)" }}
              >
                <Icon
                  icon="tabler:note"
                  className="w-4 h-4"
                  style={{ color: "var(--v-primary)" }}
                />
                <h3 className="font-bold text-sm">توضیحات</h3>
              </div>
              <div
                className="pt-4 text-sm"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {order.notes}
              </div>
            </div>
          )}

          {/* Payments */}
          {order.payments?.length > 0 && (
            <div className="v-card">
              <div
                className="pb-3 border-b flex items-center gap-2"
                style={{ borderColor: "var(--v-border)" }}
              >
                <Icon
                  icon="tabler:credit-card"
                  className="w-4 h-4"
                  style={{ color: "var(--v-primary)" }}
                />
                <h3 className="font-bold text-sm">پرداخت‌ها</h3>
              </div>
              <div className="pt-4 text-sm space-y-3">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{p.gateway || "—"}</p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        {p.referenceId && `رف: ${p.referenceId}`}{" "}
                        {p.paidAt && <JalaliDate date={p.paidAt} showTime />}
                      </p>
                    </div>
                    <span
                      className={
                        p.status === "completed"
                          ? "v-badge v-badge-success"
                          : "v-badge v-badge-warning"
                      }
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice */}
          <button
            onClick={() =>
              window.open(`/api/orders/${order.id}/invoice`, "_blank")
            }
            className="v-btn v-btn-secondary w-full"
          >
            <Icon icon="tabler:file-text" className="w-4 h-4" />
            دانلود فاکتور
          </button>
        </div>
      </div>
    </div>
  );
}
