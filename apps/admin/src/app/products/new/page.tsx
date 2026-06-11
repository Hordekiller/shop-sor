"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import TagInput from "@/components/TagInput";
import TiptapEditor from "@/components/TiptapEditor";

interface Category {
  id: number;
  name: string;
  parentId: number | null;
}
interface Brand {
  id: number;
  name: string;
}

interface ImageObj {
  url: string;
  alt: string;
}
interface SpecRow {
  name: string;
  value: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<ImageObj[]>([]);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    price: "",
    salePrice: "",
    discountPercent: "",
    discountStartAt: "",
    discountEndAt: "",
    stock: "0",
    lowStockThreshold: "10",
    minOrderQty: "1",
    maxOrderQty: "0",
    categoryId: "",
    sku: "",
    barcode: "",
    status: "in_stock",
    brandId: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    videoUrl: "",
    tags: "",
    publishStatus: "published",
    relatedProductIds: "",
    metaTitle: "",
    metaDesc: "",
  });

  const [specifications, setSpecifications] = useState<SpecRow[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<Category[]>("/categories"),
      api.get<Brand[]>("/brands"),
    ])
      .then(([cats, brds]) => {
        setCategories(cats);
        setBrands(brds);
      })
      .catch(console.error);
  }, []);

  function autoSlug() {
    if (!form.slug && form.title) {
      setForm({
        ...form,
        slug: form.title
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9آ-ی\-]/g, "")
          .toLowerCase(),
      });
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setUploading(true);
    const fd = new FormData();
    for (const f of e.target.files) fd.append("files", f);
    try {
      const result = await fetch(`http://localhost:3001/api/products/upload`, {
        method: "POST",
        body: fd,
      }).then((r) => r.json());
      const newImages =
        result.files?.map((f: any) => ({
          url: f.url || `/uploads/${f.filename}`,
          alt: "",
        })) || [];
      setImages([...images, ...newImages]);
    } catch {
      const fallback = Array.from(e.target.files).map((f) => ({
        url: URL.createObjectURL(f),
        alt: "",
      }));
      setImages([...images, ...fallback]);
    }
    setUploading(false);
  }

  function removeImage(url: string) {
    setImages(images.filter((i) => i.url !== url));
  }

  function updateImageAlt(url: string, alt: string) {
    setImages(images.map((i) => (i.url === url ? { ...i, alt } : i)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price ? Number(form.price) : 0,
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        discountPercent: form.discountPercent
          ? Number(form.discountPercent)
          : null,
        discountStartAt: form.discountStartAt || null,
        discountEndAt: form.discountEndAt || null,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        minOrderQty: Number(form.minOrderQty),
        maxOrderQty: Number(form.maxOrderQty),
        categoryId: Number(form.categoryId),
        brandId: form.brandId ? Number(form.brandId) : null,
        weight: form.weight ? Number(form.weight) : null,
        length: form.length ? Number(form.length) : null,
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
        images: JSON.stringify(images),
        tags: form.tags || null,
        specifications: specifications.filter((s) => s.name && s.value),
        relatedProductIds: form.relatedProductIds
          ? form.relatedProductIds
              .split(",")
              .map((s: string) => Number(s.trim()))
              .filter(Boolean)
          : [],
      };
      await api.post("/products", payload);
      router.push("/products");
    } catch (err) {
      alert(err);
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
          محصول جدید
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--v-text-secondary)" }}
        >
          اطلاعات محصول جدید را وارد کنید
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* ===== MAIN CONTENT (right column in RTL) ===== */}
          <div className="space-y-5">
            {/* اطلاعات پایه */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:info-circle"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  اطلاعات پایه
                </h3>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  عنوان محصول *
                </label>
                <input
                  type="text"
                  required
                  className="v-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  onBlur={autoSlug}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    نامک (slug)
                  </label>
                  <input
                    type="text"
                    className="v-input"
                    dir="ltr"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    وضعیت
                  </label>
                  <select
                    className="v-select"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="in_stock">موجود</option>
                    <option value="out_of_stock">ناموجود</option>
                    <option value="coming_soon">به‌زودی</option>
                    <option value="display_only">فقط نمایش</option>
                  </select>
                </div>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  توضیح کوتاه
                </label>
                <textarea
                  className="v-input"
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) =>
                    setForm({ ...form, shortDescription: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  توضیحات کامل
                </label>
                <TiptapEditor
                  value={form.description}
                  onChange={(html) => setForm({ ...form, description: html })}
                  placeholder="توضیحات محصول را وارد کنید..."
                  minHeight={300}
                />
              </div>
            </div>

            {/* قیمت و تخفیف */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:currency-dollar"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  قیمت و تخفیف
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    قیمت (ریال) *
                  </label>
                  <input
                    type="number"
                    required
                    className="v-input"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    قیمت تخفیف‌خورده
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.salePrice}
                    onChange={(e) =>
                      setForm({ ...form, salePrice: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    درصد تخفیف
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.discountPercent}
                    onChange={(e) =>
                      setForm({ ...form, discountPercent: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--v-text)" }}
                    >
                      شروع تخفیف
                    </label>
                    <input
                      type="datetime-local"
                      className="v-input"
                      value={form.discountStartAt}
                      onChange={(e) =>
                        setForm({ ...form, discountStartAt: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--v-text)" }}
                    >
                      پایان تخفیف
                    </label>
                    <input
                      type="datetime-local"
                      className="v-input"
                      value={form.discountEndAt}
                      onChange={(e) =>
                        setForm({ ...form, discountEndAt: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* موجودی و انبار */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:package"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  موجودی و انبار
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    موجودی
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    هشدار موجودی کم
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.lowStockThreshold}
                    onChange={(e) =>
                      setForm({ ...form, lowStockThreshold: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    SKU
                  </label>
                  <input
                    type="text"
                    className="v-input"
                    dir="ltr"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    بارکد
                  </label>
                  <input
                    type="text"
                    className="v-input"
                    dir="ltr"
                    value={form.barcode}
                    onChange={(e) =>
                      setForm({ ...form, barcode: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    حداقل تعداد خرید
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.minOrderQty}
                    onChange={(e) =>
                      setForm({ ...form, minOrderQty: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    حداکثر تعداد (0 = نامحدود)
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.maxOrderQty}
                    onChange={(e) =>
                      setForm({ ...form, maxOrderQty: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* تصاویر */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:photo"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  تصاویر محصول
                </h3>
              </div>
              <div className="flex flex-wrap gap-3 mb-3">
                {images.map((img) => (
                  <div key={img.url} className="relative group">
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-24 h-24 object-cover rounded-lg border"
                      style={{ borderColor: "var(--v-border)" }}
                    />
                    <input
                      type="text"
                      className="absolute -bottom-8 left-0 right-0 text-xs p-0.5 rounded text-center"
                      style={{
                        background: "var(--v-bg)",
                        borderColor: "var(--v-border)",
                      }}
                      placeholder="Alt text"
                      value={img.alt}
                      onChange={(e) => updateImageAlt(img.url, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img.url)}
                      className="absolute -top-2 -right-2 rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      style={{ background: "var(--v-error)", color: "white" }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {uploading && (
                  <div
                    className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center text-sm"
                    style={{
                      color: "var(--v-text-disabled)",
                      borderColor: "var(--v-border)",
                    }}
                  >
                    در حال آپلود...
                  </div>
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 v-btn v-btn-secondary">
                <Icon icon="tabler:upload" className="w-4 h-4" />
                انتخاب تصویر
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--v-text-disabled)" }}
              >
                می‌توانید برای هر تصویر متن جایگزین (Alt) وارد کنید
              </p>
            </div>

            {/* ویدیو */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:video"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  ویدیو
                </h3>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  لینک ویدیو (اختیاری)
                </label>
                <input
                  type="url"
                  className="v-input"
                  dir="ltr"
                  placeholder="https://..."
                  value={form.videoUrl}
                  onChange={(e) =>
                    setForm({ ...form, videoUrl: e.target.value })
                  }
                />
              </div>
            </div>

            {/* مشخصات فنی */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:list-details"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  مشخصات فنی
                </h3>
              </div>
              {specifications.map((spec, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    className="v-input w-1/3"
                    placeholder="نام مشخصه"
                    value={spec.name}
                    onChange={(e) => {
                      const next = [...specifications];
                      next[idx] = { ...next[idx], name: e.target.value };
                      setSpecifications(next);
                    }}
                  />
                  <input
                    className="v-input flex-1"
                    placeholder="مقدار"
                    value={spec.value}
                    onChange={(e) => {
                      const next = [...specifications];
                      next[idx] = { ...next[idx], value: e.target.value };
                      setSpecifications(next);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSpecifications(
                        specifications.filter((_, i) => i !== idx),
                      )
                    }
                    className="v-btn v-btn-sm"
                    style={{ color: "var(--v-error)" }}
                  >
                    <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setSpecifications([
                    ...specifications,
                    { name: "", value: "" },
                  ])
                }
                className="v-btn v-btn-secondary v-btn-sm"
              >
                <Icon icon="tabler:plus" className="w-3.5 h-3.5" />
                افزودن مشخصه
              </button>
            </div>

            {/* وزن و ابعاد */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:dimensions"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  وزن و ابعاد
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    وزن (گرم)
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.weight}
                    onChange={(e) =>
                      setForm({ ...form, weight: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    طول (سانتیمتر)
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.length}
                    onChange={(e) =>
                      setForm({ ...form, length: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    عرض (سانتیمتر)
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.width}
                    onChange={(e) =>
                      setForm({ ...form, width: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--v-text)" }}
                  >
                    ارتفاع (سانتیمتر)
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={form.height}
                    onChange={(e) =>
                      setForm({ ...form, height: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* تحلیل سئو */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:analyze"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  تحلیل سئو
                </h3>
              </div>
              {(() => {
                const text = (form.description || "").replace(/<[^>]*>/g, "");
                const wordCount = text
                  ? text.split(/\s+/).filter(Boolean).length
                  : 0;
                const keyword = form.metaTitle || "";
                const hasKeyword = keyword && text.includes(keyword);
                const imgCount =
                  (form.description || "").match(/<img[\s>/]/g)?.length || 0;
                return (
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className="v-card p-4 text-center"
                      style={{ background: "var(--v-bg)" }}
                    >
                      <p
                        className="text-2xl font-bold"
                        style={{ color: "var(--v-primary)" }}
                      >
                        {wordCount}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        تعداد کلمات توضیحات
                      </p>
                    </div>
                    <div
                      className="v-card p-4 text-center"
                      style={{ background: "var(--v-bg)" }}
                    >
                      <p
                        className="text-2xl font-bold"
                        style={{
                          color: hasKeyword
                            ? "var(--v-success, #22c55e)"
                            : "var(--v-error)",
                        }}
                      >
                        {hasKeyword ? "✓" : "✗"}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        کلمه کلیدی در توضیحات
                      </p>
                    </div>
                    <div
                      className="v-card p-4 text-center"
                      style={{ background: "var(--v-bg)" }}
                    >
                      <p
                        className="text-2xl font-bold"
                        style={{ color: "var(--v-primary)" }}
                      >
                        {imgCount}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        تعداد تصاویر در محتوا
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ===== SIDEBAR (left column in RTL) ===== */}
          <div className="space-y-5">
            {/* دسته‌بندی و برند */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:category"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  دسته‌بندی و برند
                </h3>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  دسته‌بندی اصلی *
                </label>
                <select
                  required
                  className="v-select"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                >
                  <option value="">انتخاب کنید</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  برند
                </label>
                <select
                  className="v-select"
                  value={form.brandId}
                  onChange={(e) =>
                    setForm({ ...form, brandId: e.target.value })
                  }
                >
                  <option value="">بدون برند</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* وضعیت انتشار */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:send"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  وضعیت انتشار
                </h3>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  وضعیت انتشار
                </label>
                <select
                  className="v-select"
                  value={form.publishStatus}
                  onChange={(e) =>
                    setForm({ ...form, publishStatus: e.target.value })
                  }
                >
                  <option value="published">منتشر شده</option>
                  <option value="draft">پیش‌نویس</option>
                  <option value="pending_review">در انتظار بررسی</option>
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  محصولات مرتبط (شناسه‌ها با کاما)
                </label>
                <input
                  type="text"
                  className="v-input"
                  dir="ltr"
                  placeholder="مثال: 2, 5, 8"
                  value={form.relatedProductIds}
                  onChange={(e) =>
                    setForm({ ...form, relatedProductIds: e.target.value })
                  }
                />
              </div>
            </div>

            {/* برچسب‌ها */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:tags"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  برچسب‌ها
                </h3>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  برچسب‌ها
                </label>
                <TagInput
                  value={form.tags}
                  onChange={(v) => setForm({ ...form, tags: v })}
                  placeholder="مثال: پرفروش, جدید, پیشنهاد ویژه"
                />
              </div>
            </div>

            {/* سئو */}
            <div className="v-card p-5 space-y-4">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:seo"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  سئو (SEO)
                </h3>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  تایتل سئو
                </label>
                <input
                  type="text"
                  className="v-input"
                  value={form.metaTitle}
                  onChange={(e) =>
                    setForm({ ...form, metaTitle: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--v-text)" }}
                >
                  توضیحات سئو
                </label>
                <textarea
                  className="v-input"
                  rows={3}
                  value={form.metaDesc}
                  onChange={(e) =>
                    setForm({ ...form, metaDesc: e.target.value })
                  }
                />
              </div>
            </div>

            {/* actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="v-btn v-btn-primary flex-1"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Icon icon="tabler:device-floppy" className="w-4 h-4" />{" "}
                    ذخیره محصول
                  </>
                )}
              </button>
              <a href="/products" className="v-btn v-btn-secondary">
                انصراف
              </a>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
