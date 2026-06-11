'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import "./globals.css";

const sidebarItems = [
  { label: "داشبورد", href: "/" },
  { label: "محصولات", href: "/products" },
  { label: "دسته‌بندی‌ها", href: "/categories" },
  { label: "سفارشات", href: "/orders" },
  { label: "تخفیف‌ها", href: "/coupons" },
  { label: "کاربران", href: "/users" },
  { label: "فروشندگان", href: "/shops" },
  { label: "پنل فروشنده", href: "/vendor" },
  { label: "محصولات من", href: "/vendor/products" },
  { label: "سفارشات من", href: "/vendor/orders" },
  { label: "گزارشات", href: "/reports" },
  { label: "تنظیمات", href: "/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const token = localStorage.getItem('atlas_token');
    if (!token && !isLoginPage) {
      router.push('/login');
      return;
    }
    if (token) {
      try {
        const u = JSON.parse(localStorage.getItem('atlas_user') || '{}');
        setUser(u);
      } catch {}
    }
    setLoading(false);
  }, [isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem('atlas_token');
    localStorage.removeItem('atlas_user');
    router.push('/login');
  };

  if (isLoginPage) {
    return (
      <html lang="fa" dir="rtl">
        <body>{children}</body>
      </html>
    );
  }

  if (loading) {
    return (
      <html lang="fa" dir="rtl">
        <body>
          <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <p className="text-gray-500">در حال بارگذاری...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="fa" dir="rtl">
      <body>
        <main className="min-h-screen bg-gray-100">
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-3 flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-800">پنل مدیریت اطلس شاپ</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{user?.name || user?.email || 'کاربر'}</span>
                <button onClick={handleLogout} className="hover:text-indigo-600 cursor-pointer">
                  خروج
                </button>
              </div>
            </div>
          </header>

          <div className="flex">
            <aside className="w-64 bg-white h-[calc(100vh-57px)] border-l p-4 shrink-0">
              <nav className="space-y-2 text-sm">
                {sidebarItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`block rounded-lg px-4 py-2 hover:bg-indigo-50 hover:text-indigo-600 ${
                      pathname === item.href ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="flex-1 p-6 overflow-auto animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
