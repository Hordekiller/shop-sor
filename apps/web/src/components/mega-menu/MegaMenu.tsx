"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  _count: { products: number };
  children: CategoryTree[];
}

interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
}

interface SidebarLink {
  label: string;
  icon: string;
  href: string;
}

interface CategoryConfig {
  categoryId: number;
  icon: string | null;
  iconType: string;
  sidebarBanner: string | null;
  sidebarBannerLink: string | null;
  sidebarLinks: string;
}

interface MegaMenuConfig {
  id: number;
  menuId: number | null;
  showCategories: boolean;
  showBrands: boolean;
  tabs: string;
  sidebarTitle: string | null;
  sidebarLinks: string;
  sidebarBanner: string | null;
  sidebarBannerLink: string | null;
  sidebarBannerSize: string | null;
  menu?: { items: any[] } | null;
}

export default function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>(["دسته‌بندی‌ها", "برندها"]);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryTree | null>(
    null,
  );
  const [config, setConfig] = useState<MegaMenuConfig | null>(null);
  const [catConfigs, setCatConfigs] = useState<Map<number, CategoryConfig>>(
    new Map(),
  );

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      fetch("/api/v1/categories?tree=true")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/v1/brands")
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/v1/mega-menu")
        .then((r) => r.json())
        .then((data) => {
          setConfig(data);
          if (data?.tabs) {
            try {
              const parsed = JSON.parse(data.tabs);
              if (Array.isArray(parsed)) setTabs(parsed);
            } catch {}
          }
          if (data?.tabLabels) setTabs(data.tabLabels);
          return data;
        })
        .catch(() => null),
      fetch("/api/v1/mega-menu/categories")
        .then((r) => r.json())
        .then((list) => {
          if (Array.isArray(list)) {
            const map = new Map<number, CategoryConfig>();
            list.forEach((cc: CategoryConfig) => map.set(cc.categoryId, cc));
            setCatConfigs(map);
          }
        })
        .catch(() => {}),
    ]);
    setActiveTab(null);
    setSelectedCategory(null);
  }, [isOpen]);

  useEffect(() => {
    if (tabs.length > 0 && activeTab === null) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  if (!isOpen) return null;

  const isCategoriesTab =
    activeTab === tabs[0] || (tabs.length >= 2 && activeTab === tabs[0]);
  const isBrandsTab = tabs.length >= 2 && activeTab === tabs[1];

  const mainCategories = categories;

  const getCategoryIcon = (catId: number): string => {
    const cc = catConfigs.get(catId);
    return cc?.icon || "tabler:box";
  };

  const getCategorySidebarLinks = (catId: number): SidebarLink[] => {
    const cc = catConfigs.get(catId);
    if (cc?.sidebarLinks) {
      try {
        return JSON.parse(cc.sidebarLinks);
      } catch {}
    }
    return [];
  };

  const getCategorySidebarBanner = (
    catId: number,
  ): { image: string | null; link: string | null } | null => {
    const cc = catConfigs.get(catId);
    if (cc?.sidebarBanner)
      return { image: cc.sidebarBanner, link: cc.sidebarBannerLink };
    return null;
  };

  const globalSidebarLinks: SidebarLink[] = (() => {
    if (config?.sidebarLinks) {
      try {
        return JSON.parse(config.sidebarLinks);
      } catch {}
    }
    return [];
  })();

  const currentSidebarLinks = selectedCategory
    ? getCategorySidebarLinks(selectedCategory.id).length > 0
      ? getCategorySidebarLinks(selectedCategory.id)
      : globalSidebarLinks
    : globalSidebarLinks;

  const currentSidebarBanner = selectedCategory
    ? getCategorySidebarBanner(selectedCategory.id) ||
      (config?.sidebarBanner
        ? { image: config.sidebarBanner, link: config.sidebarBannerLink }
        : null)
    : config?.sidebarBanner
      ? { image: config.sidebarBanner, link: config.sidebarBannerLink }
      : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div
        className="absolute top-full right-0 left-0 z-50 shadow-xl animate-slide-down"
        style={{ background: "#fff" }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div
            className="flex border-b"
            style={{ borderColor: "var(--v-divider)" }}
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-6 py-3 text-sm font-medium transition-all"
                style={{
                  color:
                    activeTab === tab
                      ? "var(--dk-primary)"
                      : "var(--v-text-secondary)",
                  borderBottom:
                    activeTab === tab
                      ? "2px solid var(--dk-primary)"
                      : "2px solid transparent",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex min-h-[350px]">
            {/* Right column */}
            <div
              className="w-56 shrink-0 py-4"
              style={{ borderLeft: "1px solid var(--v-divider)" }}
            >
              {activeTab === tabs[0] ? (
                <div className="space-y-1 px-2">
                  {mainCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-right"
                      style={{
                        background:
                          selectedCategory?.id === cat.id
                            ? "rgba(115,103,240,0.08)"
                            : "transparent",
                        color:
                          selectedCategory?.id === cat.id
                            ? "var(--dk-primary)"
                            : "var(--v-text)",
                      }}
                      onMouseEnter={() => setSelectedCategory(cat)}
                    >
                      <Icon
                        icon={getCategoryIcon(cat.id)}
                        className="w-5 h-5 shrink-0"
                      />
                      <span>{cat.name}</span>
                      <Icon
                        icon="tabler:chevron-left"
                        className="w-4 h-4 mr-auto"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 px-2">
                  {brands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/brands/${brand.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all hover:bg-gray-50"
                    >
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                          style={{
                            background: "rgba(115,103,240,0.1)",
                            color: "var(--dk-primary)",
                          }}
                        >
                          {brand.name[0]}
                        </div>
                      )}
                      <span>{brand.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Left panel */}
            <div className="flex-1 p-6">
              {activeTab === tabs[0] && selectedCategory ? (
                <div className="flex gap-8">
                  {/* Subcategories */}
                  <div className="flex-1">
                    <Link
                      href={`/categories/${selectedCategory.slug}`}
                      onClick={onClose}
                      className="text-sm font-bold mb-3 block hover:text-[var(--dk-primary)]"
                      style={{ color: "var(--v-text)" }}
                    >
                      همه {selectedCategory.name}
                      <Icon
                        icon="tabler:chevron-left"
                        className="w-4 h-4 inline mr-1"
                      />
                    </Link>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCategory.children?.map((child) => (
                        <div key={child.id}>
                          <Link
                            href={`/categories/${child.slug}`}
                            onClick={onClose}
                            className="text-sm font-medium block mb-2 hover:text-[var(--dk-primary)]"
                            style={{ color: "var(--v-text)" }}
                          >
                            {child.name}
                          </Link>
                          {child.children?.slice(0, 4).map((grandchild) => (
                            <Link
                              key={grandchild.id}
                              href={`/categories/${grandchild.slug}`}
                              onClick={onClose}
                              className="text-xs block py-1 hover:text-[var(--dk-primary)]"
                              style={{ color: "var(--v-text-secondary)" }}
                            >
                              {grandchild.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sidebar panel */}
                  {(currentSidebarBanner || currentSidebarLinks.length > 0) && (
                    <div className="w-48 shrink-0">
                      {currentSidebarBanner?.image ? (
                        <div className="rounded-lg overflow-hidden mb-3">
                          <Link
                            href={currentSidebarBanner.link || "#"}
                            onClick={onClose}
                          >
                            <img
                              src={currentSidebarBanner.image}
                              alt="بنر"
                              className="w-full object-cover"
                            />
                          </Link>
                        </div>
                      ) : config?.sidebarTitle ? (
                        <div
                          className="rounded-lg overflow-hidden mb-3"
                          style={{
                            background:
                              "linear-gradient(135deg, #ef4056, #d8364a)",
                          }}
                        >
                          <div className="p-4">
                            <p className="text-white text-sm font-bold">
                              {config.sidebarTitle}
                            </p>
                          </div>
                        </div>
                      ) : null}
                      {currentSidebarLinks.length > 0 && (
                        <div className="space-y-2">
                          {currentSidebarLinks.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href || "/"}
                              onClick={onClose}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:bg-gray-50"
                              style={{ color: "var(--v-text-secondary)" }}
                            >
                              <Icon
                                icon={item.icon || "tabler:link"}
                                className="w-4 h-4"
                              />
                              {item.label}
                              <Icon
                                icon="tabler:chevron-left"
                                className="w-3 h-3 mr-auto"
                              />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : activeTab === tabs[0] ? (
                <div className="flex items-center justify-center h-full">
                  <p style={{ color: "var(--v-text-disabled)" }}>
                    یک دسته را انتخاب کنید
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
