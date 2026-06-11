'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  estimatedDays: string;
  basePrice: number;
  freeThreshold: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<{ id: number; orderNumber: string; total: number } | null>(null);

  useEffect(() => {
    api.get<ShippingMethod[]>('/shipping/methods')
      .then(setShippingMethods)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedShipping) {
      api.post<{ totalCost: number }>('/shipping/calculate', {
        method: selectedShipping,
        subtotal,
      })
        .then((r) => setShippingCost(r.totalCost))
        .catch(() => setShippingCost(0));
    }
  }, [selectedShipping, subtotal]);

  const handleCoupon = async () => {
    if (!couponCode) return;
    try {
      const result = await api.get<{ valid: boolean; discount: number; message?: string }>(
        `/coupons/validate?code=${couponCode}&subtotal=${subtotal}`
      );
      if (result.valid) {
        setDiscount(result.discount);
        setCouponMsg(`تخفیف: ${result.discount.toLocaleString()} ریال`);
      } else {
        setDiscount(0);
        setCouponMsg('کد تخفیف معتبر نیست');
      }
    } catch {
      setCouponMsg('خطا در اعمال کد تخفیف');
    }
  };

  const total = subtotal + shippingCost - discount;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);

    try {
      const order = await api.post<{ id: number; orderNumber: string; total: number }>('/orders', {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingMethod: selectedShipping || undefined,
        couponCode: couponCode || undefined,
        notes,
      });
      setOrderResult(order);
      clearCart();
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت سفارش');
    } finally {
      setLoading(false);
    }
  };

  if (orderResult) {
    return (
      <>
        <Header />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="bg-white rounded-xl p-8 shadow-sm border">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">سفارش با موفقیت ثبت شد</h2>
            <p className="text-gray-500 mb-4">شماره سفارش: {orderResult.orderNumber}</p>
            <p className="text-2xl font-bold text-indigo-600 mb-6">{orderResult.total.toLocaleString()} ریال</p>
            <a
              href="/products"
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white text-sm hover:bg-indigo-700"
            >
              بازگشت به فروشگاه
            </a>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">تسویه حساب</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="font-semibold mb-3">روش ارسال</h3>
                <div className="space-y-2">
                  {shippingMethods.map((method) => {
                    const cost = subtotal >= method.freeThreshold ? 0 : method.basePrice;
                    return (
                      <label
                        key={method.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${
                          selectedShipping === method.id ? 'border-indigo-500 bg-indigo-50' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          value={method.id}
                          checked={selectedShipping === method.id}
                          onChange={(e) => setSelectedShipping(e.target.value)}
                          className="accent-indigo-600"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{method.name}</span>
                          <p className="text-xs text-gray-500">{method.description}</p>
                        </div>
                        <span className="text-sm font-medium">
                          {cost === 0 ? 'رایگان' : `${cost.toLocaleString()} ریال`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="font-semibold mb-3">کد تخفیف</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="کد تخفیف"
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCoupon}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
                  >
                    اعمال
                  </button>
                </div>
                {couponMsg && <p className="text-sm mt-2 text-gray-600">{couponMsg}</p>}
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <h3 className="font-semibold mb-3">توضیحات</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="توضیحات اضافی (اختیاری)"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border h-fit">
              <h3 className="font-semibold mb-3">خلاصه سفارش</h3>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="text-gray-600 line-clamp-1">{item.title} × {item.quantity}</span>
                    <span>{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t mt-3 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">زیرمجموع</span>
                  <span>{subtotal.toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">حمل و نقل</span>
                  <span>{shippingCost === 0 ? 'رایگان' : `${shippingCost.toLocaleString()} ریال`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>تخفیف</span>
                    <span>-{discount.toLocaleString()} ریال</span>
                  </div>
                )}
              </div>

              <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
                <span>مجموع</span>
                <span className="text-indigo-600">{total.toLocaleString()} ریال</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 rounded-lg bg-indigo-600 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'در حال ثبت...' : 'ثبت سفارش'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
