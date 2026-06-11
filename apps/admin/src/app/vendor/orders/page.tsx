"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Order {
  id: number;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function VendorOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/orders?vendor=true&limit=100")
      .then((res: any) => {
        setOrders(res?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusMap: Record<string, string> = {
    pending: "در انتظار",
    processing: "در حال پردازش",
    shipped: "ارسال شده",
    delivered: "تحویل شده",
    cancelled: "لغو شده",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  if (loading) return <p className="text-gray-500">در حال بارگذاری...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">سفارشات من</h2>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-right">
            <tr>
              <th className="p-3">شماره سفارش</th>
              <th className="p-3">مبلغ</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/orders/${o.id}`)}
              >
                <td className="p-3">{o.orderNumber}</td>
                <td className="p-3">{o.total.toLocaleString()}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${statusColors[o.status] || ""}`}
                  >
                    {statusMap[o.status] || o.status}
                  </span>
                </td>
                <td className="p-3">{o.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
