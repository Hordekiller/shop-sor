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
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>('/admin/stats')
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">در حال بارگذاری...</p>;

  const reports = [
    { label: 'میانگین ارزش سفارشات', value: stats?.totalOrders ? `${Math.round((stats.totalRevenue || 0) / stats.totalOrders).toLocaleString()} ریال` : '۰' },
    { label: 'نرخ تبدیل کاربران به سفارش', value: stats?.totalUsers ? `${((stats?.totalOrders || 0) / stats.totalUsers * 100).toFixed(1)}%` : '۰%' },
    { label: 'میانگین محصولات هر فروشنده', value: stats?.totalShops ? Math.round((stats?.totalProducts || 0) / stats.totalShops).toLocaleString() : '۰' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">گزارشات</h2>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {reports.map((r) => (
          <div key={r.label} className="rounded-xl bg-white p-6 shadow-sm border">
            <p className="text-sm text-gray-500 mb-2">{r.label}</p>
            <p className="text-2xl font-bold text-indigo-600">{r.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border">
        <h3 className="font-semibold mb-4">خلاصه فروشگاه</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">کل کاربران</p>
            <p className="font-bold text-lg">{stats?.totalUsers}</p>
          </div>
          <div>
            <p className="text-gray-500">کل فروشندگان</p>
            <p className="font-bold text-lg">{stats?.totalShops}</p>
          </div>
          <div>
            <p className="text-gray-500">کل محصولات</p>
            <p className="font-bold text-lg">{stats?.totalProducts}</p>
          </div>
          <div>
            <p className="text-gray-500">کل تخفیف‌ها</p>
            <p className="font-bold text-lg">{stats?.totalCoupons}</p>
          </div>
          <div>
            <p className="text-gray-500">کل سفارشات</p>
            <p className="font-bold text-lg">{stats?.totalOrders}</p>
          </div>
          <div>
            <p className="text-gray-500">سفارشات امروز</p>
            <p className="font-bold text-lg">{stats?.ordersToday}</p>
          </div>
          <div>
            <p className="text-gray-500">درآمد کل</p>
            <p className="font-bold text-lg">{stats?.totalRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">درآمد امروز</p>
            <p className="font-bold text-lg">{stats?.revenueToday.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
