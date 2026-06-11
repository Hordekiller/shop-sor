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

export default function NotifDropdown({ onClose }: { onClose: () => void }) {
  const [list, setList] = useState<NotifItem[]>([]);

  useEffect(() => {
    api
      .get<{ data: NotifItem[] }>("/notifications?limit=5")
      .then((r) => setList(r.data))
      .catch(() => {});
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".notif-dropdown") && !target.closest("button"))
        onClose();
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [onClose]);

  const markRead = async (id: number) => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  return (
    <div className="notif-dropdown absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-bold">اعلان‌ها</span>
        <Link
          href="/panel/notifications"
          className="text-xs"
          style={{ color: "var(--dk-primary)" }}
          onClick={onClose}
        >
          مشاهده همه
        </Link>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {list.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            اعلانی وجود ندارد
          </div>
        ) : (
          list.map((n) => (
            <div
              key={n.id}
              className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!n.isRead ? "bg-red-50" : ""}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  {n.message && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-[10px] shrink-0 px-2 py-1 rounded"
                    style={{ color: "var(--dk-primary)" }}
                  >
                    خواندن
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
