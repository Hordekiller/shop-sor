'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';

export default function Header() {
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('web_token');
    if (token) {
      try {
        const u = JSON.parse(atob(token.split('.')[1]));
        setUser(u);
      } catch {}
    }
  }, []);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          اطلس شاپ
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/products" className="text-gray-600 hover:text-indigo-600">
            محصولات
          </Link>
          <Link href="/cart" className="text-gray-600 hover:text-indigo-600 relative">
            سبد خرید
            {totalItems > 0 && (
              <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          {user ? (
            <Link href="/profile" className="text-gray-600 hover:text-indigo-600">
              پروفایل
            </Link>
          ) : (
            <Link href="/auth/login" className="text-gray-600 hover:text-indigo-600">
              ورود
            </Link>
          )}
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-2 text-sm">
          <Link href="/products" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
            محصولات
          </Link>
          <Link href="/cart" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
            سبد خرید {totalItems > 0 && `(${totalItems})`}
          </Link>
          {user ? (
            <Link href="/profile" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
              پروفایل
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                ورود
              </Link>
              <Link href="/auth/register" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>
                ثبت‌نام
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
