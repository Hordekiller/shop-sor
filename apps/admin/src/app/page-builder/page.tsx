"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import { toJalaliDateTime } from "@/lib/date";

function toSlug(text: string) {
  return (
    text
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\u0600-\u06FF\-]/g, "")
      .toLowerCase() || ""
  );
}

const WIDGET_TYPES: {
  type: string;
  label: string;
  icon: string;
  group: string;
}[] = [
  { type: "heading", label: "تیتر", icon: "tabler:typography", group: "عمومی" },
  {
    type: "text",
    label: "متن",
    icon: "tabler:file-description",
    group: "عمومی",
  },
  { type: "image", label: "تصویر", icon: "tabler:photo", group: "عمومی" },
  { type: "button", label: "دکمه", icon: "tabler:button", group: "عمومی" },
  {
    type: "spacer",
    label: "فاصله‌گذار",
    icon: "tabler:arrows-vertical",
    group: "عمومی",
  },
  {
    type: "icon_box",
    label: "آیکون + متن",
    icon: "tabler:box",
    group: "عمومی",
  },
  { type: "video", label: "ویدیو", icon: "tabler:video", group: "عمومی" },
  { type: "accordion", label: "آکاردئون", icon: "tabler:list", group: "عمومی" },
  { type: "tabs", label: "تب", icon: "tabler:layout-tabs", group: "عمومی" },
  {
    type: "gallery",
    label: "گالری",
    icon: "tabler:layout-grid",
    group: "عمومی",
  },
  {
    type: "banner_slider",
    label: "اسلایدر بنر",
    icon: "tabler:slideshow",
    group: "عمومی",
  },
  {
    type: "product_carousel",
    label: "کاروسل محصول",
    icon: "tabler:shopping-cart",
    group: "فروشگاه",
  },
  {
    type: "product_grid",
    label: "گرید محصولات",
    icon: "tabler:layout-grid",
    group: "فروشگاه",
  },
  {
    type: "category_nav",
    label: "دسته‌بندی‌ها",
    icon: "tabler:category",
    group: "فروشگاه",
  },
  {
    type: "brand_slider",
    label: "برندها",
    icon: "tabler:brand-tabler",
    group: "فروشگاه",
  },
  {
    type: "countdown",
    label: "تایمر معکوس",
    icon: "tabler:clock",
    group: "فروشگاه",
  },
  {
    type: "blog_posts",
    label: "مقالات",
    icon: "tabler:article",
    group: "وبلاگ",
  },
];

const WIDGET_DEFAULTS: Record<string, any> = {
  heading: {
    text: "تیتر جدید",
    typography: {
      font_id: null,
      size: 24,
      weight: 700,
      line_height: 1.4,
      letter_spacing: 0,
      align: "right",
    },
    color: { mode: "global", token: "text" },
  },
  text: {
    html: "<p>متن خود را وارد کنید</p>",
    typography: {
      font_id: null,
      size: 14,
      weight: 400,
      line_height: 1.8,
      letter_spacing: 0,
      align: "right",
    },
    color: { mode: "global", token: "text" },
  },
  image: { image: { media_id: "", alt: "" }, lazy: true },
  button: {
    text: "کلیک کنید",
    link: { url: "#", target: "_self" },
    bg: { mode: "global", token: "primary" },
    text_color: { mode: "custom", value: "#ffffff" },
    size: "md",
    full_width: false,
  },
  spacer: { height: 32 },
  icon_box: {
    icon: "tabler:star",
    title: "عنوان",
    color: { mode: "global", token: "primary" },
  },
  video: { source: "youtube", url: "", autoplay: false, muted: false },
  accordion: {
    items: [{ title: "سوال اول", content_html: "<p>پاسخ سوال اول</p>" }],
    allow_multiple: false,
    style: "chevron",
  },
  tabs: {
    tabs: [{ label: "تب ۱", content_html: "<p>محتوای تب ۱</p>" }],
    orientation: "horizontal",
  },
  gallery: { images: [], columns: 3, gap: 8, lightbox: true },
  banner_slider: {
    slides: [
      { image: { media_id: "", alt: "" }, link: { url: "#", target: "_self" } },
    ],
    autoplay: true,
    loop: true,
    height_desktop: 400,
    height_mobile: 250,
    navigation: "both",
  },
  product_carousel: {
    title: "محصولات",
    data: { mode: "auto", filter: { by: "newest" }, limit: 10 },
    auto_play: false,
    loop: false,
    show_price: true,
    show_discount: true,
    show_cart_btn: false,
  },
  product_grid: {
    data: { mode: "auto", filter: { by: "newest" }, limit: 12 },
    columns: 4,
    gap: 16,
    pagination: false,
    sort_options: false,
  },
  category_nav: {
    categories: [],
    type: "circle",
    text_style: {
      font_id: null,
      size: 12,
      weight: 400,
      line_height: 1.2,
      letter_spacing: 0,
      align: "center",
    },
  },
  brand_slider: { brand_ids: [], grayscale: false, speed: 3 },
  countdown: {
    target_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    title: "پیشنهاد شگفت‌انگیز",
    style: "blocks",
  },
  blog_posts: {
    data: { mode: "auto", filter: { by: "newest" }, limit: 6 },
    layout: "grid",
    show_excerpt: true,
    show_meta: true,
  },
};

function uuid() {
  return Math.random().toString(36).substring(2, 11);
}

function createDefaultSection(): any {
  return {
    id: uuid(),
    settings: {
      max_width: 1200,
      full_width: false,
      padding: { top: 24, right: 16, bottom: 24, left: 16 },
    },
    columns: [
      {
        id: uuid(),
        settings: { width_ratio: 1, vertical_align: "top", gap: 16 },
        widgets: [],
      },
    ],
  };
}

