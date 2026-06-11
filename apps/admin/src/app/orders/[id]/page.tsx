'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import JalaliDate from '@/components/JalaliDate';

interface OrderItem {
  id: number;
  productId: number;
  title: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingMethod: string | null;
  shippingAddress: string | null;
  notes: string | null;
  user: { id: number; name: string; email: string; phone: string | null };
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

const paymentStatusLabels: Record<string, string> = {
  unpaid: 'پرداخت نشده', paid: 'پرداخت شده', refunded: 'مسترد شده',
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
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchOrder = () => {
    api.get<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch(() => router.push('/orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatus = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      fetchOrder();
    } catch (err) {
      alert(err);
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) return <p className="text-gray-500">در حال بارگذاری...</p>;
  if (!order) return <p className="text-gray-500">سفارش یافت نشد.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">جزئیات سفارش</h2>
          <p className="text-sm text-gray-500 mt-1">{order.orderNumber}</p>
        </div>
        <a href="/orders" className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          بازگشت
        </a>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 font-semibold">اقلام سفارش</div>
            <div className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right border-b">
                    <th className="pb-2 font-medium">محصول</th>
                    <th className="pb-2 font-medium">شناسه</th>
                    <th className="pb-2 font-medium">قیمت</th>
                    <th className="pb-2 font-medium">تعداد</th>
                    <th className="pb-2 font-medium text-left">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2">{item.title}</td>
                      <td className="py-2 text-gray-500">{item.productId}</td>
                      <td className="py-2">{item.price.toLocaleString()}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2 text-left">{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 font-semibold">تغییر وضعیت</div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleStatus(key)}
                    disabled={changingStatus || key === order.status}
                    className={`rounded-lg px-4 py-2 text-sm ${
                      key === order.status
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-sm">مشتری</div>
            <div className="p-4 text-sm space-y-2">
              <p><span className="text-gray-500">نام:</span> {order.user?.name}</p>
              <p><span className="text-gray-500">ایمیل:</span> {order.user?.email}</p>
              <p><span className="text-gray-500">موبایل:</span> {order.user?.phone || '—'}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-sm">وضعیت</div>
            <div className="p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">وضعیت سفارش</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">پرداخت</span>
                <span className={`text-xs ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                </span>
              </div>
              {order.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-500">روش پرداخت</span>
                  <span>{order.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-sm">مالی</div>
            <div className="p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">زیرمجموع</span>
                <span>{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">حمل و نقل</span>
                <span>{order.shippingCost === 0 ? 'رایگان' : `${order.shippingCost.toLocaleString()} ریال`}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>تخفیف</span>
                  <span>-{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2">
                <span>مجموع</span>
                <span className="text-indigo-600">{order.total.toLocaleString()} ریال</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-sm">زمان</div>
            <div className="p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">ایجاد</span>
                <span className="text-xs"><JalaliDate date={order.createdAt} showTime /></span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">پرداخت</span>
                  <span className="text-xs"><JalaliDate date={order.paidAt} showTime /></span>
                </div>
              )}
            </div>
          </div>

          {order.shippingMethod && (
            <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-sm">ارسال</div>
              <div className="p-4 text-sm space-y-2">
                <p>{shippingLabels[order.shippingMethod] || order.shippingMethod}</p>
                {order.shippingAddress && <p className="text-gray-500">{order.shippingAddress}</p>}
              </div>
            </div>
          )}

          {order.notes && (
            <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-sm">توضیحات</div>
              <div className="p-4 text-sm text-gray-600">{order.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
