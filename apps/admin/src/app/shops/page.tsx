"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import JalaliDate from "@/components/JalaliDate";

interface Shop {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  owner: { id: number; name: string; email: string };
  isActive: boolean;
  createdAt: string;
  _count: { products: number; orders: number };
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Shop[]>("/shops")
      .then(setShops)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/shops/${id}`, { isActive: !isActive });
      setShops(
        shops.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
      );
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">فروشندگان</h2>
      </div>

      {loading ? (
        <p className="text-gray-500">در حال بارگذاری...</p>
      ) : shops.length === 0 ? (
        <p className="text-gray-500">هیچ فروشنده‌ای یافت نشد.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-right">
              <tr>
                <th className="px-4 py-3 font-medium">شناسه</th>
                <th className="px-4 py-3 font-medium">نام فروشگاه</th>
                <th className="px-4 py-3 font-medium">مالک</th>
                <th className="px-4 py-3 font-medium">محصولات</th>
                <th className="px-4 py-3 font-medium">سفارشات</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">تاریخ</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr
                  key={shop.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">{shop.id}</td>
                  <td className="px-4 py-3 font-medium">{shop.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {shop.owner?.name || shop.owner?.email}
                  </td>
                  <td className="px-4 py-3">{shop._count.products}</td>
                  <td className="px-4 py-3">{shop._count.orders}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        shop.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {shop.isActive ? "فعال" : "مسدود"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <JalaliDate date={shop.createdAt} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(shop.id, shop.isActive)}
                      className={`text-xs ${shop.isActive ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}`}
                    >
                      {shop.isActive ? "مسدود کردن" : "فعال کردن"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
