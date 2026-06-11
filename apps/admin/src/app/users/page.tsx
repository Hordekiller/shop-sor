"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import JalaliDate from "@/components/JalaliDate";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
  _count: { orders: number; reviews: number };
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "مدیر کل",
  ADMIN: "مدیر",
  VENDOR: "فروشنده",
  CUSTOMER: "مشتری",
};

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: "v-badge-error",
  ADMIN: "v-badge-primary",
  VENDOR: "v-badge-info",
  CUSTOMER: "v-badge-secondary",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<User[]>("/users")
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            کاربران
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            مدیریت کاربران فروشگاه
          </p>
        </div>
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
      ) : users.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:users-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هیچ کاربری یافت نشد.
          </p>
        </div>
      ) : (
        <div className="v-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="v-table">
              <thead>
                <tr>
                  <th>شناسه</th>
                  <th>نام</th>
                  <th>ایمیل</th>
                  <th>نقش</th>
                  <th>سفارشات</th>
                  <th>تاریخ عضویت</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <a
                        href={`/users/${user.id}`}
                        className="font-medium hover:underline"
                        style={{ color: "var(--v-primary)" }}
                      >
                        {user.name}
                      </a>
                    </td>
                    <td style={{ color: "var(--v-text-secondary)" }}>
                      {user.email}
                    </td>
                    <td>
                      <span
                        className={`v-badge ${roleBadge[user.role] || "v-badge-secondary"}`}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td>{user._count.orders}</td>
                    <td
                      className="text-xs"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      <JalaliDate date={user.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
