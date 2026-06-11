"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface Menu {
  id: number;
  name: string;
  location: string;
  isActive: boolean;
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
}

interface CategoryConfig {
  id: number;
  categoryId: number;
  icon: string | null;
  iconType: string;
  sidebarBanner: string | null;
  sidebarBannerLink: string | null;
  sidebarLinks: string;
  category?: {
    id: number;
    name: string;
    parentId?: number | null;
    slug?: string;
  };
}

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  slug: string;
  children?: Category[];
}

interface SidebarLink {
  label: string;
  icon: string;
  href: string;
}

function parseSidebarLinks(raw: string): SidebarLink[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function sidebarLinksToText(links: SidebarLink[]): string {
  return links.map((l) => `${l.label}|${l.icon}|${l.href}`).join("\n");
}

function textToSidebarLinks(text: string): SidebarLink[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|");
      return {
        label: parts[0] || "",
        icon: parts[1] || "",
        href: parts[2] || "",
      };
    });
}

function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  const walk = (list: Category[]) => {
    for (const c of list) {
      result.push(c);
      if (c.children?.length) walk(c.children);
    }
  };
  walk(cats);
  return result;
}

export default function MegaMenuPage() {
  const [activeTab, setActiveTab] = useState<"general" | "categories">(
    "general",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCatId, setSavingCatId] = useState<number | null>(null);

  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // General form
  const [menuId, setMenuId] = useState<number | null>(null);
  const [showCategories, setShowCategories] = useState(true);
  const [showBrands, setShowBrands] = useState(true);
  const [tabs, setTabs] = useState("دسته‌بندی‌ها,برندها");
  const [sidebarTitle, setSidebarTitle] = useState("ویژه");
  const [sidebarLinksText, setSidebarLinksText] = useState("");
  const [sidebarBanner, setSidebarBanner] = useState("");
  const [sidebarBannerLink, setSidebarBannerLink] = useState("");

  // Per-category form state (keyed by categoryId)
  const [catIcons, setCatIcons] = useState<Record<number, string>>({});
  const [catIconTypes, setCatIconTypes] = useState<Record<number, string>>({});
  const [catSidebarBanners, setCatSidebarBanners] = useState<
    Record<number, string>
  >({});
  const [catSidebarBannerLinks, setCatSidebarBannerLinks] = useState<
    Record<number, string>
  >({});
  const [catSidebarLinksTexts, setCatSidebarLinksTexts] = useState<
    Record<number, string>
  >({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [config, allMenus, categoryConfigs, allCats] = await Promise.all([
        api.get<MegaMenuConfig | null>("/mega-menu"),
        api.get<Menu[]>("/menus"),
        api.get<CategoryConfig[]>("/mega-menu/categories"),
        api.get<Category[]>("/categories?tree=true"),
      ]);

      setMenus(allMenus);

      if (config) {
        setMenuId(config.menuId);
        setShowCategories(config.showCategories);
        setShowBrands(config.showBrands);
        setTabs(config.tabs);
        setSidebarTitle(config.sidebarTitle ?? "");
        setSidebarLinksText(
          sidebarLinksToText(parseSidebarLinks(config.sidebarLinks)),
        );
        setSidebarBanner(config.sidebarBanner ?? "");
        setSidebarBannerLink(config.sidebarBannerLink ?? "");
      }

      const flatCats = flattenCategories(allCats || []);
      setCategories(flatCats);

      const iconMap: Record<number, string> = {};
      const iconTypeMap: Record<number, string> = {};
      const bannerMap: Record<number, string> = {};
      const bannerLinkMap: Record<number, string> = {};
      const linksTextMap: Record<number, string> = {};

      for (const cc of categoryConfigs || []) {
        iconMap[cc.categoryId] = cc.icon || "";
        iconTypeMap[cc.categoryId] = cc.iconType;
        bannerMap[cc.categoryId] = cc.sidebarBanner || "";
        bannerLinkMap[cc.categoryId] = cc.sidebarBannerLink || "";
        linksTextMap[cc.categoryId] = sidebarLinksToText(
          parseSidebarLinks(cc.sidebarLinks),
        );
      }

      setCatIcons(iconMap);
      setCatIconTypes(iconTypeMap);
      setCatSidebarBanners(bannerMap);
      setCatSidebarBannerLinks(bannerLinkMap);
      setCatSidebarLinksTexts(linksTextMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      await api.put("/mega-menu", {
        menuId,
        showCategories,
        showBrands,
        tabs,
        sidebarTitle: sidebarTitle || null,
        sidebarLinks: JSON.stringify(textToSidebarLinks(sidebarLinksText)),
        sidebarBanner: sidebarBanner || null,
        sidebarBannerLink: sidebarBannerLink || null,
      });
      alert("تنظیمات با موفقیت ذخیره شد");
    } catch (err: any) {
      alert(err.message || "خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategoryConfig = async (categoryId: number) => {
    setSavingCatId(categoryId);
    try {
      await api.put(`/mega-menu/categories/${categoryId}`, {
        icon: catIcons[categoryId] || null,
        iconType: catIconTypes[categoryId] || "iconify",
        sidebarBanner: catSidebarBanners[categoryId] || null,
        sidebarBannerLink: catSidebarBannerLinks[categoryId] || null,
        sidebarLinks: JSON.stringify(
          textToSidebarLinks(catSidebarLinksTexts[categoryId] || ""),
        ),
      });
      alert("تنظیمات دسته با موفقیت ذخیره شد");
    } catch (err: any) {
      alert(err.message || "خطا در ذخیره تنظیمات");
    } finally {
      setSavingCatId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--v-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            تنظیمات مگا منو
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            مدیریت ظاهر و محتوای منوی اصلی
          </p>
        </div>
        {activeTab === "general" && (
          <button
            onClick={handleSaveGeneral}
            disabled={saving}
            className="v-btn v-btn-primary"
          >
            <Icon
              icon={saving ? "tabler:loader-2" : "tabler:device-floppy"}
              className={`w-4 h-4 ${saving ? "animate-spin" : ""}`}
            />
            {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide"
        style={{ borderBottom: "1px solid var(--v-divider)" }}
      >
        {[
          {
            id: "general" as const,
            label: "تنظیمات کلی",
            icon: "tabler:settings",
          },
          {
            id: "categories" as const,
            label: "تنظیمات دسته‌ها",
            icon: "tabler:category",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap rounded-t-lg transition-all"
            style={{
              color:
                activeTab === tab.id
                  ? "var(--v-primary)"
                  : "var(--v-text-secondary)",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid var(--v-primary)"
                  : "2px solid transparent",
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            <Icon icon={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: General */}
      {activeTab === "general" && (
        <div className="v-card p-6">
          <div className="max-w-2xl space-y-5">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--v-text)" }}
              >
                منوی مگامنو
              </label>
              <select
                className="v-select"
                value={menuId ?? ""}
                onChange={(e) =>
                  setMenuId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">انتخاب کنید</option>
                {menus
                  .filter((m) => m.isActive)
                  .map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name} ({menu.location})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showCategories"
                className="w-4 h-4"
                checked={showCategories}
                onChange={(e) => setShowCategories(e.target.checked)}
              />
              <label
                htmlFor="showCategories"
                className="text-sm font-medium"
                style={{ color: "var(--v-text)" }}
              >
                نمایش دسته‌بندی‌ها
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showBrands"
                className="w-4 h-4"
                checked={showBrands}
                onChange={(e) => setShowBrands(e.target.checked)}
              />
              <label
                htmlFor="showBrands"
                className="text-sm font-medium"
                style={{ color: "var(--v-text)" }}
              >
                نمایش برندها
              </label>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--v-text)" }}
              >
                عنوان تب‌ها
              </label>
              <input
                className="v-input"
                value={tabs}
                onChange={(e) => setTabs(e.target.value)}
                placeholder="دسته‌بندی‌ها,برندها"
              />
              <p
                className="text-xs mt-1"
                style={{ color: "var(--v-text-secondary)" }}
              >
                مقادیر جدا شده با کاما
              </p>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--v-text)" }}
              >
                عنوان پنل کناری
              </label>
              <input
                className="v-input"
                value={sidebarTitle}
                onChange={(e) => setSidebarTitle(e.target.value)}
                placeholder="ویژه"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--v-text)" }}
              >
                لینک‌های پنل کناری (هر خط: عنوان|آیکون|لینک)
              </label>
              <textarea
                className="v-input min-h-[120px]"
                value={sidebarLinksText}
                onChange={(e) => setSidebarLinksText(e.target.value)}
                placeholder="پیشنهاد ویژه|tabler:star|/offers"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--v-text)" }}
              >
                بنر پنل کناری
              </label>
              <input
                className="v-input"
                value={sidebarBanner}
                onChange={(e) => setSidebarBanner(e.target.value)}
                placeholder="https://..."
              />
              <p
                className="text-xs mt-1"
                style={{ color: "var(--v-text-secondary)" }}
              >
                سایز پیشنهادی: 300×400
              </p>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--v-text)" }}
              >
                لینک بنر پنل کناری
              </label>
              <input
                className="v-input"
                value={sidebarBannerLink}
                onChange={(e) => setSidebarBannerLink(e.target.value)}
                placeholder="/promotions"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Categories */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="v-card p-12 text-center">
              <Icon
                icon="tabler:category"
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: "var(--v-text-disabled)" }}
              />
              <p style={{ color: "var(--v-text-secondary)" }}>
                هیچ دسته‌بندی‌ای یافت نشد.
              </p>
            </div>
          ) : (
            categories
              .filter((c) => !c.parentId)
              .map((cat) => (
                <CategoryConfigCard
                  key={cat.id}
                  category={cat}
                  icon={catIcons[cat.id] || ""}
                  iconType={catIconTypes[cat.id] || "iconify"}
                  sidebarBanner={catSidebarBanners[cat.id] || ""}
                  sidebarBannerLink={catSidebarBannerLinks[cat.id] || ""}
                  sidebarLinksText={catSidebarLinksTexts[cat.id] || ""}
                  saving={savingCatId === cat.id}
                  onIconChange={(v) =>
                    setCatIcons((prev) => ({ ...prev, [cat.id]: v }))
                  }
                  onIconTypeChange={(v) =>
                    setCatIconTypes((prev) => ({ ...prev, [cat.id]: v }))
                  }
                  onSidebarBannerChange={(v) =>
                    setCatSidebarBanners((prev) => ({ ...prev, [cat.id]: v }))
                  }
                  onSidebarBannerLinkChange={(v) =>
                    setCatSidebarBannerLinks((prev) => ({
                      ...prev,
                      [cat.id]: v,
                    }))
                  }
                  onSidebarLinksTextChange={(v) =>
                    setCatSidebarLinksTexts((prev) => ({
                      ...prev,
                      [cat.id]: v,
                    }))
                  }
                  onSave={() => handleSaveCategoryConfig(cat.id)}
                />
              ))
          )}
        </div>
      )}
    </div>
  );
}

function CategoryConfigCard({
  category,
  icon,
  iconType,
  sidebarBanner,
  sidebarBannerLink,
  sidebarLinksText,
  saving,
  onIconChange,
  onIconTypeChange,
  onSidebarBannerChange,
  onSidebarBannerLinkChange,
  onSidebarLinksTextChange,
  onSave,
}: {
  category: Category;
  icon: string;
  iconType: string;
  sidebarBanner: string;
  sidebarBannerLink: string;
  sidebarLinksText: string;
  saving: boolean;
  onIconChange: (v: string) => void;
  onIconTypeChange: (v: string) => void;
  onSidebarBannerChange: (v: string) => void;
  onSidebarBannerLinkChange: (v: string) => void;
  onSidebarLinksTextChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="v-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && iconType === "iconify" ? (
            <Icon
              icon={icon}
              className="w-5 h-5"
              style={{ color: "var(--v-primary)" }}
            />
          ) : icon ? (
            <img src={icon} alt="" className="w-5 h-5 rounded" />
          ) : null}
          <h3
            className="font-bold text-base"
            style={{ color: "var(--v-text)" }}
          >
            {category.name}
          </h3>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="v-btn v-btn-primary v-btn-sm"
        >
          <Icon
            icon={saving ? "tabler:loader-2" : "tabler:device-floppy"}
            className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`}
          />
          {saving ? "..." : "ذخیره"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--v-text)" }}
          >
            آیکون (Iconify)
          </label>
          <div className="flex gap-2">
            <input
              className="v-input flex-1"
              value={icon}
              onChange={(e) => onIconChange(e.target.value)}
              placeholder="tabler:box"
            />
          </div>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            نام آیکون از Iconify
          </p>
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--v-text)" }}
          >
            نوع آیکون
          </label>
          <select
            className="v-select"
            value={iconType}
            onChange={(e) => onIconTypeChange(e.target.value)}
          >
            <option value="iconify">Iconify</option>
            <option value="image">تصویر</option>
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--v-text)" }}
          >
            بنر پنل کناری دسته
          </label>
          <input
            className="v-input"
            value={sidebarBanner}
            onChange={(e) => onSidebarBannerChange(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--v-text)" }}
          >
            لینک بنر دسته
          </label>
          <input
            className="v-input"
            value={sidebarBannerLink}
            onChange={(e) => onSidebarBannerLinkChange(e.target.value)}
            placeholder="/category/..."
          />
        </div>
      </div>
      <div className="mt-4">
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--v-text)" }}
        >
          لینک‌های پنل کناری (هر خط: عنوان|آیکون|لینک)
        </label>
        <textarea
          className="v-input min-h-[100px]"
          value={sidebarLinksText}
          onChange={(e) => onSidebarLinksTextChange(e.target.value)}
          placeholder="جعبه جادویی|tabler:gift|/magic-box"
        />
      </div>
    </div>
  );
}
