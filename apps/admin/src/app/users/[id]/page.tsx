"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import JalaliDate from "@/components/JalaliDate";

interface UserDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  orders: {
    id: number;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "مدیر کل",
  ADMIN: "مدیر",
  VENDOR: "فروشنده",
  CUSTOMER: "مشتری",
};

const statusLabels: Record<string, string> = {
  pending: "در انتظار",
  confirmed: "تایید شده",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<UserDetail>(`/users/${id}`)
      .then(setUser)
      .catch(() => router.push("/users"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">در حال بارگذاری...</p>;
  if (!user) return <p className="text-gray-500">کاربر یافت نشد.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">جزئیات کاربر</h2>
        <a
          href="/users"
          className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          بازگشت
        </a>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 font-semibold">
            اطلاعات کاربر
          </div>
          <div className="p-6 text-sm space-y-3">
            <p>
              <span className="text-gray-500">شناسه:</span> {user.id}
            </p>
            <p>
              <span className="text-gray-500">نام:</span> {user.name}
            </p>
            <p>
              <span className="text-gray-500">ایمیل:</span> {user.email}
            </p>
            <p>
              <span className="text-gray-500">موبایل:</span> {user.phone || "—"}
            </p>
            <p>
              <span className="text-gray-500">نقش:</span>{" "}
              {roleLabels[user.role] || user.role}
            </p>
            <p>
              <span className="text-gray-500">وضعیت:</span>{" "}
              {user.isActive ? "فعال" : "غیرفعال"}
            </p>
            <p>
              <span className="text-gray-500">عضویت:</span>{" "}
              <JalaliDate date={user.createdAt} showTime />
            </p>
          </div>
        </div>

        <div className="md:col-span-2 rounded-xl bg-white shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 font-semibold">
            سفارشات ({user.orders?.length || 0})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-right">
                <tr>
                  <th className="px-4 py-3 font-medium">شناسه</th>
                  <th className="px-4 py-3 font-medium">شماره سفارش</th>
                  <th className="px-4 py-3 font-medium">مبلغ</th>
                  <th className="px-4 py-3 font-medium">وضعیت</th>
                  <th className="px-4 py-3 font-medium">تاریخ</th>
                  <th className="px-4 py-3 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {user.orders?.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">{order.id}</td>
                    <td className="px-4 py-3 font-medium">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      {order.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs bg-gray-100">
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <JalaliDate date={order.createdAt} />
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/orders/${order.id}`}
                        className="text-indigo-500 hover:text-indigo-700 text-xs"
                      >
                        مشاهده
                      </a>
                    </td>
                  </tr>
                ))}
                {(!user.orders || user.orders.length === 0) && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      هیچ سفارشی ندارد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
