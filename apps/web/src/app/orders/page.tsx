'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { toJalaliHuman } from '@/lib/date';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  items: { id: number; quantity: number }[];
  createdAt: string;
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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('web_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    api.get<{ data: Order[]; total: number }>('/orders')
      .then((d) => setOrders(d.data))
      .catch(() => router.push('/auth/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1,2,3].map((n) => <div key={n} className="bg-white rounded-xl p-6 h-20" />)}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">سفارشات من</h1>
          <Link href="/profile" className="text-sm text-indigo-600 hover:underline">پروفایل</Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
            <p className="text-gray-500 mb-4">هنوز سفارشی ثبت نکرده‌اید.</p>
            <Link
              href="/products"
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white text-sm hover:bg-indigo-700"
            >
              مشاهده محصولات
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm border hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">{toJalaliHuman(order.createdAt)}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-indigo-600">{order.total.toLocaleString()} ریال</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[order.status] || 'bg-gray-100'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{order.items.length} قلم کالا</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
