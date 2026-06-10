import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "پنل مدیریت اطلس شاپ",
  description: "پنل مدیریت فروشگاه اطلس",
};

const sidebarItems = [
  { label: "داشبورد", href: "/" },
  { label: "محصولات", href: "/products" },
  { label: "دسته‌بندی‌ها", href: "/categories" },
  { label: "سفارشات", href: "#" },
  { label: "کاربران", href: "#" },
  { label: "فروشندگان", href: "#" },
  { label: "تخفیف‌ها", href: "#" },
  { label: "گزارشات", href: "#" },
  { label: "تنظیمات", href: "#" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <main className="min-h-screen bg-gray-100">
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-3 flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-800">پنل مدیریت اطلس شاپ</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>مدیر سیستم</span>
                <a href="#" className="hover:text-indigo-600">خروج</a>
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
                    className="block rounded-lg px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="flex-1 p-6 overflow-auto">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
