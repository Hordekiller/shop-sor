"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import JalaliDate from "@/components/JalaliDate";

interface NotificationUser {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  user: NotificationUser;
}

const typeLabels: Record<string, string> = {
  order_confirmed: "سفارش تایید شد",
  payment_success: "پرداخت موفق",
  order_shipped: "سفارش ارسال شد",
  order_delivered: "سفارش تحویل شد",
  order_cancelled: "سفارش لغو شد",
  low_stock: "موجودی کم",
  new_comment: "نظر جدید",
  coupon: "کد تخفیف",
  system: "سیستم",
};

const typeBadge: Record<string, string> = {
  order_confirmed: "v-badge-info",
  payment_success: "v-badge-success",
  order_shipped: "v-badge-secondary",
  order_delivered: "v-badge-success",
  order_cancelled: "v-badge-error",
  low_stock: "v-badge-warning",
  new_comment: "v-badge-primary",
  coupon: "v-badge-info",
  system: "v-badge-secondary",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIdFilter, setUserIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userIdFilter) params.set("userId", userIdFilter);
      params.set("page", String(page));
      params.set("limit", String(perPage));
      const data = await api.get<{
        data: Notification[];
        total: number;
        page: number;
        limit: number;
      }>(`/admin/notifications?${params}`);
      setNotifications(data.data);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchNotifications();
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            اطلاع‌رسانی‌ها
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            مدیریت و مشاهده اطلاع‌رسانی‌های تمام کاربران
          </p>
        </div>
        <span
          className="text-sm px-3 py-1 rounded-lg"
          style={{
            background: "rgba(115,103,240,0.08)",
            color: "var(--v-primary)",
          }}
        >
          مجموع: {total}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            placeholder="جستجو با شناسه کاربری..."
            className="v-input"
          />
        </form>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg animate-pulse"
              style={{ background: "var(--v-bg)" }}
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:bell-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هیچ اطلاع‌رسانی‌ای یافت نشد.
          </p>
        </div>
      ) : (
        <div className="v-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="v-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>نوع</th>
                  <th>عنوان</th>
                  <th>پیام</th>
                  <th>کاربر</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} className={!n.isRead ? "font-medium" : ""}>
                    <td>{n.id}</td>
                    <td>
                      <span
                        className={`v-badge ${typeBadge[n.type] || "v-badge-secondary"}`}
                      >
                        {typeLabels[n.type] || n.type}
                      </span>
                    </td>
                    <td>{n.title}</td>
                    <td
                      className="max-w-[200px] truncate"
                      title={n.message || ""}
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      {n.message || "—"}
                    </td>
                    <td
                      className="text-xs"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      <div>
                        {n.user?.name || n.user?.email || `کاربر ${n.userId}`}
                      </div>
                      <div className="opacity-60">ID: {n.userId}</div>
                    </td>
                    <td>
                      <span
                        className={`v-badge ${n.isRead ? "v-badge-secondary" : "v-badge-primary"}`}
                      >
                        {n.isRead ? "خوانده شده" : "جدید"}
                      </span>
                    </td>
                    <td
                      className="text-xs"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      <JalaliDate date={n.createdAt} showTime />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="v-btn v-btn-secondary v-btn-sm"
          >
            <Icon icon="tabler:chevron-right" className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="v-btn v-btn-sm"
              style={{
                background: page === p ? "var(--v-primary)" : "transparent",
                color: page === p ? "white" : "var(--v-text-secondary)",
                border: page === p ? "none" : "1px solid var(--v-border)",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="v-btn v-btn-secondary v-btn-sm"
          >
            <Icon icon="tabler:chevron-left" className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
