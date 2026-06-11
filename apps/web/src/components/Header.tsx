"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useWallet } from "@/context/WalletContext";
import dynamic from "next/dynamic";

const MegaMenu = dynamic(() => import("@/components/mega-menu/MegaMenu"), {
  ssr: false,
});
const NotifDropdown = dynamic(() => import("@/components/NotifDropdown"), {
  ssr: false,
});

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Header() {
  const { totalItems: itemCount } = useCart();
  const { balance, loading: walletLoading } = useWallet();
  const [user, setUser] = useState<{ name?: string; email: string } | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then(setCategories)
      .catch(() => {});
    const token = localStorage.getItem("web_token");
    if (token) {
      try {
        const u = JSON.parse(localStorage.getItem("web_user") || "{}");
        if (u.email) setUser(u);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      setUnreadNotif(0);
      return;
    }
    const fetchNotif = () => {
      api
        .get<{ count: number }>("/notifications/unread-count")
        .then((r) => setUnreadNotif(r.count))
        .catch(() => {});
    };
    fetchNotif();
    const interval = setInterval(fetchNotif, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-[var(--dk-border)] sticky top-0 z-50">
      {/* Top bar: Logo + Search + Auth + Cart */}
      <div className="dk-container">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--dk-primary)" }}
            >
              اطلس
            </span>
            <span className="text-lg font-bold text-gray-700">شاپ</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <form action={`/products`} method="GET" className="relative">
              <input
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی محصول..."
                className="w-full rounded-lg bg-[var(--dk-bg)] px-4 py-2.5 text-sm pr-10 border border-transparent focus:border-[var(--dk-primary)] focus:bg-white outline-none transition"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--dk-text-light)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </form>
          </div>

          {/* Auth / Profile */}
          {user ? (
            <>
              <Link
                href="/panel"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--dk-bg)] text-sm whitespace-nowrap"
              >
                <svg
                  className="w-5 h-5 text-[var(--dk-text-light)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="hidden sm:inline text-[var(--dk-text)]">
                  {user.name || user.email}
                </span>
              </Link>
              <Link
                href="/panel/wallet"
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[var(--dk-bg)] text-sm whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 text-yellow-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1h-9a2 2 0 00-2 2v8a2 2 0 002 2h9zm-9-2h10V8H12v8zm2-6h4v4h-4v-4z" />
                </svg>
                <span className="hidden sm:inline text-xs font-medium">
                  {walletLoading ? "..." : balance.toLocaleString()} تومان
                </span>
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--dk-bg)] text-sm whitespace-nowrap"
            >
              <svg
                className="w-5 h-5 text-[var(--dk-text-light)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="hidden sm:inline text-[var(--dk-text)]">
                ورود | ثبت‌نام
              </span>
            </Link>
          )}

          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--dk-bg)] text-sm whitespace-nowrap"
              >
                <svg
                  className="w-5 h-5 text-[var(--dk-text-light)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadNotif > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ background: "var(--dk-primary)" }}
                  >
                    {unreadNotif > 99 ? "99+" : unreadNotif}
                  </span>
                )}
              </button>
              {showNotif && (
                <NotifDropdown onClose={() => setShowNotif(false)} />
              )}
            </div>
          )}

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--dk-bg)] text-sm whitespace-nowrap"
          >
            <svg
              className="w-5 h-5"
              style={{ color: "var(--dk-primary)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            {itemCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: "var(--dk-primary)" }}
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
            <span className="hidden sm:inline text-[var(--dk-text)]">
              سبد خرید
            </span>
          </Link>
        </div>
      </div>

      {/* Category Nav */}
      <div className="border-t border-[var(--dk-border)]">
        <div className="dk-container">
          <nav className="flex items-center gap-1 h-10 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setShowCatMenu(!showCatMenu)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[var(--dk-bg)] whitespace-nowrap"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              دسته‌بندی
            </button>
            <span className="w-px h-5 bg-[var(--dk-border)]" />
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                className="px-3 py-1.5 rounded-lg text-xs text-[var(--dk-text-light)] hover:bg-[var(--dk-bg)] hover:text-[var(--dk-primary)] whitespace-nowrap transition"
              >
                {cat.name}
              </Link>
            ))}
            {categories.length > 8 && (
              <Link
                href="/products"
                className="px-3 py-1.5 rounded-lg text-xs text-[var(--dk-text-light)] hover:text-[var(--dk-primary)] whitespace-nowrap"
              >
                همه محصولات
              </Link>
            )}
            <span className="w-px h-5 bg-[var(--dk-border)]" />
            <Link
              href="/blog"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--dk-text-light)] hover:bg-[var(--dk-bg)] hover:text-[var(--dk-primary)] whitespace-nowrap transition"
            >
              وبلاگ
            </Link>
          </nav>
        </div>
      </div>

      <div className="relative">
        <MegaMenu isOpen={showCatMenu} onClose={() => setShowCatMenu(false)} />
      </div>
    </header>
  );
}
