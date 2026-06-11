"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { ToastProvider } from "@/context/ToastContext";

interface MenuChild {
  label: string;
  href: string;
}
interface MenuGroup {
  label: string;
  icon: string;
  href?: string;
  children?: MenuChild[];
}

const menuGroups: MenuGroup[] = [
  { label: "داشبورد", href: "/", icon: "tabler:layout-dashboard" },
  {
    label: "محصولات",
    icon: "tabler:package",
    children: [
      { label: "همه محصولات", href: "/products" },
      { label: "افزودن محصول", href: "/products/new" },
      { label: "دسته‌بندی‌ها", href: "/categories" },
      { label: "برندها", href: "/brands" },
      { label: "مدیریت موجودی", href: "/inventory" },
    ],
  },
  {
    label: "فروش",
    icon: "tabler:shopping-cart",
    children: [
      { label: "سفارشات", href: "/orders" },
      { label: "بازگشت کالا", href: "/returns" },
      { label: "کدهای تخفیف", href: "/coupons" },
      { label: "کیف پول", href: "/wallet" },
      { label: "اعلان‌ها", href: "/notifications" },
      { label: "قالب پیام‌ها", href: "/notification-templates" },
      { label: "گزارشات", href: "/reports" },
    ],
  },
  {
    label: "مشتریان",
    icon: "tabler:users",
    children: [
      { label: "کاربران", href: "/users" },
      { label: "فروشندگان", href: "/shops" },
      { label: "نظرات", href: "/reviews" },
    ],
  },
  {
    label: "وبلاگ",
    icon: "tabler:article",
    children: [
      { label: "همه پست‌ها", href: "/blog" },
      { label: "افزودن پست", href: "/blog/new" },
      { label: "دسته‌بندی‌ها", href: "/blog/categories" },
      { label: "برچسب‌ها", href: "/blog/tags" },
      { label: "نظرات", href: "/blog/comments" },
    ],
  },
  {
    label: "ظاهر فروشگاه",
    icon: "tabler:paint",
    children: [
      { label: "صفحه‌ساز", href: "/page-builder" },
      { label: "مدیریت منو", href: "/menus" },
      { label: "مگا منو", href: "/mega-menu" },
      { label: "استوری", href: "/stories" },
      { label: "بنرها", href: "/slides" },
      { label: "پاپ‌آپ", href: "/popups" },
      { label: "فونت‌ها", href: "/fonts" },
      { label: "رسانه", href: "/media" },
    ],
  },
  {
    label: "محتوا",
    icon: "tabler:file-text",
    children: [
      { label: "صفحات", href: "/pages" },
      { label: "تغییر مسیر", href: "/redirects" },
    ],
  },
  {
    label: "بازار",
    icon: "tabler:building-store",
    children: [
      { label: "پنل فروشنده", href: "/vendor" },
      { label: "محصولات من", href: "/vendor/products" },
      { label: "سفارشات من", href: "/vendor/orders" },
    ],
  },
  { label: "تنظیمات", href: "/settings", icon: "tabler:settings" },
];

