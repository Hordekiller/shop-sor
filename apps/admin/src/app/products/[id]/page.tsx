"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import TagInput from "@/components/TagInput";
import TiptapEditor from "@/components/TiptapEditor";

interface Category {
  id: number;
  name: string;
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

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    isActive: true,
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
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<ImageObj[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [attrDefs, setAttrDefs] = useState<any[]>([]);
  const [specifications, setSpecifications] = useState<SpecRow[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<Category[]>("/categories"),
      api.get<Brand[]>("/brands"),
      api.get<any>(`/products/${id}`),
    ])
      .then(([cats, brds, product]) => {
        setCategories(cats);
        setBrands(brds);

        const fmt = (v: any) => v ?? "";
        setForm({
          title: fmt(product.title),
          slug: fmt(product.slug),
          shortDescription: fmt(product.shortDescription),
          description: fmt(product.description),
          price: String(product.price || ""),
          salePrice: product.salePrice ? String(product.salePrice) : "",
          discountPercent: product.discountPercent
            ? String(product.discountPercent)
            : "",
          discountStartAt: product.discountStartAt
            ? product.discountStartAt.slice(0, 16)
            : "",
          discountEndAt: product.discountEndAt
            ? product.discountEndAt.slice(0, 16)
            : "",
          stock: String(product.stock || "0"),
          lowStockThreshold: String(product.lowStockThreshold || "10"),
          minOrderQty: String(product.minOrderQty || "1"),
          maxOrderQty: String(product.maxOrderQty || "0"),
          categoryId: String(product.categoryId || ""),
          sku: fmt(product.sku),
          barcode: fmt(product.barcode),
          status: product.status || "in_stock",
          isActive: product.isActive ?? true,
          brandId: product.brandId ? String(product.brandId) : "",
          weight: product.weight ? String(product.weight) : "",
          length: product.length ? String(product.length) : "",
          width: product.width ? String(product.width) : "",
          height: product.height ? String(product.height) : "",
          videoUrl: fmt(product.videoUrl),
          tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
          publishStatus: product.publishStatus || "published",
          relatedProductIds: Array.isArray(product.relatedProductIds)
            ? product.relatedProductIds.join(", ")
            : "",
          metaTitle: fmt(product.metaTitle),
          metaDesc: fmt(product.metaDesc),
        });

        if (product.images)
          setImages(
            Array.isArray(product.images)
              ? product.images.map((i: any) =>
                  typeof i === "string" ? { url: i, alt: "" } : i,
                )
              : [],
          );

        if (product.variants)
          setVariants(
            product.variants.map((v: any) => ({
              ...v,
              attributes: typeof v.attributes === "object" ? v.attributes : {},
              images: Array.isArray(v.images)
                ? v.images.map((i: any) => (typeof i === "string" ? i : i.url))
                : [],
            })),
          );

        if (product.attrDefs)
          setAttrDefs(
            product.attrDefs.map((a: any) => ({
              ...a,
              values: Array.isArray(a.values) ? a.values : [],
            })),
          );

        if (product.specifications)
          setSpecifications(
            product.specifications.map((s: any) => ({
              name: s.name,
              value: s.value,
            })),
          );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("atlas_token")}`,
        },
        body: fd,
      });
      const data = await res.json();
      if (data.url) setImages((prev) => [...prev, { url: data.url, alt: "" }]);
    } catch {
      alert("Upload failed");
    }
    setUploading(false);
  };

  const removeImage = (url: string) =>
    setImages((prev) => prev.filter((i) => i.url !== url));
  const updateImageAlt = (url: string, alt: string) => {
    setImages((prev) => prev.map((i) => (i.url === url ? { ...i, alt } : i)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        title: form.title,
        slug: form.slug || undefined,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        price: parseFloat(form.price) || 0,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        discountPercent: form.discountPercent
          ? parseFloat(form.discountPercent)
          : undefined,
        discountStartAt: form.discountStartAt || undefined,
        discountEndAt: form.discountEndAt || undefined,
        stock: parseInt(form.stock) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
        minOrderQty: parseInt(form.minOrderQty) || 1,
        maxOrderQty: parseInt(form.maxOrderQty) || 0,
        categoryId: parseInt(form.categoryId),
        sku: form.sku || null,
        barcode: form.barcode || null,
        status: form.status,
        isActive: form.isActive,
        brandId: form.brandId ? parseInt(form.brandId) : null,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        length: form.length ? parseFloat(form.length) : undefined,
        width: form.width ? parseFloat(form.width) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        videoUrl: form.videoUrl || undefined,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : undefined,
        publishStatus: form.publishStatus || "published",
        relatedProductIds: form.relatedProductIds
          ? form.relatedProductIds
              .split(",")
              .map((t: string) => parseInt(t.trim()))
              .filter((n: number) => !isNaN(n))
          : undefined,
        metaTitle: form.metaTitle || undefined,
        metaDesc: form.metaDesc || undefined,
        images: images.filter((i) => i.url),
        variants: variants.map((v) => ({
          id: v.id || undefined,
          name: v.name,
          sku: v.sku || undefined,
          price: v.price,
          stock: v.stock,
          attributes: v.attributes,
          images: v.images || [],
          isActive: v.isActive ?? true,
        })),
        attrDefs: attrDefs.map((a) => ({
          id: a.id || undefined,
          name: a.name,
          values: a.values,
        })),
        specifications: specifications.filter((s) => s.name && s.value),
      };
      await api.put(`/products/${id}`, payload);
      router.push("/products");
    } catch (err) {
      alert(err);
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="animate-fade-in">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg animate-pulse"
              style={{ background: "var(--v-bg)" }}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div className="animate-fade-in max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
          ویرایش محصول
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--v-text-secondary)" }}
        >
          شناسه: {id}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-5">
            {/* اطلاعات پایه */}
            <div className="v-card space-y-5">
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
            <div className="v-card space-y-5">
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
            <div className="v-card space-y-5">
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
            <div className="v-card space-y-5">
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
            <div className="v-card space-y-5">
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
            <div className="v-card space-y-5">
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
            <div className="v-card space-y-5">
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

            {/* Variants Section */}
            <div className="v-card space-y-5">
              <div
                className="pb-3 border-b"
                style={{ borderColor: "var(--v-border)" }}
              >
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon
                    icon="tabler:layers-difference"
                    className="w-4 h-4"
                    style={{ color: "var(--v-primary)" }}
                  />
                  تنوع‌ها (Variants)
                </h3>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--v-text)" }}
                >
                  ویژگی‌های تنوع (مثل رنگ، سایز)
                </label>
                {attrDefs.map((attr, idx) => (
                  <div
                    key={attr.id || idx}
                    className="flex gap-2 items-center mb-2"
                  >
                    <input
                      className="v-input w-1/3"
                      placeholder="نام ویژگی"
                      value={attr.name}
                      onChange={(e) => {
                        const next = [...attrDefs];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setAttrDefs(next);
                      }}
                    />
                    <input
                      className="v-input flex-1"
                      placeholder="مقادیر (جداشده با کاما)"
                      value={attr.values.join(", ")}
                      onChange={(e) => {
                        const next = [...attrDefs];
                        next[idx] = {
                          ...next[idx],
                          values: e.target.value
                            .split(",")
                            .map((s: string) => s.trim())
                            .filter(Boolean),
                        };
                        setAttrDefs(next);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAttrDefs(attrDefs.filter((_, i) => i !== idx))
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
                    setAttrDefs([...attrDefs, { name: "", values: [] }])
                  }
                  className="v-btn v-btn-secondary v-btn-sm mt-1"
                >
                  <Icon icon="tabler:plus" className="w-3.5 h-3.5" />
                  افزودن ویژگی جدید
                </button>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--v-text)" }}
                >
                  مقادیر تنوع
                </label>
                {variants.map((v, idx) => (
                  <div
                    key={v.id || idx}
                    className="border rounded-lg p-3 mb-2"
                    style={{
                      background: "var(--v-bg)",
                      borderColor: "var(--v-border)",
                    }}
                  >
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <input
                        className="v-input"
                        placeholder="نام (مثلا قرمز ۴۲)"
                        value={v.name}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setVariants(next);
                        }}
                      />
                      <input
                        className="v-input"
                        placeholder="SKU"
                        value={v.sku || ""}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx] = { ...next[idx], sku: e.target.value };
                          setVariants(next);
                        }}
                      />
                      <input
                        type="number"
                        className="v-input"
                        placeholder="قیمت (اختیاری)"
                        value={v.price ?? ""}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx] = {
                            ...next[idx],
                            price: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          };
                          setVariants(next);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="number"
                        className="v-input"
                        placeholder="موجودی"
                        value={v.stock ?? 0}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx] = {
                            ...next[idx],
                            stock: parseInt(e.target.value) || 0,
                          };
                          setVariants(next);
                        }}
                      />
                      <input
                        className="v-input font-mono text-xs"
                        placeholder="ویژگی‌ها (JSON)"
                        value={JSON.stringify(v.attributes)}
                        onChange={(e) => {
                          const next = [...variants];
                          try {
                            next[idx] = {
                              ...next[idx],
                              attributes: JSON.parse(e.target.value),
                            };
                          } catch {
                            next[idx] = {
                              ...next[idx],
                              attributes: e.target.value,
                            };
                          }
                          setVariants(next);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setVariants(variants.filter((_, i) => i !== idx))
                      }
                      className="v-btn v-btn-sm"
                      style={{ color: "var(--v-error)" }}
                    >
                      <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                      حذف تنوع
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setVariants([
                      ...variants,
                      {
                        name: "",
                        sku: "",
                        price: null,
                        stock: 0,
                        attributes: {},
                        images: [],
                      },
                    ])
                  }
                  className="v-btn v-btn-secondary v-btn-sm"
                >
                  <Icon icon="tabler:plus" className="w-3.5 h-3.5" />
                  افزودن تنوع جدید
                </button>
              </div>
            </div>
          </div>
          {/* ===== SIDEBAR ===== */}
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span style={{ color: "var(--v-text)" }}>
                    محصول فعال / منتشر شده
                  </span>
                </label>
              </div>
            </div>

            {/* برچسب‌ها */}
            <div className="v-card space-y-5">
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
            <div className="v-card space-y-5">
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
              <div className="grid grid-cols-2 gap-4">
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
                  <input
                    type="text"
                    className="v-input"
                    value={form.metaDesc}
                    onChange={(e) =>
                      setForm({ ...form, metaDesc: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div
              className="v-card p-5"
              style={{ position: "sticky", top: "1rem", alignSelf: "start" }}
            >
              <div className="flex gap-3">
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
                      ذخیره تغییرات
                    </>
                  )}
                </button>
                <a href="/products" className="v-btn v-btn-secondary">
                  انصراف
                </a>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
