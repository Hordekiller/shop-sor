'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import JalaliDate from '@/components/JalaliDate';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
  totalShops: number;
  totalCoupons: number;
  recentOrders: { id: number; orderNumber: string; total: number; status: string; user: { name: string; email: string }; createdAt: string }[];
}

const statusLabels: Record<string, string> = {
  pending: 'در انتظار', confirmed: 'تایید شده', processing: 'در حال پردازش',
  shipped: 'ارسال شده', delivered: 'تحویل شده', cancelled: 'لغو شده',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>('/admin/stats')
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map((n) => (
          <div key={n} className="rounded-xl bg-white p-4 shadow-sm animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="کل فروش" value={`${(stats?.totalRevenue || 0).toLocaleString()} ریال`} color="text-indigo-600" />
        <StatCard label="سفارشات امروز" value={String(stats?.ordersToday || 0)} color="text-green-600" />
        <StatCard label="محصولات" value={String(stats?.totalProducts || 0)} color="text-blue-600" />
        <StatCard label="کاربران" value={String(stats?.totalUsers || 0)} color="text-purple-600" />
        <StatCard label="فروشندگان" value={String(stats?.totalShops || 0)} color="text-orange-600" />
        <StatCard label="تخفیف‌ها" value={String(stats?.totalCoupons || 0)} color="text-pink-600" />
        <StatCard label="مجموع سفارشات" value={String(stats?.totalOrders || 0)} color="text-cyan-600" />
        <StatCard label="درآمد امروز" value={`${(stats?.revenueToday || 0).toLocaleString()} ریال`} color="text-emerald-600" />
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">آخرین سفارشات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-right">
              <tr>
                <th className="px-4 py-3 font-medium">شماره</th>
                <th className="px-4 py-3 font-medium">مشتری</th>
                <th className="px-4 py-3 font-medium">مبلغ</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders?.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{order.orderNumber}</td>
                  <td className="px-4 py-3">{order.user?.name || order.user?.email}</td>
                  <td className="px-4 py-3">{order.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <JalaliDate date={order.createdAt} showTime />
                  </td>
                </tr>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">هنوز سفارشی ثبت نشده است.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