const allItems: { label: string; href: string }[] = [];
menuGroups.forEach((g) => {
  if (g.href) allItems.push({ label: g.label, href: g.href });
  g.children?.forEach((c) => allItems.push({ label: c.label, href: c.href }));
});

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    const token = localStorage.getItem("atlas_token");
    if (!token && !isLoginPage) {
      router.push("/login");
      return;
    }
    if (token) {
      try {
        const u = JSON.parse(localStorage.getItem("atlas_user") || "{}");
        setUser(u);
      } catch {}
    }
    setLoading(false);
  }, [isLoginPage, router]);

  useEffect(() => {
    const autoExpand = new Set(expandedGroups);
    menuGroups.forEach((g) => {
      const isChildActive = g.children?.some(
        (c) =>
          c.href === pathname ||
          (pathname.startsWith(c.href) && c.href !== "/"),
      );
      if (isChildActive || (g.href && pathname === g.href)) {
        autoExpand.add(g.label);
      }
    });
    if (autoExpand.size !== expandedGroups.size) {
      setExpandedGroups((prev) => {
        const next = new Set(prev);
        autoExpand.forEach((l) => next.add(l));
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("atlas_token");
    localStorage.removeItem("atlas_user");
    router.push("/login");
  };

  const isActive = useCallback(
    (href: string) =>
      pathname === href || (href !== "/" && pathname.startsWith(href)),
    [pathname],
  );

  if (isLoginPage) {
    return (
      <div style={{ background: "#F8F7FA", minHeight: "100vh" }}>
        {children}
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--v-bg)" }}
      >
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[var(--v-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm" style={{ color: "var(--v-text-secondary)" }}>
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--v-bg)" }}>
      <aside
        className="fixed top-0 right-0 h-full z-30 flex flex-col transition-all duration-300"
        style={{
          width: sidebarOpen
            ? "var(--sidebar-width)"
            : "var(--sidebar-collapsed)",
          background: "var(--v-card)",
          borderLeft: "1px solid var(--v-border)",
          boxShadow: "var(--v-shadow-sm)",
        }}
      >
        <div
          className="flex items-center h-[var(--header-height)] px-4 shrink-0"
          style={{ borderBottom: "1px solid var(--v-divider)" }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--v-primary)" }}
            >
              <Icon icon="tabler:shopping-bag" className="text-white w-5 h-5" />
            </div>
            <span
              className="font-bold text-base whitespace-nowrap transition-opacity duration-300"
              style={{ color: "var(--v-text)", opacity: sidebarOpen ? 1 : 0 }}
            >
              اطلس شاپ
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-auto p-1.5 rounded-lg hover:bg-gray-100 transition shrink-0"
          >
            <Icon
              icon={
                sidebarOpen ? "tabler:chevron-right" : "tabler:chevron-left"
              }
              className="w-5 h-5"
              style={{ color: "var(--v-text-secondary)" }}
            />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 scrollbar-hide">
          {menuGroups.map((group) => {
            const hasChildren = !!group.children?.length;
            const isExpanded = expandedGroups.has(group.label);
            const isGroupActive = !hasChildren && isActive(group.href || "");
            const anyChildActive =
              hasChildren && group.children!.some((c) => isActive(c.href));

            if (!hasChildren) {
              return (
                <a
                  key={group.href}
                  href={group.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-1"
                  style={{
                    background: isGroupActive
                      ? "rgba(115, 103, 240, 0.08)"
                      : "transparent",
                    color: isGroupActive
                      ? "var(--v-primary)"
                      : "var(--v-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isGroupActive) {
                      e.currentTarget.style.background =
                        "rgba(115, 103, 240, 0.04)";
                      e.currentTarget.style.color = "var(--v-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isGroupActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--v-text-secondary)";
                    }
                  }}
                >
                  <Icon icon={group.icon} className="w-5 h-5 shrink-0" />
                  <span
                    className="whitespace-nowrap transition-opacity duration-300"
                    style={{
                      opacity: sidebarOpen ? 1 : 0,
                      width: sidebarOpen ? "auto" : 0,
                      overflow: "hidden",
                    }}
                  >
                    {group.label}
                  </span>
                  {isGroupActive && (
                    <span
                      className="mr-auto w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "var(--v-primary)" }}
                    />
                  )}
                </a>
              );
            }

            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
                  style={{
                    background: anyChildActive
                      ? "rgba(115, 103, 240, 0.08)"
                      : "transparent",
                    color: anyChildActive
                      ? "var(--v-primary)"
                      : "var(--v-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (!anyChildActive) {
                      e.currentTarget.style.background =
                        "rgba(115, 103, 240, 0.04)";
                      e.currentTarget.style.color = "var(--v-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!anyChildActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--v-text-secondary)";
                    }
                  }}
                >
                  <Icon icon={group.icon} className="w-5 h-5 shrink-0" />
                  <span
                    className="whitespace-nowrap transition-opacity duration-300 flex-1 text-right"
                    style={{
                      opacity: sidebarOpen ? 1 : 0,
                      width: sidebarOpen ? "auto" : 0,
                      overflow: "hidden",
                    }}
                  >
                    {group.label}
                  </span>
                  {sidebarOpen && (
                    <Icon
                      icon={
                        isExpanded
                          ? "tabler:chevron-down"
                          : "tabler:chevron-left"
                      }
                      className="w-4 h-4 shrink-0 transition-transform duration-200"
                    />
                  )}
                </button>
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{
                    maxHeight: isExpanded && sidebarOpen ? "500px" : "0",
                    opacity: isExpanded && sidebarOpen ? 1 : 0,
                  }}
                >
                  <div
                    className="mr-3 pr-3"
                    style={{ borderRight: "1px solid var(--v-divider)" }}
                  >
                    {group.children!.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <a
                          key={child.href}
                          href={child.href}
                          className="flex items-center gap-3 pr-3 py-2 rounded-lg text-sm transition-all"
                          style={{
                            background: childActive
                              ? "rgba(115, 103, 240, 0.08)"
                              : "transparent",
                            color: childActive
                              ? "var(--v-primary)"
                              : "var(--v-text-secondary)",
                          }}
                          onMouseEnter={(e) => {
                            if (!childActive) {
                              e.currentTarget.style.background =
                                "rgba(115, 103, 240, 0.04)";
                              e.currentTarget.style.color = "var(--v-primary)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!childActive) {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color =
                                "var(--v-text-secondary)";
                            }
                          }}
                        >
                          <span className="text-xs">•</span>
                          <span>{child.label}</span>
                          {childActive && (
                            <span
                              className="mr-auto w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: "var(--v-primary)" }}
                            />
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div
          className="p-3 shrink-0"
          style={{ borderTop: "1px solid var(--v-divider)" }}
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: "rgba(115, 103, 240, 0.12)",
                color: "var(--v-primary)",
              }}
            >
              {(user?.name || user?.email || "A")[0].toUpperCase()}
            </div>
            <div
              className="min-w-0 transition-opacity duration-300"
              style={{ opacity: sidebarOpen ? 1 : 0 }}
            >
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--v-text)" }}
              >
                {user?.name || "کاربر"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div
        className="flex-1 flex flex-col transition-all duration-300 min-h-screen"
        style={{
          marginRight: sidebarOpen
            ? "var(--sidebar-width)"
            : "var(--sidebar-collapsed)",
        }}
      >
        <header
          className="sticky top-0 z-20 flex items-center h-[var(--header-height)] px-6"
          style={{
            background: "var(--v-card)",
            borderBottom: "1px solid var(--v-border)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition ml-3"
          >
            <Icon
              icon="tabler:menu-2"
              className="w-5 h-5"
              style={{ color: "var(--v-text-secondary)" }}
            />
          </button>

          <div className="flex items-center gap-1 text-sm">
            <Icon
              icon="tabler:home"
              className="w-4 h-4"
              style={{ color: "var(--v-text-secondary)" }}
            />
            <span style={{ color: "var(--v-text-secondary)" }}>/</span>
            <span style={{ color: "var(--v-text)" }}>
              {allItems.find(
                (i) =>
                  i.href === pathname ||
                  (i.href !== "/" && pathname.startsWith(i.href)),
              )?.label || "داشبورد"}
            </span>
          </div>

          <div className="mr-auto flex items-center gap-2 relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: "rgba(115, 103, 240, 0.12)",
                  color: "var(--v-primary)",
                }}
              >
                {(user?.name || user?.email || "A")[0].toUpperCase()}
              </div>
              <span
                style={{ color: "var(--v-text)" }}
                className="hidden sm:inline"
              >
                {user?.name || user?.email || "کاربر"}
              </span>
              <Icon
                icon="tabler:chevron-down"
                className="w-4 h-4"
                style={{ color: "var(--v-text-secondary)" }}
              />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div
                  className="absolute top-full left-0 mt-1 w-48 z-20 rounded-lg py-1 shadow-lg animate-fade-in"
                  style={{
                    background: "var(--v-card)",
                    border: "1px solid var(--v-border)",
                  }}
                >
                  <div
                    className="px-4 py-2 border-b"
                    style={{ borderColor: "var(--v-divider)" }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--v-text)" }}
                    >
                      {user?.name || "کاربر"}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition"
                    style={{ color: "var(--v-error)" }}
                  >
                    <Icon icon="tabler:logout" className="w-4 h-4" /> خروج
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 animate-fade-in">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>
    </div>
  );
}
