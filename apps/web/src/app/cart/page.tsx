'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  return (
    <>
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">سبد خرید</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">سبد خرید شما خالی است.</p>
            <Link
              href="/products"
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white text-sm hover:bg-indigo-700"
            >
              مشاهده محصولات
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={`http://localhost:8000${item.image}`} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No img</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.productId}`} className="text-sm font-medium hover:text-indigo-600 line-clamp-1">
                      {item.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">{item.price.toLocaleString()} ریال</p>
                  </div>

                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-50 text-sm"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 border-x text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-50 text-sm"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-left min-w-[100px]">
                    <p className="text-sm font-medium">{(item.price * item.quantity).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">ریال</p>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-400 hover:text-red-600 p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">مجموع</span>
                <span className="text-xl font-bold text-indigo-600">{subtotal.toLocaleString()} ریال</span>
              </div>
              <Link
                href="/checkout"
                className="block w-full rounded-lg bg-indigo-600 py-3 text-center text-white font-medium hover:bg-indigo-700"
              >
                ادامه فرایند خرید
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