function createWidget(type: string, variant: number = 1): any {
  return {
    id: uuid(),
    type,
    variant,
    settings: JSON.parse(JSON.stringify(WIDGET_DEFAULTS[type] || {})),
    style: {
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    responsive: {
      desktop: { visible: true },
      tablet: {},
      mobile: {},
    },
  };
}

interface PageItem {
  id: number;
  title: string;
  slug: string;
  type: string;
  status: string;
  contentJson?: string;
  content?: string;
  metaTitle?: string;
  metaDesc?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const pageTypeLabels: Record<string, string> = {
  landing: "لندینگ",
  blog_post: "مقاله",
  shop_landing: "فروشگاه",
  category_page: "دسته",
  custom: "سفارشی",
};
const pageTypeIcons: Record<string, string> = {
  landing: "tabler:building",
  blog_post: "tabler:article",
  shop_landing: "tabler:shopping-cart",
  category_page: "tabler:category",
  custom: "tabler:file",
};

export default function PageBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null,
  );

  // Editor state
  const [pageForm, setPageForm] = useState({
    title: "",
    slug: "",
    type: "landing",
    status: "draft",
    metaTitle: "",
    metaDesc: "",
  });
  const [sections, setSections] = useState<any[]>([]);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const [past, setPast] = useState<any[][]>([]);
  const [future, setFuture] = useState<any[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showWidgetLib, setShowWidgetLib] = useState<string | false>(false);
  const [widgetFilter, setWidgetFilter] = useState("");
  const [activeTab, setActiveTab] = useState<
    "content" | "style" | "responsive"
  >("content");
  const [revisions, setRevisions] = useState<any[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [showPageSettings, setShowPageSettings] = useState(false);

  const MAX_HISTORY = 50;

  const mutateSections = useCallback((updater: (prev: any[]) => any[]) => {
    setPast((prev) => {
      const next = [...prev, sectionsRef.current];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setFuture([]);
    setSections(updater);
  }, []);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const newPast = [...prevPast];
      const prev = newPast.pop()!;
      setFuture((f) => [...f, sectionsRef.current]);
      setSections(prev);
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const newFuture = [...prevFuture];
      const next = newFuture.pop()!;
      setPast((p) => {
        const updated = [...p, sectionsRef.current];
        if (updated.length > MAX_HISTORY) updated.shift();
        return updated;
      });
      setSections(next);
      return newFuture;
    });
  }, []);

  // Initial load
  useEffect(() => {
    api
      .get<PageItem[]>("/pages")
      .then(setPages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load page for editing
  useEffect(() => {
    if (editId === "new") {
      setPageForm({
        title: "",
        slug: "",
        type: "landing",
        status: "draft",
        metaTitle: "",
        metaDesc: "",
      });
      setSections([createDefaultSection()]);
      setPast([]);
      setFuture([]);
      setSelectedId(null);
      return;
    }
    if (editId) {
      api
        .get<PageItem>(`/pages/${editId}`)
        .then((p) => {
          setPageForm({
            title: p.title,
            slug: p.slug,
            type: p.type,
            status: p.status,
            metaTitle: p.metaTitle || "",
            metaDesc: p.metaDesc || "",
          });
          if (p.contentJson) {
            try {
              const s = JSON.parse(p.contentJson).sections || [];
              setSections(s);
              setPast([]);
              setFuture([]);
            } catch {
              setSections([]);
              setPast([]);
              setFuture([]);
            }
          } else {
            setSections([]);
            setPast([]);
            setFuture([]);
          }
          setSelectedId(null);
        })
        .catch(() => router.push("/page-builder"));
    }
  }, [editId, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  // Load revisions
  const loadRevisions = useCallback(async () => {
    if (!editId || editId === "new") return;
    setLoadingRevisions(true);
    try {
      const data = await api.get<any[]>(`/pages/${editId}/revisions`);
      setRevisions(data);
    } catch {
      /* silent */
    } finally {
      setLoadingRevisions(false);
    }
  }, [editId]);

  // Save page
  const handleSave = async (publish: boolean = false) => {
    setSaving(true);
    setMessage(null);
    try {
      const contentJson = JSON.stringify({ schema_version: 1, sections });
      const status = publish ? "published" : pageForm.status;
      const slug = pageForm.slug || toSlug(pageForm.title);
      const payload = { ...pageForm, slug, status, contentJson };
      if (editId && editId !== "new") {
        await api.put(`/pages/${editId}`, payload);
        setMessage({ type: "success", text: "صفحه ذخیره شد" });
      } else {
        const created = await api.post<PageItem>("/pages", payload);
        router.push(`/page-builder?edit=${created.id}`);
        setMessage({ type: "success", text: "صفحه ایجاد شد" });
      }
      api.get<PageItem[]>("/pages").then(setPages);
    } catch (e: any) {
      setMessage({ type: "error", text: e?.message || "خطا در ذخیره" });
    } finally {
      setSaving(false);
    }
  };

  // Find selected item and its path
  const findItem = (
    id: string,
  ): {
    item: any;
    path: string[];
    sectionIdx: number;
    colIdx: number;
    wIdx: number;
  } | null => {
    for (let si = 0; si < sections.length; si++) {
      const sec = sections[si];
      if (sec.id === id)
        return {
          item: sec,
          path: ["section"],
          sectionIdx: si,
          colIdx: -1,
          wIdx: -1,
        };
      for (let ci = 0; ci < (sec.columns || []).length; ci++) {
        const col = sec.columns[ci];
        if (col.id === id)
          return {
            item: col,
            path: ["column"],
            sectionIdx: si,
            colIdx: ci,
            wIdx: -1,
          };
        for (let wi = 0; wi < (col.widgets || []).length; wi++) {
          const w = col.widgets[wi];
          if (w.id === id)
            return {
              item: w,
              path: ["widget"],
              sectionIdx: si,
              colIdx: ci,
              wIdx: wi,
            };
        }
      }
    }
    return null;
  };

  const selected = selectedId ? findItem(selectedId) : null;

  // Mutate a widget
  const updateWidget = (
    si: number,
    ci: number,
    wi: number,
    updater: (w: any) => any,
  ) => {
    mutateSections((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[si].columns[ci].widgets[wi] = updater(
        next[si].columns[ci].widgets[wi],
      );
      return next;
    });
  };

  const updateSection = (si: number, updater: (s: any) => any) => {
    mutateSections((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[si] = updater(next[si]);
      return next;
    });
  };

  const addSection = () => {
    mutateSections((prev) => [...prev, createDefaultSection()]);
    setShowWidgetLib(false);
  };

  const addWidget = (type: string, sectionIdx: number, colIdx: number = 0) => {
    const widget = createWidget(type, 1);
    mutateSections((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[sectionIdx].columns[colIdx].widgets)
        next[sectionIdx].columns[colIdx].widgets = [];
      next[sectionIdx].columns[colIdx].widgets.push(widget);
      return next;
    });
    setShowWidgetLib(false);
  };

  const removeItem = (id: string) => {
    mutateSections((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      for (let si = 0; si < next.length; si++) {
        if (next[si].id === id) {
          next.splice(si, 1);
          return next;
        }
        for (let ci = 0; ci < (next[si].columns || []).length; ci++) {
          if (next[si].columns[ci].id === id) {
            next[si].columns.splice(ci, 1);
            if (next[si].columns.length === 0)
              next[si].columns.push(createDefaultSection().columns[0]);
            return next;
          }
          for (
            let wi = 0;
            wi < (next[si].columns[ci].widgets || []).length;
            wi++
          ) {
            if (next[si].columns[ci].widgets[wi].id === id) {
              next[si].columns[ci].widgets.splice(wi, 1);
              return next;
            }
          }
        }
      }
      return next;
    });
    setSelectedId(null);
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    mutateSections((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      for (let si = 0; si < next.length; si++) {
        if (next[si].id === id) {
          const idx = next.findIndex((s: any) => s.id === id);
          if (direction === "up" && idx > 0) {
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
          }
          if (direction === "down" && idx < next.length - 1) {
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
          }
          return next;
        }
        for (let ci = 0; ci < (next[si].columns || []).length; ci++) {
          for (
            let wi = 0;
            wi < (next[si].columns[ci].widgets || []).length;
            wi++
          ) {
            if (next[si].columns[ci].widgets[wi].id === id) {
              const widgets = next[si].columns[ci].widgets;
              if (direction === "up" && wi > 0) {
                [widgets[wi - 1], widgets[wi]] = [widgets[wi], widgets[wi - 1]];
              }
              if (direction === "down" && wi < widgets.length - 1) {
                [widgets[wi], widgets[wi + 1]] = [widgets[wi + 1], widgets[wi]];
              }
              return next;
            }
          }
        }
      }
      return next;
    });
  };

  // ─── Page List View ───
  if (!editId) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold" style={{ color: "var(--v-text)" }}>
            صفحه‌ساز
          </h1>
          <button
            onClick={() => router.push("/page-builder?edit=new")}
            className="v-btn-primary text-sm"
          >
            <Icon icon="tabler:plus" className="w-4 h-4" />
            صفحه جدید
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{
                borderColor: "var(--v-primary)",
                borderTopColor: "transparent",
              }}
            />
          </div>
        ) : (
          <div className="v-card overflow-hidden">
            <table className="v-table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>نوع</th>
                  <th>وضعیت</th>
                  <th>با صفحه‌ساز</th>
                  <th>تاریخ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {pages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-sm py-12"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      هیچ صفحه‌ای وجود ندارد
                    </td>
                  </tr>
                ) : (
                  pages.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.title}</td>
                      <td>
                        <span className="v-badge v-badge-info">
                          {pageTypeLabels[p.type] || p.type}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            p.status === "published"
                              ? "v-badge v-badge-success"
                              : "v-badge v-badge-secondary"
                          }
                        >
                          {p.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                        </span>
                      </td>
                      <td>
                        {p.contentJson ? (
                          <span className="v-badge v-badge-success">فعال</span>
                        ) : (
                          <span className="v-badge v-badge-secondary">
                            ندارد
                          </span>
                        )}
                      </td>
                      <td
                        className="text-sm"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        {p.updatedAt
                          ? new Date(p.updatedAt).toLocaleDateString("fa-IR")
                          : "-"}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              router.push(`/page-builder?edit=${p.id}`)
                            }
                            className="v-btn-icon"
                            title="ویرایش با صفحه‌ساز"
                          >
                            <Icon icon="tabler:layout" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/pages?edit=${p.id}`)}
                            className="v-btn-icon"
                            title="ویرایش معمولی"
                          >
                            <Icon icon="tabler:edit" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ─── Page Builder Editor ───
  const isNew = editId === "new";

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/page-builder")}
            className="v-btn-icon"
            title="بازگشت"
          >
            <Icon icon="tabler:arrow-right" className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={pageForm.title}
            onChange={(e) => {
              const title = e.target.value;
              setPageForm((prev) => ({
                ...prev,
                title,
                slug: prev.slug || toSlug(title),
              }));
            }}
            placeholder="عنوان صفحه"
            className="v-input text-lg font-bold w-64"
          />
          <select
            value={pageForm.type}
            onChange={(e) => setPageForm({ ...pageForm, type: e.target.value })}
            className="v-select text-sm w-32"
          >
            {Object.entries(pageTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowPageSettings(true)}
            className="v-btn text-sm"
            title="تنظیمات صفحه"
          >
            <Icon icon="tabler:settings" className="w-4 h-4" />
            تنظیمات
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadRevisions();
              setShowRevisions((v) => !v);
            }}
            className={`v-btn text-sm ${showRevisions ? "bg-[var(--v-primary)]/10" : ""}`}
            title="تاریخچه نسخه‌ها"
          >
            <Icon icon="tabler:history" className="w-4 h-4" />
            نسخه‌ها
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="v-btn-icon"
            title="واگردانی (Ctrl+Z)"
          >
            <Icon icon="tabler:arrow-back-up" className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="v-btn-icon"
            title="بازگردانی (Ctrl+Y)"
          >
            <Icon icon="tabler:arrow-forward-up" className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={async () => {
              if (!pageForm.title) {
                setMessage({
                  type: "error",
                  text: "لطفا ابتدا عنوان صفحه را وارد کنید",
                });
                return;
              }
              await handleSave(false);
              if (editId && editId !== "new") {
                window.open(`/page/preview/${editId}`, "_blank");
              } else {
                const slug = pageForm.slug || toSlug(pageForm.title);
                window.open(`/page/${slug}`, "_blank");
              }
            }}
            className="v-btn text-sm"
          >
            <Icon icon="tabler:eye" className="w-4 h-4" />
            پیش‌نمایش
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="v-btn text-sm"
          >
            <Icon
              icon={saving ? "tabler:loader-2" : "tabler:device-floppy"}
              className={`w-4 h-4 ${saving ? "animate-spin" : ""}`}
            />
            ذخیره
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="v-btn-primary text-sm"
          >
            <Icon icon="tabler:send" className="w-4 h-4" />
            انتشار
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`shrink-0 rounded-xl px-4 py-2 mb-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      {/* 3-panel editor */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* LEFT: Widget Library */}
        <div className="w-56 shrink-0 flex flex-col">
          <div className="v-card p-3 flex-1 overflow-y-auto">
            <h3
              className="text-xs font-bold mb-3"
              style={{ color: "var(--v-text-secondary)" }}
            >
              افزودن بلوک
            </h3>
            <input
              type="text"
              value={widgetFilter}
              onChange={(e) => setWidgetFilter(e.target.value)}
              placeholder="جستجوی ویجت..."
              className="v-input text-xs mb-3"
            />

            <button
              onClick={addSection}
              className="w-full text-right px-3 py-2 rounded-lg text-sm mb-3 hover:bg-[var(--v-bg)] transition flex items-center gap-2"
              style={{ border: "1px dashed var(--v-border)" }}
            >
              <Icon
                icon="tabler:section"
                className="w-4 h-4 shrink-0"
                style={{ color: "var(--v-primary)" }}
              />
              <span>بخش جدید</span>
            </button>

            {(() => {
              const groups = [...new Set(WIDGET_TYPES.map((w) => w.group))];
              const filtered = widgetFilter
                ? WIDGET_TYPES.filter(
                    (w) =>
                      w.label.includes(widgetFilter) ||
                      w.type.includes(widgetFilter),
                  )
                : WIDGET_TYPES;
              return groups.map((group) => {
                const items = filtered.filter((w) => w.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} className="mb-3">
                    <p
                      className="text-[10px] font-bold mb-1.5 uppercase tracking-wider"
                      style={{ color: "var(--v-text-disabled)" }}
                    >
                      {group}
                    </p>
                    {items.map((w) => (
                      <button
                        key={w.type}
                        onClick={() => {
                          if (sections.length > 0) addWidget(w.type, 0, 0);
                          else addSection();
                        }}
                        title={`افزودن ${w.label}`}
                        className="w-full text-right px-2 py-1.5 rounded-lg text-xs hover:bg-[var(--v-bg)] transition flex items-center gap-2"
                        style={{ color: "var(--v-text)" }}
                      >
                        <Icon
                          icon={w.icon}
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: "var(--v-primary)" }}
                        />
                        {w.label}
                      </button>
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* CENTER: Structure Tree */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="v-card flex-1 p-4 overflow-y-auto">
            {sections.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Icon
                    icon="tabler:layout"
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: "var(--v-text-disabled)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    برای شروع یک بخش اضافه کنید
                  </p>
                  <button
                    onClick={addSection}
                    className="v-btn-primary text-sm mt-4"
                  >
                    <Icon icon="tabler:plus" className="w-4 h-4" />
                    افزودن بخش
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((sec, si) => (
                  <div
                    key={sec.id}
                    className={`rounded-xl border-2 p-3 transition ${selectedId === sec.id ? "border-[var(--v-primary)]" : "border-[var(--v-border)] hover:border-[var(--v-primary)]/30"}`}
                    onClick={() => setSelectedId(sec.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="tabler:section"
                          className="w-4 h-4"
                          style={{ color: "var(--v-primary)" }}
                        />
                        <span className="text-xs font-bold">بخش {si + 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveItem(sec.id, "up");
                          }}
                          className="v-btn-icon"
                          title="بالا"
                        >
                          <Icon
                            icon="tabler:chevron-up"
                            className="w-3.5 h-3.5"
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveItem(sec.id, "down");
                          }}
                          className="v-btn-icon"
                          title="پایین"
                        >
                          <Icon
                            icon="tabler:chevron-down"
                            className="w-3.5 h-3.5"
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addSection();
                          }}
                          className="v-btn-icon"
                          title="کپی"
                        >
                          <Icon icon="tabler:copy" className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(sec.id);
                          }}
                          className="v-btn-icon"
                          title="حذف"
                          style={{ color: "var(--v-error)" }}
                        >
                          <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Columns */}
                    <div className="flex gap-1.5" style={{ minHeight: 60 }}>
                      {(sec.columns || []).map((col: any, ci: number) => (
                        <div
                          key={col.id}
                          style={{ flex: col.settings?.width_ratio || 1 }}
                          className={`rounded-lg border border-dashed p-2 ${selectedId === col.id ? "border-[var(--v-primary)] bg-[var(--v-primary)]/5" : "border-gray-200"}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(col.id);
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-[10px] font-medium"
                              style={{ color: "var(--v-text-secondary)" }}
                            >
                              ستون{" "}
                              {(sec.columns || []).length > 1
                                ? `${ci + 1}/${sec.columns.length}`
                                : ""}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowWidgetLib("modal");
                                }}
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{
                                  background: "var(--v-primary)",
                                  color: "#fff",
                                }}
                              >
                                +
                              </button>
                              {sec.columns.length < 4 &&
                                ci === sec.columns.length - 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      mutateSections((prev) => {
                                        const next = JSON.parse(
                                          JSON.stringify(prev),
                                        );
                                        next[si].columns.push({
                                          id: uuid(),
                                          settings: {
                                            width_ratio: 1,
                                            vertical_align: "top",
                                            gap: 16,
                                          },
                                          widgets: [],
                                        });
                                        return next;
                                      });
                                    }}
                                    className="text-[10px] px-1.5 py-0.5 rounded"
                                    style={{
                                      background: "var(--v-border)",
                                      color: "var(--v-text-secondary)",
                                    }}
                                    title="افزودن ستون"
                                  >
                                    <Icon
                                      icon="tabler:plus"
                                      className="w-2.5 h-2.5"
                                    />
                                  </button>
                                )}
                              {sec.columns.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeItem(col.id);
                                  }}
                                  className="text-[10px] px-1.5 py-0.5 rounded"
                                  style={{
                                    background: "rgba(255,76,81,0.1)",
                                    color: "var(--v-error)",
                                  }}
                                  title="حذف ستون"
                                >
                                  <Icon
                                    icon="tabler:x"
                                    className="w-2.5 h-2.5"
                                  />
                                </button>
                              )}
                            </div>
                          </div>

                          {!col.widgets || col.widgets.length === 0 ? (
                            <div
                              className="text-[10px] text-center py-3"
                              style={{ color: "var(--v-text-disabled)" }}
                            >
                              خالی
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {col.widgets.map((w: any, wi: number) => {
                                const wDef = WIDGET_TYPES.find(
                                  (wt) => wt.type === w.type,
                                );
                                return (
                                  <div
                                    key={w.id}
                                    className={`rounded-lg px-2 py-1.5 text-xs cursor-pointer flex items-center justify-between gap-1 ${selectedId === w.id ? "bg-[var(--v-primary)] text-white" : "bg-[var(--v-bg)]"}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedId(w.id);
                                    }}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Icon
                                        icon={wDef?.icon || "tabler:box"}
                                        className="w-3 h-3 shrink-0"
                                      />
                                      <span className="truncate">
                                        {wDef?.label || w.type}
                                      </span>
                                      <span className="text-[9px] opacity-60 shrink-0">
                                        v{w.variant}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveItem(w.id, "up");
                                        }}
                                        className="hover:opacity-70"
                                      >
                                        <Icon
                                          icon="tabler:chevron-up"
                                          className="w-3 h-3"
                                        />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveItem(w.id, "down");
                                        }}
                                        className="hover:opacity-70"
                                      >
                                        <Icon
                                          icon="tabler:chevron-down"
                                          className="w-3 h-3"
                                        />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeItem(w.id);
                                        }}
                                        className="hover:opacity-70"
                                      >
                                        <Icon
                                          icon="tabler:x"
                                          className="w-3 h-3"
                                        />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Settings Panel */}
        <div className="w-72 shrink-0">
          <div className="v-card p-4 h-full overflow-y-auto">
            {!selected ? (
              <div className="text-center py-8">
                <Icon
                  icon="tabler:settings"
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "var(--v-text-disabled)" }}
                />
                <p
                  className="text-xs"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  یک المان را انتخاب کنید
                </p>
              </div>
            ) : selected.path[0] === "section" ? (
              <div>
                <h3 className="text-sm font-bold mb-4">تنظیمات بخش</h3>
                <div className="space-y-3">
                  <label className="v-label">حداکثر عرض (px)</label>
                  <input
                    type="number"
                    value={selected.item.settings.max_width || 1200}
                    onChange={(e) => {
                      const v = +e.target.value;
                      updateSection(selected.sectionIdx, (s) => ({
                        ...s,
                        settings: { ...s.settings, max_width: v },
                      }));
                    }}
                    className="v-input"
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.item.settings.full_width || false}
                      onChange={(e) =>
                        updateSection(selected.sectionIdx, (s) => ({
                          ...s,
                          settings: {
                            ...s.settings,
                            full_width: e.target.checked,
                          },
                        }))
                      }
                      className="accent-[var(--v-primary)]"
                    />
                    <span className="text-sm">تمام‌عرض</span>
                  </label>
                  <div className="border-t my-2" />
                  <p
                    className="text-xs font-bold"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    پس‌زمینه
                  </p>
                  <select
                    value={selected.item.settings.background?.mode || "none"}
                    onChange={(e) =>
                      updateSection(selected.sectionIdx, (s) => ({
                        ...s,
                        settings: {
                          ...s.settings,
                          background:
                            e.target.value === "none"
                              ? undefined
                              : { mode: e.target.value, value: "#ffffff" },
                        },
                      }))
                    }
                    className="v-select"
                  >
                    <option value="none">بدون پس‌زمینه</option>
                    <option value="color">رنگ ساده</option>
                    <option value="gradient">گرادینت</option>
                  </select>
                  {selected.item.settings.background?.mode === "color" && (
                    <div>
                      <label className="v-label">رنگ پس‌زمینه</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={
                            selected.item.settings.background?.value ||
                            "#ffffff"
                          }
                          onChange={(e) =>
                            updateSection(selected.sectionIdx, (s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: {
                                  ...s.settings.background,
                                  value: e.target.value,
                                },
                              },
                            }))
                          }
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={
                            selected.item.settings.background?.value ||
                            "#ffffff"
                          }
                          onChange={(e) =>
                            updateSection(selected.sectionIdx, (s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: {
                                  ...s.settings.background,
                                  value: e.target.value,
                                },
                              },
                            }))
                          }
                          className="v-input flex-1"
                        />
                      </div>
                    </div>
                  )}
                  {selected.item.settings.background?.mode === "gradient" && (
                    <div className="space-y-2">
                      <div>
                        <label className="v-label">از رنگ</label>
                        <input
                          type="color"
                          value={
                            (selected.item.settings.background as any)?.from ||
                            "#667eea"
                          }
                          onChange={(e) =>
                            updateSection(selected.sectionIdx, (s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: {
                                  ...s.settings.background,
                                  from: e.target.value,
                                } as any,
                              },
                            }))
                          }
                          className="v-input h-10"
                        />
                      </div>
                      <div>
                        <label className="v-label">به رنگ</label>
                        <input
                          type="color"
                          value={
                            (selected.item.settings.background as any)?.to ||
                            "#764ba2"
                          }
                          onChange={(e) =>
                            updateSection(selected.sectionIdx, (s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: {
                                  ...s.settings.background,
                                  to: e.target.value,
                                } as any,
                              },
                            }))
                          }
                          className="v-input h-10"
                        />
                      </div>
                      <div>
                        <label className="v-label">زاویه</label>
                        <input
                          type="number"
                          value={
                            (selected.item.settings.background as any)?.angle ||
                            135
                          }
                          onChange={(e) =>
                            updateSection(selected.sectionIdx, (s) => ({
                              ...s,
                              settings: {
                                ...s.settings,
                                background: {
                                  ...s.settings.background,
                                  angle: +e.target.value,
                                } as any,
                              },
                            }))
                          }
                          className="v-input"
                        />
                      </div>
                    </div>
                  )}
                  <div className="border-t my-2" />
                  <p
                    className="text-xs font-bold"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    فاصله‌گذاری
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="v-label">padding بالا</label>
                      <input
                        type="number"
                        value={selected.item.settings.padding?.top ?? 24}
                        onChange={(e) =>
                          updateSection(selected.sectionIdx, (s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              padding: {
                                ...s.settings.padding,
                                top: +e.target.value,
                              },
                            },
                          }))
                        }
                        className="v-input"
                      />
                    </div>
                    <div>
                      <label className="v-label">padding پایین</label>
                      <input
                        type="number"
                        value={selected.item.settings.padding?.bottom ?? 24}
                        onChange={(e) =>
                          updateSection(selected.sectionIdx, (s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              padding: {
                                ...s.settings.padding,
                                bottom: +e.target.value,
                              },
                            },
                          }))
                        }
                        className="v-input"
                      />
                    </div>
                    <div>
                      <label className="v-label">padding راست</label>
                      <input
                        type="number"
                        value={selected.item.settings.padding?.right ?? 16}
                        onChange={(e) =>
                          updateSection(selected.sectionIdx, (s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              padding: {
                                ...s.settings.padding,
                                right: +e.target.value,
                              },
                            },
                          }))
                        }
                        className="v-input"
                      />
                    </div>
                    <div>
                      <label className="v-label">padding چپ</label>
                      <input
                        type="number"
                        value={selected.item.settings.padding?.left ?? 16}
                        onChange={(e) =>
                          updateSection(selected.sectionIdx, (s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              padding: {
                                ...s.settings.padding,
                                left: +e.target.value,
                              },
                            },
                          }))
                        }
                        className="v-input"
                      />
                    </div>
                    <div>
                      <label className="v-label">margin بالا</label>
                      <input
                        type="number"
                        value={selected.item.settings.margin?.top ?? 0}
                        onChange={(e) =>
                          updateSection(selected.sectionIdx, (s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              margin: {
                                ...s.settings.margin,
                                top: +e.target.value,
                              },
                            },
                          }))
                        }
                        className="v-input"
                      />
                    </div>
                    <div>
                      <label className="v-label">margin پایین</label>
                      <input
                        type="number"
                        value={selected.item.settings.margin?.bottom ?? 0}
                        onChange={(e) =>
                          updateSection(selected.sectionIdx, (s) => ({
                            ...s,
                            settings: {
                              ...s.settings,
                              margin: {
                                ...s.settings.margin,
                                bottom: +e.target.value,
                              },
                            },
                          }))
                        }
                        className="v-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : selected.path[0] === "column" ? (
              <div>
                <h3 className="text-sm font-bold mb-4">تنظیمات ستون</h3>
                <div className="space-y-3">
                  <label className="v-label">نسبت عرض</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 6, 12].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          mutateSections((prev) => {
                            const next = JSON.parse(JSON.stringify(prev));
                            next[selected.sectionIdx].columns[
                              selected.colIdx
                            ].settings.width_ratio = r;
                            return next;
                          });
                        }}
                        className={`px-2 py-1 rounded text-xs ${(selected.item.settings.width_ratio || 1) === r ? "bg-[var(--v-primary)] text-white" : "bg-[var(--v-bg)]"}`}
                      >
                        {r === 12
                          ? "1/1"
                          : r === 6
                            ? "1/2"
                            : r === 4
                              ? "1/3"
                              : r === 3
                                ? "1/4"
                                : r === 2
                                  ? "1/6"
                                  : `${r}`}
                      </button>
                    ))}
                  </div>
                  <label className="v-label">تراز عمودی</label>
                  <select
                    value={selected.item.settings.vertical_align || "top"}
                    onChange={(e) => {
                      mutateSections((prev) => {
                        const next = JSON.parse(JSON.stringify(prev));
                        next[selected.sectionIdx].columns[
                          selected.colIdx
                        ].settings.vertical_align = e.target.value;
                        return next;
                      });
                    }}
                    className="v-select"
                  >
                    <option value="top">بالا</option>
                    <option value="center">وسط</option>
                    <option value="bottom">پایین</option>
                  </select>
                  <label className="v-label">فاصله بین ویجت‌ها (px)</label>
                  <input
                    type="number"
                    min={0}
                    value={selected.item.settings.gap ?? 16}
                    onChange={(e) => {
                      const v = +e.target.value;
                      mutateSections((prev) => {
                        const next = JSON.parse(JSON.stringify(prev));
                        next[selected.sectionIdx].columns[
                          selected.colIdx
                        ].settings.gap = v;
                        return next;
                      });
                    }}
                    className="v-input"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">تنظیمات ویجت</h3>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xs"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      Variant:
                    </span>
                    {[1, 2, 3].map((v) => (
                      <button
                        key={v}
                        onClick={() =>
                          updateWidget(
                            selected.sectionIdx,
                            selected.colIdx,
                            selected.wIdx,
                            (w) => ({ ...w, variant: v }),
                          )
                        }
                        className={`w-6 h-6 rounded text-xs font-bold ${selected.item.variant === v ? "bg-[var(--v-primary)] text-white" : "bg-[var(--v-bg)]"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tabs: Content / Style / Responsive */}
                <div
                  className="flex gap-1 mb-4"
                  style={{ borderBottom: "1px solid var(--v-divider)" }}
                >
                  {(["content", "style", "responsive"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-2 py-1.5 text-xs font-medium"
                      style={{
                        color:
                          activeTab === tab
                            ? "var(--v-primary)"
                            : "var(--v-text-secondary)",
                        borderBottom:
                          activeTab === tab
                            ? "2px solid var(--v-primary)"
                            : "2px solid transparent",
                      }}
                    >
                      {tab === "content"
                        ? "محتوا"
                        : tab === "style"
                          ? "استایل"
                          : "ریسپانسیو"}
                    </button>
                  ))}
                </div>

                {activeTab === "content" && (
                  <WidgetContentEditor
                    widget={selected.item}
                    onChange={(settings: any) =>
                      updateWidget(
                        selected.sectionIdx,
                        selected.colIdx,
                        selected.wIdx,
                        (w) => ({ ...w, settings }),
                      )
                    }
                  />
                )}
                {activeTab === "style" && (
                  <div className="space-y-3">
                    <p
                      className="text-xs font-bold"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      پس‌زمینه
                    </p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={
                          (selected.item.style as any)?.background?.value ||
                          "#ffffff"
                        }
                        onChange={(e) =>
                          updateWidget(
                            selected.sectionIdx,
                            selected.colIdx,
                            selected.wIdx,
                            (w: any) => ({
                              ...w,
                              style: {
                                ...w.style,
                                background: {
                                  mode: "custom",
                                  value: e.target.value,
                                },
                              },
                            }),
                          )
                        }
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={
                          (selected.item.style as any)?.background?.value || ""
                        }
                        onChange={(e) =>
                          updateWidget(
                            selected.sectionIdx,
                            selected.colIdx,
                            selected.wIdx,
                            (w: any) => ({
                              ...w,
                              style: {
                                ...w.style,
                                background: e.target.value
                                  ? { mode: "custom", value: e.target.value }
                                  : undefined,
                              },
                            }),
                          )
                        }
                        className="v-input flex-1"
                        placeholder="شفاف"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          (selected.item.style as any)?.box_shadow || false
                        }
                        onChange={(e) =>
                          updateWidget(
                            selected.sectionIdx,
                            selected.colIdx,
                            selected.wIdx,
                            (w: any) => ({
                              ...w,
                              style: {
                                ...w.style,
                                box_shadow: e.target.checked,
                              },
                            }),
                          )
                        }
                        className="accent-[var(--v-primary)]"
                      />
                      <span className="text-sm">سایه</span>
                    </label>
                    <div className="border-t my-2" />
                    <p
                      className="text-xs font-bold"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      فاصله‌گذاری
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="v-label">padding بالا</label>
                        <input
                          type="number"
                          value={selected.item.style?.padding?.top || 0}
                          onChange={(e) =>
                            updateWidget(
                              selected.sectionIdx,
                              selected.colIdx,
                              selected.wIdx,
                              (w: any) => ({
                                ...w,
                                style: {
                                  ...w.style,
                                  padding: {
                                    ...w.style?.padding,
                                    top: +e.target.value,
                                  },
                                },
                              }),
                            )
                          }
                          className="v-input"
                        />
                      </div>
                      <div>
                        <label className="v-label">padding پایین</label>
                        <input
                          type="number"
                          value={selected.item.style?.padding?.bottom || 0}
                          onChange={(e) =>
                            updateWidget(
                              selected.sectionIdx,
                              selected.colIdx,
                              selected.wIdx,
                              (w: any) => ({
                                ...w,
                                style: {
                                  ...w.style,
                                  padding: {
                                    ...w.style?.padding,
                                    bottom: +e.target.value,
                                  },
                                },
                              }),
                            )
                          }
                          className="v-input"
                        />
                      </div>
                      <div>
                        <label className="v-label">margin بالا</label>
                        <input
                          type="number"
                          value={selected.item.style?.margin?.top || 0}
                          onChange={(e) =>
                            updateWidget(
                              selected.sectionIdx,
                              selected.colIdx,
                              selected.wIdx,
                              (w: any) => ({
                                ...w,
                                style: {
                                  ...w.style,
                                  margin: {
                                    ...w.style?.margin,
                                    top: +e.target.value,
                                  },
                                },
                              }),
                            )
                          }
                          className="v-input"
                        />
                      </div>
                      <div>
                        <label className="v-label">margin پایین</label>
                        <input
                          type="number"
                          value={selected.item.style?.margin?.bottom || 0}
                          onChange={(e) =>
                            updateWidget(
                              selected.sectionIdx,
                              selected.colIdx,
                              selected.wIdx,
                              (w: any) => ({
                                ...w,
                                style: {
                                  ...w.style,
                                  margin: {
                                    ...w.style?.margin,
                                    bottom: +e.target.value,
                                  },
                                },
                              }),
                            )
                          }
                          className="v-input"
                        />
                      </div>
                    </div>
                    <label className="v-label">گردی گوشه</label>
                    <input
                      type="number"
                      value={selected.item.style?.border_radius || 0}
                      onChange={(e) =>
                        updateWidget(
                          selected.sectionIdx,
                          selected.colIdx,
                          selected.wIdx,
                          (w: any) => ({
                            ...w,
                            style: {
                              ...w.style,
                              border_radius: +e.target.value,
                            },
                          }),
                        )
                      }
                      className="v-input"
                    />
                  </div>
                )}
                {activeTab === "responsive" && (
                  <div className="space-y-3">
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      نمایش در دستگاه:
                    </p>
                    {(["desktop", "tablet", "mobile"] as const).map((bp) => (
                      <label
                        key={bp}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            selected.item.responsive?.[bp]?.visible !== false
                          }
                          onChange={(e) =>
                            updateWidget(
                              selected.sectionIdx,
                              selected.colIdx,
                              selected.wIdx,
                              (w: any) => ({
                                ...w,
                                responsive: {
                                  ...w.responsive,
                                  [bp]: {
                                    ...w.responsive?.[bp],
                                    visible: e.target.checked,
                                  },
                                },
                              }),
                            )
                          }
                          className="accent-[var(--v-primary)]"
                        />
                        <span className="text-sm">
                          {bp === "desktop"
                            ? "دسکتاپ"
                            : bp === "tablet"
                              ? "تبلت"
                              : "موبایل"}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Widget selector modal */}
      {showWidgetLib === "modal" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowWidgetLib(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">انتخاب ویجت</h3>
            <div className="space-y-2">
              {WIDGET_TYPES.map((w) => (
                <button
                  key={w.type}
                  onClick={() => {
                    if (selected) {
                      addWidget(
                        w.type,
                        selected.sectionIdx,
                        selected.colIdx >= 0 ? selected.colIdx : 0,
                      );
                    }
                  }}
                  className="w-full text-right px-4 py-3 rounded-xl hover:bg-[var(--v-bg)] transition flex items-center gap-3"
                >
                  <Icon
                    icon={w.icon}
                    className="w-5 h-5 shrink-0"
                    style={{ color: "var(--v-primary)" }}
                  />
                  <div>
                    <p className="text-sm font-medium">{w.label}</p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      {w.group}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page Settings Modal */}
      {showPageSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowPageSettings(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Icon
                  icon="tabler:settings"
                  className="w-5 h-5"
                  style={{ color: "var(--v-primary)" }}
                />
                تنظیمات صفحه
              </h3>
              <button
                onClick={() => setShowPageSettings(false)}
                className="v-btn-icon"
              >
                <Icon icon="tabler:x" className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="v-label">عنوان صفحه</label>
                <input
                  type="text"
                  value={pageForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setPageForm((prev) => ({
                      ...prev,
                      title,
                      slug: prev.slug || toSlug(title),
                    }));
                  }}
                  className="v-input"
                />
              </div>
              <div>
                <label className="v-label">آدرس (slug)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pageForm.slug}
                    onChange={(e) =>
                      setPageForm({ ...pageForm, slug: e.target.value })
                    }
                    className="v-input flex-1"
                    dir="ltr"
                  />
                  <button
                    onClick={() =>
                      setPageForm((prev) => ({
                        ...prev,
                        slug: toSlug(prev.title),
                      }))
                    }
                    className="v-btn text-sm shrink-0"
                    title="تولید خودکار از عنوان"
                  >
                    <Icon icon="tabler:refresh" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="v-label">نوع صفحه</label>
                <select
                  value={pageForm.type}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, type: e.target.value })
                  }
                  className="v-select"
                >
                  {Object.entries(pageTypeLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="v-label">وضعیت</label>
                <select
                  value={pageForm.status}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, status: e.target.value })
                  }
                  className="v-select"
                >
                  <option value="draft">پیش‌نویس</option>
                  <option value="published">منتشر شده</option>
                </select>
              </div>
              <div className="border-t my-2" />
              <p
                className="text-xs font-bold"
                style={{ color: "var(--v-text-secondary)" }}
              >
                سئو (SEO)
              </p>
              <div>
                <label className="v-label">عنوان سئو (meta title)</label>
                <input
                  type="text"
                  value={pageForm.metaTitle}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, metaTitle: e.target.value })
                  }
                  className="v-input"
                />
              </div>
              <div>
                <label className="v-label">
                  توضیحات سئو (meta description)
                </label>
                <textarea
                  value={pageForm.metaDesc}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, metaDesc: e.target.value })
                  }
                  className="v-input min-h-[60px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision History Panel */}
      {showRevisions && (
        <div
          className="fixed left-0 top-0 bottom-0 z-40 w-96 bg-white shadow-2xl border-l overflow-y-auto"
          style={{ direction: "rtl" }}
        >
          <div className="sticky top-0 bg-white z-10 border-b px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Icon
                icon="tabler:history"
                className="w-4 h-4"
                style={{ color: "var(--v-primary)" }}
              />
              تاریخچه نسخه‌ها
            </h3>
            <button
              onClick={() => setShowRevisions(false)}
              className="v-btn-icon"
            >
              <Icon icon="tabler:x" className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            {loadingRevisions ? (
              <div className="flex justify-center py-8">
                <div
                  className="w-6 h-6 border-4 rounded-full animate-spin"
                  style={{
                    borderColor: "var(--v-primary)",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            ) : revisions.length === 0 ? (
              <div className="text-center py-8">
                <Icon
                  icon="tabler:history-off"
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "var(--v-text-disabled)" }}
                />
                <p
                  className="text-xs"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  هیچ نسخه‌ای وجود ندارد
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {revisions.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="rounded-xl border p-3 text-sm hover:border-[var(--v-primary)]/30 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {rev.note || "بدون توضیح"}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--v-text-secondary)" }}
                        >
                          {toJalaliDateTime(rev.createdAt)}
                        </p>
                        {rev.author && (
                          <p
                            className="text-xs"
                            style={{ color: "var(--v-text-secondary)" }}
                          >
                            {rev.author.name}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await api.post(
                              `/pages/${editId}/revisions/${rev.id}/restore`,
                              {},
                            );
                            const p = await api.get<any>(`/pages/${editId}`);
                            if (p.contentJson) {
                              try {
                                const s =
                                  JSON.parse(p.contentJson).sections || [];
                                setSections(s);
                                setPast([]);
                                setFuture([]);
                              } catch {
                                setSections([]);
                                setPast([]);
                                setFuture([]);
                              }
                            }
                            setMessage({
                              type: "success",
                              text: "نسخه بازیابی شد",
                            });
                            setShowRevisions(false);
                          } catch {
                            setMessage({
                              type: "error",
                              text: "خطا در بازیابی نسخه",
                            });
                          }
                        }}
                        className="shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{
                          background: "var(--v-primary)",
                          color: "#fff",
                        }}
                      >
                        بازگردانی
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Simple widget content editor ───
function WidgetContentEditor({
  widget,
  onChange,
}: {
  widget: any;
  onChange: (settings: any) => void;
}) {
  const s = widget.settings || {};
  const set = (key: string, value: any) => onChange({ ...s, [key]: value });

  switch (widget.type) {
    case "heading":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">متن تیتر</label>
            <input
              type="text"
              value={s.text || ""}
              onChange={(e) => set("text", e.target.value)}
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">سایز (px)</label>
            <input
              type="number"
              value={s.typography?.size || 24}
              onChange={(e) =>
                set("typography", { ...s.typography, size: +e.target.value })
              }
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">وزن قلم</label>
            <select
              value={s.typography?.weight || 700}
              onChange={(e) =>
                set("typography", { ...s.typography, weight: +e.target.value })
              }
              className="v-select"
            >
              {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="v-label">لینک «مشاهده همه»</label>
            <input
              type="url"
              value={s.link?.url || ""}
              onChange={(e) => set("link", { ...s.link, url: e.target.value })}
              className="v-input"
              placeholder="https://..."
            />
          </div>
        </div>
      );
    case "text":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">متن (HTML)</label>
            <textarea
              value={s.html || ""}
              onChange={(e) => set("html", e.target.value)}
              className="v-input min-h-[100px]"
            />
          </div>
        </div>
      );
    case "image":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">آدرس تصویر</label>
            <input
              type="text"
              value={s.image?.media_id || ""}
              onChange={(e) =>
                set("image", { ...s.image, media_id: e.target.value })
              }
              className="v-input"
              placeholder="media_id"
            />
          </div>
          <div>
            <label className="v-label">متن جایگزین</label>
            <input
              type="text"
              value={s.image?.alt || ""}
              onChange={(e) =>
                set("image", { ...s.image, alt: e.target.value })
              }
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">لینک</label>
            <input
              type="url"
              value={s.link?.url || ""}
              onChange={(e) => set("link", { ...s.link, url: e.target.value })}
              className="v-input"
            />
          </div>
        </div>
      );
    case "button":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">متن دکمه</label>
            <input
              type="text"
              value={s.text || ""}
              onChange={(e) => set("text", e.target.value)}
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">لینک</label>
            <input
              type="url"
              value={s.link?.url || ""}
              onChange={(e) => set("link", { ...s.link, url: e.target.value })}
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">سایز</label>
            <select
              value={s.size || "md"}
              onChange={(e) => set("size", e.target.value)}
              className="v-select"
            >
              <option value="sm">کوچک</option>
              <option value="md">متوسط</option>
              <option value="lg">بزرگ</option>
            </select>
          </div>
        </div>
      );
    case "spacer":
      return (
        <div>
          <label className="v-label">ارتفاع (px)</label>
          <input
            type="number"
            value={s.height || 32}
            onChange={(e) => set("height", +e.target.value)}
            className="v-input"
          />
        </div>
      );
    case "product_carousel":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">عنوان</label>
            <input
              type="text"
              value={s.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">دسته‌بندی</label>
            <input
              type="text"
              value={s.data?.filter?.category_ids?.join(",") || ""}
              onChange={(e) =>
                set("data", {
                  ...s.data,
                  filter: {
                    ...s.data?.filter,
                    category_ids: e.target.value
                      ? e.target.value.split(",").map(Number)
                      : [],
                  },
                })
              }
              className="v-input"
              placeholder="id1,id2"
            />
          </div>
          <div>
            <label className="v-label">تعداد</label>
            <input
              type="number"
              value={s.data?.limit || 10}
              onChange={(e) =>
                set("data", { ...s.data, limit: +e.target.value })
              }
              className="v-input"
            />
          </div>
        </div>
      );
    case "product_grid":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">تعداد ستون</label>
            <input
              type="number"
              min={1}
              max={6}
              value={s.columns || 4}
              onChange={(e) => set("columns", +e.target.value)}
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">تعداد</label>
            <input
              type="number"
              value={s.data?.limit || 12}
              onChange={(e) =>
                set("data", { ...s.data, limit: +e.target.value })
              }
              className="v-input"
            />
          </div>
        </div>
      );
    case "countdown":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">عنوان</label>
            <input
              type="text"
              value={s.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">تاریخ هدف</label>
            <input
              type="datetime-local"
              value={s.target_date ? s.target_date.substring(0, 16) : ""}
              onChange={(e) =>
                set("target_date", new Date(e.target.value).toISOString())
              }
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">استایل</label>
            <select
              value={s.style || "blocks"}
              onChange={(e) => set("style", e.target.value)}
              className="v-select"
            >
              <option value="flip">Flip</option>
              <option value="simple">ساده</option>
              <option value="blocks">بلاکی</option>
            </select>
          </div>
        </div>
      );
    case "category_nav":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">نوع نمایش</label>
            <select
              value={s.type || "circle"}
              onChange={(e) => set("type", e.target.value)}
              className="v-select"
            >
              <option value="circle">دایره‌ای</option>
              <option value="square">مربعی</option>
            </select>
          </div>
          <div>
            <label className="v-label">آیدی دسته‌بندی‌ها (جداساز با ,)</label>
            <input
              type="text"
              value={(s.categories || []).map((c: any) => c.id).join(",")}
              onChange={(e) =>
                set(
                  "categories",
                  e.target.value
                    .split(",")
                    .filter(Boolean)
                    .map((id: string) => ({ id: Number(id.trim()) })),
                )
              }
              className="v-input"
            />
          </div>
        </div>
      );
    case "banner_slider":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">تعداد اسلاید</label>
            <input
              type="number"
              value={s.slides?.length || 1}
              onChange={(e) => {
                const n = +e.target.value;
                const slides = Array.from(
                  { length: n },
                  (_, i) =>
                    s.slides?.[i] || {
                      image: { media_id: "", alt: "" },
                      link: { url: "#", target: "_self" },
                    },
                );
                set("slides", slides);
              }}
              className="v-input"
            />
          </div>
        </div>
      );
    case "accordion":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">تعداد آیتم‌ها</label>
            <input
              type="number"
              value={s.items?.length || 1}
              onChange={(e) => {
                const n = +e.target.value;
                const items = Array.from(
                  { length: n },
                  (_, i) =>
                    s.items?.[i] || {
                      title: `سوال ${i + 1}`,
                      content_html: "",
                    },
                );
                set("items", items);
              }}
              className="v-input"
            />
          </div>
        </div>
      );
    case "blog_posts":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">چیدمان</label>
            <select
              value={s.layout || "grid"}
              onChange={(e) => set("layout", e.target.value)}
              className="v-select"
            >
              <option value="grid">گرید</option>
              <option value="list">لیست</option>
            </select>
          </div>
          <div>
            <label className="v-label">تعداد</label>
            <input
              type="number"
              value={s.data?.limit || 6}
              onChange={(e) =>
                set("data", { ...s.data, limit: +e.target.value })
              }
              className="v-input"
            />
          </div>
        </div>
      );
    case "video":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">منبع</label>
            <select
              value={s.source || "youtube"}
              onChange={(e) => set("source", e.target.value)}
              className="v-select"
            >
              <option value="youtube">یوتیوب</option>
              <option value="aparat">آپارات</option>
              <option value="upload">آپلود</option>
            </select>
          </div>
          {s.source !== "upload" ? (
            <div>
              <label className="v-label">آدرس ویدیو</label>
              <input
                type="url"
                value={s.url || ""}
                onChange={(e) => set("url", e.target.value)}
                className="v-input"
                placeholder="https://..."
              />
            </div>
          ) : (
            <div>
              <label className="v-label">شناسه رسانه</label>
              <input
                type="text"
                value={s.media_id || ""}
                onChange={(e) => set("media_id", e.target.value)}
                className="v-input"
              />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={s.autoplay || false}
              onChange={(e) => set("autoplay", e.target.checked)}
              className="accent-[var(--v-primary)]"
            />
            <span className="text-sm">پخش خودکار</span>
          </label>
        </div>
      );
    case "gallery":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">تعداد ستون</label>
            <input
              type="number"
              min={1}
              max={6}
              value={s.columns || 3}
              onChange={(e) => set("columns", +e.target.value)}
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">فاصله (px)</label>
            <input
              type="number"
              min={0}
              value={s.gap || 8}
              onChange={(e) => set("gap", +e.target.value)}
              className="v-input"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={s.lightbox !== false}
              onChange={(e) => set("lightbox", e.target.checked)}
              className="accent-[var(--v-primary)]"
            />
            <span className="text-sm">نمایش بزرگ (lightbox)</span>
          </label>
          <div>
            <label className="v-label">شناسه تصاویر (جداساز با ,)</label>
            <input
              type="text"
              value={(s.images || []).map((img: any) => img.media_id).join(",")}
              onChange={(e) =>
                set(
                  "images",
                  e.target.value
                    .split(",")
                    .filter(Boolean)
                    .map((id: string) => ({ media_id: id.trim(), alt: "" })),
                )
              }
              className="v-input"
              placeholder="id1,id2,id3"
            />
          </div>
        </div>
      );
    case "tabs":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">جهت</label>
            <select
              value={s.orientation || "horizontal"}
              onChange={(e) => set("orientation", e.target.value)}
              className="v-select"
            >
              <option value="horizontal">افقی</option>
              <option value="vertical">عمودی</option>
            </select>
          </div>
          <div>
            <label className="v-label">تعداد تب‌ها</label>
            <input
              type="number"
              min={1}
              max={10}
              value={s.tabs?.length || 2}
              onChange={(e) => {
                const n = +e.target.value;
                const tabs = Array.from(
                  { length: n },
                  (_, i) =>
                    s.tabs?.[i] || { label: `تب ${i + 1}`, content_html: "" },
                );
                set("tabs", tabs);
              }}
              className="v-input"
            />
          </div>
          {(s.tabs || []).map((tab: any, i: number) => (
            <div key={i} className="border rounded-lg p-2 space-y-2">
              <p className="text-xs font-medium">تب {i + 1}</p>
              <input
                type="text"
                value={tab.label}
                onChange={(e) => {
                  const tabs = [...(s.tabs || [])];
                  tabs[i] = { ...tabs[i], label: e.target.value };
                  set("tabs", tabs);
                }}
                className="v-input text-xs"
                placeholder="عنوان تب"
              />
              <textarea
                value={tab.content_html || ""}
                onChange={(e) => {
                  const tabs = [...(s.tabs || [])];
                  tabs[i] = { ...tabs[i], content_html: e.target.value };
                  set("tabs", tabs);
                }}
                className="v-input text-xs min-h-[60px]"
                placeholder="محتوای HTML"
              />
            </div>
          ))}
        </div>
      );
    case "icon_box":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">آیکون</label>
            <input
              type="text"
              value={s.icon || "tabler:star"}
              onChange={(e) => set("icon", e.target.value)}
              className="v-input"
              placeholder="tabler:star"
            />
          </div>
          <div>
            <label className="v-label">عنوان</label>
            <input
              type="text"
              value={s.title || ""}
              onChange={(e) => set("title", e.target.value)}
              className="v-input"
            />
          </div>
          <div>
            <label className="v-label">توضیحات</label>
            <textarea
              value={s.desc || ""}
              onChange={(e) => set("desc", e.target.value)}
              className="v-input min-h-[60px]"
            />
          </div>
          <div>
            <label className="v-label">لینک</label>
            <input
              type="url"
              value={s.link?.url || ""}
              onChange={(e) => set("link", { ...s.link, url: e.target.value })}
              className="v-input"
            />
          </div>
        </div>
      );
    case "brand_slider":
      return (
        <div className="space-y-3">
          <div>
            <label className="v-label">شناسه برندها (جداساز با ,)</label>
            <input
              type="text"
              value={(s.brand_ids || []).join(",")}
              onChange={(e) =>
                set(
                  "brand_ids",
                  e.target.value.split(",").map(Number).filter(Boolean),
                )
              }
              className="v-input"
              placeholder="1,2,3"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={s.grayscale || false}
              onChange={(e) => set("grayscale", e.target.checked)}
              className="accent-[var(--v-primary)]"
            />
            <span className="text-sm">سیاه‌سفید</span>
          </label>
          <div>
            <label className="v-label">سرعت (ثانیه)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={s.speed || 3}
              onChange={(e) => set("speed", +e.target.value)}
              className="v-input"
            />
          </div>
        </div>
      );
    default:
      return (
        <div
          className="py-4 text-center text-sm"
          style={{ color: "var(--v-text-secondary)" }}
        >
          <p>تنظیمات پیشرفته برای ویجت {widget.type}</p>
          <p className="text-xs mt-1">از طریق کدنویسی قابل گسترش است</p>
        </div>
      );
  }
}
