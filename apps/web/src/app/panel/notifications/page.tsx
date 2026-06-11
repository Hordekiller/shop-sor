"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface NotifItem {
  id: number;
  type: string;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function PanelNotifications() {
  const [list, setList] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = (p: number) => {
    setLoading(true);
    api
      .get<{ data: NotifItem[]; total: number; unreadCount: number }>(
        `/notifications?page=${p}&limit=${limit}`,
      )
      .then((r) => {
        setList(r.data);
        setTotal(r.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const markRead = async (id: number) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllRead = async () => {
    await api.put("/notifications/read-all").catch(() => {});
    setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotif = async (id: number) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    setList((prev) => prev.filter((n) => n.id !== id));
    setTotal((prev) => prev - 1);
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && list.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">در حال بارگذاری...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--dk-text)" }}>
          اعلان‌ها
        </h1>
        {list.some((n) => !n.isRead) && (
          <button
            onClick={markAllRead}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{
              color: "var(--dk-primary)",
              border: "1px solid var(--dk-primary)",
            }}
          >
            خواندن همه
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h2
            className="font-bold text-lg mb-2"
            style={{ color: "var(--dk-text)" }}
          >
            اعلانی وجود ندارد
          </h2>
          <p className="text-sm" style={{ color: "var(--dk-text-light)" }}>
            تغییر وضعیت سفارش‌ها و پیام‌های سیستمی اینجا نمایش داده می‌شوند
          </p>
          <Link
            href="/panel/orders"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-lg text-white text-sm font-medium"
            style={{ background: "var(--dk-primary)" }}
          >
            سفارشات من
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl p-4 border ${!n.isRead ? "border-red-200 bg-red-50" : "border-gray-100 bg-white"}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    )}
                  </div>
                  {n.message && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--dk-text-light)" }}
                    >
                      {n.message}
                    </p>
                  )}
                  <p
                    className="text-[10px] mt-2"
                    style={{ color: "var(--dk-text-disabled)" }}
                  >
                    {new Date(n.createdAt).toLocaleDateString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: "var(--dk-primary)" }}
                    >
                      خواندن
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(n.id)}
                    className="text-xs px-2 py-1 rounded text-gray-400 hover:text-red-500"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium ${p === page ? "text-white" : "text-gray-500 hover:bg-gray-100"}`}
              style={p === page ? { background: "var(--dk-primary)" } : {}}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
