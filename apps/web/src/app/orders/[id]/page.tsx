'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import { toJalaliHuman } from '@/lib/date';

interface OrderItem {
  id: number;
  productId: number;
  title: string;
  quantity: number;
  price: number;
  image: string | null;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingMethod: string | null;
  shippingAddress: string | null;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
  paidAt: string | null;
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

const shippingLabels: Record<string, string> = {
  post_pishtaz: 'پست پیشتاز', post_sefareshi: 'پست سفارشی',
  tipax: 'تیپاکس', mahax: 'ماهکس', snapp_box: 'اسنپ باکس',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('web_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    api.get<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch(() => router.push('/orders'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse bg-white rounded-xl p-6 h-64" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-gray-500">سفارش یافت نشد.</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/orders" className="hover:text-indigo-600">سفارشات من</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">{order.orderNumber}</span>
        </nav>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">{order.orderNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">{toJalaliHuman(order.createdAt)}</p>
            </div>
            <div className="text-left">
              <span className={`rounded-full px-3 py-1 text-sm ${statusColors[order.status] || 'bg-gray-100'}`}>
                {statusLabels[order.status] || order.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h3 className="font-semibold">اقلام سفارش</h3>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-gray-500">تعداد: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">{(item.price * item.quantity).toLocaleString()} ریال</p>
              </div>
            ))}
          </div>

          <div className="px-6 pb-6 space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span className="text-gray-500">زیرمجموع</span>
              <span>{order.subtotal.toLocaleString()} ریال</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">حمل و نقل</span>
              <span>{order.shippingCost === 0 ? 'رایگان' : `${order.shippingCost.toLocaleString()} ریال`}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>تخفیف</span>
                <span>-{order.discount.toLocaleString()} ریال</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>مجموع</span>
              <span className="text-indigo-600">{order.total.toLocaleString()} ریال</span>
            </div>
          </div>

          {(order.shippingMethod || order.shippingAddress || order.notes) && (
            <div className="px-6 pb-6 space-y-2 text-sm border-t pt-4">
              {order.shippingMethod && (
                <p><span className="text-gray-500">روش ارسال:</span> {shippingLabels[order.shippingMethod] || order.shippingMethod}</p>
              )}
              {order.shippingAddress && <p><span className="text-gray-500">آدرس:</span> {order.shippingAddress}</p>}
              {order.notes && <p><span className="text-gray-500">توضیحات:</span> {order.notes}</p>}
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link href="/orders" className="text-sm text-indigo-600 hover:underline">
            بازگشت به لیست سفارشات
          </Link>
        </div>
      </div>
    </>
  );
}
