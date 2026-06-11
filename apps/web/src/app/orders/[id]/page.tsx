"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, API_URL } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import Header from "@/components/Header";
import { toJalaliHuman } from "@/lib/date";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faCheck,
  faTruck,
  faHourglassHalf,
  faXmark,
  faCreditCard,
  faMapMarkerAlt,
  faHome,
  faBriefcase,
  faStar,
  faTimes,
  faChevronLeft,
  faPen,
} from "@fortawesome/free-solid-svg-icons";

interface OrderItem {
  id: number;
  productId: number;
  title: string;
  slug: string;
  quantity: number;
  price: number;
  total: number;
  image: string;
  variantName?: string;
}

interface Payment {
  id: number;
  amount: number;
  status: string;
  gateway: string | null;
  referenceId: string | null;
  paidAt: string | null;
  createdAt: string;
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
  isDefault: boolean;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  taxAmount: number;
  total: number;
  shippingMethod: string | null;
  notes: string | null;
  items: OrderItem[];
  payments: Payment[];
  address: Address | null;
  createdAt: string;
  paidAt: string | null;
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

const statusIcon: Record<string, any> = {
  pending: faHourglassHalf,
  confirmed: faCheck,
  processing: faBox,
  shipped: faTruck,
  delivered: faCheck,
  cancelled: faXmark,
};

const timelineSteps = [
  { key: "pending", label: "ثبت سفارش" },
  { key: "confirmed", label: "تایید" },
  { key: "processing", label: "پردازش" },
  { key: "shipped", label: "ارسال" },
  { key: "delivered", label: "تحویل" },
];

const shippingLabels: Record<string, string> = {
  post_pishtaz: "پست پیشتاز",
  post_sefareshi: "پست سفارشی",
  tipax: "تیپاکس",
  mahax: "ماهکس",
  snapp_box: "اسنپ باکس",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  failed: "ناموفق",
  refunded: "مسترد شده",
};

const cancellableStatuses = ["pending", "confirmed"];

function imgUrl(path: string | null | undefined) {
  if (!path) return "https://placehold.co/80x80/e2e8f0/94a3b8?text=No+Image";
  return mediaUrl(path);
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = () => {
    setLoading(true);
    api
      .get<any>(`/orders/${id}`)
      .then((data) => {
        function imgPath(p: any): string {
          if (!p) return "";
          if (typeof p === "string") {
            try {
              const parsed = JSON.parse(p);
              return Array.isArray(parsed) ? parsed[0] || "" : p;
            } catch {
              return p;
            }
          }
          return Array.isArray(p) ? p[0] || "" : "";
        }
        const mapped: Order = {
          ...data,
          items: (data.items || []).map((item: any) => ({
            id: item.id,
            productId: item.productId,
            title: item.product?.title || "",
            slug: item.product?.slug || "",
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            image: imgPath(item.product?.images),
            variantName: item.variantName || item.variant?.name || undefined,
          })),
        };
        setOrder(mapped);
      })
      .catch(() => router.push("/orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchOrder();
  }, [id, router]);

  const currentStepIndex = order
    ? timelineSteps.findIndex((s) => s.key === order.status)
    : -1;
  const isCancelled = order?.status === "cancelled";
  const canCancel = order && cancellableStatuses.includes(order.status);

  const handleCancel = async () => {
    if (!confirm("آیا از لغو این سفارش اطمینان دارید؟")) return;
    setCancelling(true);
    try {
      await api.put(`/orders/${order!.id}/cancel`, {});
      fetchOrder();
    } catch {
      alert("خطا در لغو سفارش");
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="dk-container py-8">
          <div className="animate-pulse dk-card p-6 h-64" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className="dk-container py-12 text-center text-[var(--dk-text-light)]">
          سفارش یافت نشد.
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
          <Link href="/orders" className="hover:text-[var(--dk-primary)]">
            سفارشات
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-[var(--dk-text)]">{order.orderNumber}</span>
        </nav>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {/* Header */}
            <div className="dk-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-bold text-lg">{order.orderNumber}</h1>
                  <p className="text-xs text-[var(--dk-text-light)] mt-1">
                    {toJalaliHuman(order.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status] || "bg-gray-100"}`}
                >
                  <FontAwesomeIcon
                    icon={statusIcon[order.status] || faBox}
                    className="ml-1.5 w-3 h-3"
                  />
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
            </div>

            {/* Timeline */}
            {!isCancelled && (
              <div className="dk-card p-5">
                <div className="relative flex items-center justify-between">
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-[var(--dk-bg)] -translate-y-1/2" />
                  {currentStepIndex >= 0 && (
                    <div
                      className="absolute top-4 right-4 h-0.5 bg-[var(--dk-primary)] -translate-y-1/2 transition-all"
                      style={{
                        width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%`,
                        right: "1rem",
                      }}
                    />
                  )}
                  {timelineSteps.map((step, i) => {
                    const done = i <= currentStepIndex;
                    const current = i === currentStepIndex;
                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center z-10"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                            done
                              ? "bg-[var(--dk-primary)] text-white"
                              : "bg-[var(--dk-bg)] text-[var(--dk-text-light)]"
                          }`}
                        >
                          {done ? (
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="w-3.5 h-3.5"
                            />
                          ) : (
                            i + 1
                          )}
                        </div>
                        <span
                          className={`text-[10px] mt-1.5 text-center leading-tight ${current ? "font-bold text-[var(--dk-primary)]" : done ? "text-[var(--dk-text)]" : "text-[var(--dk-text-light)]"}`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isCancelled && (
              <div className="dk-card p-5 border-red-200 bg-red-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="w-5 h-5 text-red-500"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-red-700">
                      سفارش لغو شد
                    </p>
                    <p className="text-xs text-red-500 mt-0.5">
                      این سفارش در تاریخ {toJalaliHuman(order.createdAt)} لغو
                      شده است.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="dk-card p-5">
              <h3 className="font-bold text-sm mb-4">اقلام سفارش</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-3 border-b border-[var(--dk-border)] last:border-0"
                  >
                    <Link href={`/products/${item.slug}`} className="shrink-0">
                      <img
                        src={imgUrl(item.image)}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover bg-[var(--dk-bg)]"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="text-sm font-medium hover:text-[var(--dk-primary)] transition line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      {item.variantName && (
                        <p className="text-[11px] text-[var(--dk-text-light)] mt-0.5">
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-xs text-[var(--dk-text-light)] mt-1">
                        تعداد: {item.quantity}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-bold">
                        {(item.price * item.quantity).toLocaleString()} تومان
                      </p>
                      {order.status === "delivered" && (
                        <Link
                          href={`/products/${item.slug}#reviews`}
                          className="inline-flex items-center gap-1 text-xs mt-1.5 text-[var(--dk-primary)] hover:underline"
                        >
                          <FontAwesomeIcon
                            icon={faPen}
                            className="w-2.5 h-2.5"
                          />
                          ثبت نظر
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            {order.address && (
              <div className="dk-card p-5">
                <h3 className="font-bold text-sm mb-3">
                  <FontAwesomeIcon
                    icon={faMapMarkerAlt}
                    className="ml-1.5 w-4 h-4"
                  />
                  آدرس تحویل
                </h3>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        order.address.title === "خانه"
                          ? "bg-blue-100 text-blue-600"
                          : order.address.title === "محل کار"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={
                          order.address.title === "خانه"
                            ? faHome
                            : order.address.title === "محل کار"
                              ? faBriefcase
                              : faMapMarkerAlt
                        }
                        className="w-3 h-3"
                      />
                      {order.address.title}
                    </span>
                  </div>
                  <p className="font-medium">
                    {order.address.receiverName} | {order.address.phone}
                  </p>
                  <p className="text-xs text-[var(--dk-text-light)]">
                    {order.address.province}، {order.address.city}
                  </p>
                  <p className="text-xs text-[var(--dk-text-light)]">
                    {order.address.addressText}
                  </p>
                  <p className="text-xs text-[var(--dk-text-light)]">
                    کد پستی: {order.address.postalCode}
                  </p>
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="dk-card p-5">
              <h3 className="font-bold text-sm mb-3">
                <FontAwesomeIcon
                  icon={faCreditCard}
                  className="ml-1.5 w-4 h-4"
                />
                اطلاعات پرداخت
              </h3>
              {order.payments.length === 0 ? (
                <p className="text-sm text-[var(--dk-text-light)]">
                  پرداختی ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-3">
                  {order.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-sm py-2 border-b border-[var(--dk-border)] last:border-0"
                    >
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : p.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : p.status === "refunded"
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {paymentStatusLabels[p.status] || p.status}
                        </span>
                        {p.gateway && (
                          <span className="text-xs text-[var(--dk-text-light)] mr-2">
                            {p.gateway}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">
                          {p.amount.toLocaleString()} تومان
                        </p>
                        {p.referenceId && (
                          <p className="text-[10px] text-[var(--dk-text-light)]">
                            کد پیگیری: {p.referenceId}
                          </p>
                        )}
                        {p.paidAt && (
                          <p className="text-[10px] text-[var(--dk-text-light)]">
                            {toJalaliHuman(p.paidAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Summary */}
            <div className="dk-card p-5 space-y-3 sticky top-24">
              <h3 className="font-bold text-sm">خلاصه سفارش</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--dk-text-light)]">زیرمجموع</span>
                  <span>{order.subtotal.toLocaleString()} تومان</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--dk-text-light)]">حمل و نقل</span>
                  <span>
                    {order.shippingCost === 0
                      ? "رایگان"
                      : `${order.shippingCost.toLocaleString()} تومان`}
                  </span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--dk-text-light)]">
                      مالیات بر ارزش افزوده
                    </span>
                    <span>{order.taxAmount.toLocaleString()} تومان</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>تخفیف</span>
                    <span>−{order.discount.toLocaleString()} تومان</span>
                  </div>
                )}
              </div>
              <div className="border-t border-[var(--dk-border)] pt-3 flex items-center justify-between">
                <span className="font-bold">مجموع</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: "var(--dk-primary)" }}
                >
                  {order.total.toLocaleString()} تومان
                </span>
              </div>

              {(order.shippingMethod || order.notes) && (
                <div className="border-t border-[var(--dk-border)] pt-3 space-y-1 text-xs text-[var(--dk-text-light)]">
                  {order.shippingMethod && (
                    <p>
                      روش ارسال:{" "}
                      {shippingLabels[order.shippingMethod] ||
                        order.shippingMethod}
                    </p>
                  )}
                  {order.notes && <p>توضیحات: {order.notes}</p>}
                </div>
              )}

              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full mt-3 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition"
                >
                  {cancelling ? "در حال لغو..." : "لغو سفارش"}
                </button>
              )}

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
                className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition"
                style={{ borderColor: "var(--dk-border)" }}
              >
                <FontAwesomeIcon icon={faBox} className="w-3.5 h-3.5" />
                دانلود فاکتور PDF
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/orders"
                className="text-sm"
                style={{ color: "var(--dk-primary)" }}
              >
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  className="ml-1 w-3 h-3"
                />
                بازگشت به لیست سفارشات
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
