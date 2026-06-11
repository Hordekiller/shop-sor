"use client";

import { useEffect, useState, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

const sidebarItems = [
  { label: "داشبورد", href: "/panel", icon: "tabler:layout-dashboard" },
  { label: "سفارشات من", href: "/panel/orders", icon: "tabler:shopping-cart" },
  { label: "کیف پول", href: "/panel/wallet", icon: "tabler:wallet" },
  { label: "علاقه‌مندی‌ها", href: "/panel/wishlist", icon: "tabler:heart" },
  {
    label: "لیست مقایسه",
    href: "/panel/compare",
    icon: "tabler:arrows-exchange",
  },
  { label: "دیدگاه‌ها", href: "/panel/reviews", icon: "tabler:message-star" },
  { label: "آدرس‌ها", href: "/panel/addresses", icon: "tabler:map-pin" },
  { label: "اطلاعات حساب", href: "/panel/profile", icon: "tabler:user" },
  { label: "امنیت", href: "/panel/security", icon: "tabler:shield-lock" },
  { label: "تیکت‌ها", href: "/panel/tickets", icon: "tabler:headset" },
  {
    label: "پنل فروشندگی",
    href: "/panel/vendor",
    icon: "tabler:briefcase",
    vendorOnly: true,
  },
];

const iconMap: Record<string, string> = {
  "tabler:layout-dashboard":
    "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5z",
  "tabler:shopping-cart":
    "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  "tabler:wallet":
    "M21 12v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-2M12 12h.01M12 16h.01",
  "tabler:heart":
    "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  "tabler:map-pin":
    "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
  "tabler:user":
    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z",
  "tabler:briefcase":
    "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
};

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    api
      .get<any>("/auth/me")
      .then((u) => {
        setUser(u);
        if (
          u.role === "VENDOR" ||
          u.role === "ADMIN" ||
          u.role === "SUPER_ADMIN"
        )
          setIsVendor(true);
      })
      .catch(() => {
        localStorage.removeItem("web_token");
        window.dispatchEvent(new Event("auth:change"));
        router.push("/auth/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("web_token");
    localStorage.removeItem("web_user");
    window.dispatchEvent(new Event("auth:change"));
    router.push("/");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--dk-bg)" }}
      >
        <div
          className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{
            borderColor: "var(--dk-primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  const visibleItems = sidebarItems.filter(
    (item) => !item.vendorOnly || isVendor,
  );

  return (
    <div className="min-h-screen flex" style={{ background: "#f0f2f5" }}>
      {/* Sidebar */}
      <aside
        className="fixed top-0 right-0 h-full z-30 flex flex-col transition-all duration-300 bg-white shadow-sm"
        style={{
          width: sidebarOpen ? 250 : 0,
          borderLeft: "1px solid var(--dk-border)",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center h-14 px-4 border-b shrink-0"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <Link href="/panel" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--dk-primary)" }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <span
              className="font-bold text-base whitespace-nowrap"
              style={{ color: "var(--dk-text)" }}
            >
              پنل کاربری
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="mr-auto p-1 rounded-lg hover:bg-gray-100"
          >
            <Icon
              icon="tabler:x"
              className="w-5 h-5"
              style={{ color: "var(--dk-text-light)" }}
            />
          </button>
        </div>

        {/* User info */}
        <div
          className="p-4 border-b text-center"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2"
            style={{
              background: "rgba(239,64,86,0.1)",
              color: "var(--dk-primary)",
            }}
          >
            {(user?.name || "ک")[0]}
          </div>
          <p className="font-bold text-sm">{user?.name || "کاربر"}</p>
          <p className="text-xs" style={{ color: "var(--dk-text-light)" }}>
            {user?.email}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-hide">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/panel" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: isActive ? "rgba(239,64,86,0.08)" : "transparent",
                  color: isActive
                    ? "var(--dk-primary)"
                    : "var(--dk-text-light)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon icon={item.icon} className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
                {isActive && (
                  <div
                    className="mr-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--dk-primary)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          className="p-3 border-t shrink-0"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition hover:bg-red-50"
            style={{ color: "#ef4444" }}
          >
            <Icon icon="tabler:logout" className="w-5 h-5" />
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginRight: sidebarOpen ? 250 : 0 }}
      >
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex items-center h-14 px-4 bg-white border-b"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 ml-3"
          >
            <Icon
              icon="tabler:menu-2"
              className="w-5 h-5"
              style={{ color: "var(--dk-text-light)" }}
            />
          </button>
          <div className="flex items-center gap-1 text-sm">
            <Link
              href="/"
              style={{ color: "var(--dk-text-light)" }}
              className="hover:text-[var(--dk-primary)]"
            >
              فروشگاه
            </Link>
            <span style={{ color: "var(--dk-text-light)" }}>/</span>
            <span style={{ color: "var(--dk-text)" }}>
              {visibleItems.find(
                (i) =>
                  i.href === pathname ||
                  (i.href !== "/panel" && pathname.startsWith(i.href)),
              )?.label || "پنل کاربری"}
            </span>
          </div>
          <div className="mr-auto flex items-center gap-2">
            <Link
              href="/"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
              title="بازگشت به فروشگاه"
            >
              <Icon
                icon="tabler:external-link"
                className="w-5 h-5"
                style={{ color: "var(--dk-text-light)" }}
              />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
