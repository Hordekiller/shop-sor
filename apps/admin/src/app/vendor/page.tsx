"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface VendorStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  shop: { id: number; name: string; slug: string; isActive: boolean };
}

export default function VendorDashboard() {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<VendorStats>("/shops/my")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">در حال بارگذاری...</p>;

  if (!stats) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-4">پنل فروشنده</h2>
        <p className="text-gray-500 mb-4">شما هنوز فروشگاه ندارید.</p>
        <button
          onClick={async () => {
            try {
              await api.post("/shops", {
                name: "فروشگاه من",
                slug: "my-shop-" + Date.now(),
              });
              window.location.reload();
            } catch (err) {
              alert(err);
            }
          }}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700"
        >
          ایجاد فروشگاه
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">پنل فروشنده</h2>

      <div className="rounded-xl bg-white p-6 shadow-sm border mb-6">
        <h3 className="font-semibold mb-2">فروشگاه: {stats.shop.name}</h3>
        <p
          className={`text-sm ${stats.shop.isActive ? "text-green-600" : "text-red-500"}`}
        >
          {stats.shop.isActive ? "فعال" : "غیرفعال"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <p className="text-sm text-gray-500">محصولات</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {stats.totalProducts}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <p className="text-sm text-gray-500">سفارشات</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.totalOrders}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border">
          <p className="text-sm text-gray-500">درآمد</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
