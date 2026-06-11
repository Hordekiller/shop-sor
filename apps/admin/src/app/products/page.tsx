"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  status: string;
  publishStatus: string;
  tags: string[];
  category: { id: number; name: string } | null;
  brand: { id: number; name: string; slug: string } | null;
  _count: { reviews: number };
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}
interface Brand {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [showBulkCategory, setShowBulkCategory] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [showBulkStatus, setShowBulkStatus] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceOp, setPriceOp] = useState<"set" | "percent" | "fixed">(
    "percent",
  );
  const [priceVal, setPriceVal] = useState("10");
  const [priceTarget, setPriceTarget] = useState<"price" | "salePrice">(
    "price",
  );
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any[] | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    brandId: "",
    status: "",
    publishStatus: "",
    isActive: "",
    hasDiscount: "",
    sort: "newest",
  });

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

  useEffect(() => {
    setSelectedIds(new Set());
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "15");
    params.set("sort", filters.sort);
    if (filters.search) params.set("search", filters.search);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.brandId) params.set("brandId", filters.brandId);
    if (filters.status) params.set("status", filters.status);
    if (filters.publishStatus)
      params.set("publishStatus", filters.publishStatus);
    if (filters.isActive) params.set("isActive", filters.isActive);
    if (filters.hasDiscount) params.set("hasDiscount", filters.hasDiscount);

    api
      .get<{
        data: Product[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/products?${params}`)
      .then((res) => {
        setProducts(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, filters]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این محصول اطمینان دارید؟")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      alert(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`آیا از حذف ${selectedIds.size} محصول اطمینان دارید؟`)) return;
    try {
      await api.post("/products/bulk/delete", { ids: Array.from(selectedIds) });
      setProducts(products.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    } catch (err) {
      alert(err);
    }
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      await api.patch("/products/bulk/update", {
        ids: Array.from(selectedIds),
        data: { isActive },
      });
      setProducts(
        products.map((p) => (selectedIds.has(p.id) ? { ...p, isActive } : p)),
      );
      setSelectedIds(new Set());
      setShowBulkStatus(false);
    } catch (err) {
      alert(err);
    }
  };

  const handleBulkPublish = async (publishStatus: string) => {
    if (selectedIds.size === 0) return;
    try {
      await api.patch("/products/bulk/update", {
        ids: Array.from(selectedIds),
        data: { publishStatus },
      });
      setProducts(
        products.map((p) =>
          selectedIds.has(p.id) ? { ...p, publishStatus } : p,
        ),
      );
      setSelectedIds(new Set());
    } catch (err) {
      alert(err);
    }
  };

  const handleBulkCategory = async () => {
    if (selectedIds.size === 0 || !bulkCategoryId) return;
    try {
      await api.patch("/products/bulk/update", {
        ids: Array.from(selectedIds),
        data: { categoryId: Number(bulkCategoryId) },
      });
      const cat = categories.find((c) => c.id === Number(bulkCategoryId));
      setProducts(
        products.map((p) =>
          selectedIds.has(p.id) ? { ...p, category: cat || p.category } : p,
        ),
      );
      setSelectedIds(new Set());
      setShowBulkCategory(false);
    } catch (err) {
      alert(err);
    }
  };

  const handleBulkPrice = async () => {
    if (selectedIds.size === 0) return;
    const val = Number(priceVal);
    if (isNaN(val)) return alert("مقدار نامعتبر");
    try {
      await api.post("/products/bulk/price", {
        ids: Array.from(selectedIds),
        operation: priceOp,
        value: val,
        target: priceTarget,
      });
      const label = priceTarget === "price" ? "قیمت" : "قیمت حراج";
      const opLabel =
        priceOp === "set"
          ? `ثبت ${val}`
          : priceOp === "percent"
            ? `تغییر ${val}%`
            : `تغییر ${val} تومان`;
      alert(`${label} ${opLabel} برای ${selectedIds.size} محصول اعمال شد`);
      setSelectedIds(new Set());
      setShowPriceModal(false);
      // Refetch
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      params.set("sort", filters.sort);
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      const res = await api.get<{
        data: Product[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/products?${params}`);
      setProducts(res.data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResults(null);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2)
        return alert("فایل CSV حداقل باید شامل هدر و یک ردیف باشد.");
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/^["']|["']$/g, ""));
      const products = lines.slice(1).map((line) => {
        const vals = line
          .split(",")
          .map((v) => v.trim().replace(/^["']|["']$/g, ""));
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = vals[i] || "";
        });
        return obj;
      });
      const result = await api.post<any[]>("/products/bulk/import", {
        products,
      });
      setImportResults(result);
    } catch (err: any) {
      alert("خطا در ایمپورت: " + err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
      window.location.reload();
    }
  };

  const handleExportCSV = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    const data = (selected.length > 0 ? selected : products).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      salePrice: p.salePrice || "",
      stock: p.stock,
      status: p.status,
      publishStatus: p.publishStatus,
      isActive: p.isActive,
      category: p.category?.name || "",
      brand: p.brand?.name || "",
    }));
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(","),
      ...data.map((r) =>
        headers.map((h) => String((r as any)[h] ?? "")).join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    }); // BOM for Persian Excel
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const statusBadge = (product: Product) => {
    if (!product.isActive)
      return <span className="v-badge v-badge-secondary">غیرفعال</span>;
    if (product.publishStatus === "draft")
      return <span className="v-badge v-badge-warning">پیش‌نویس</span>;
    if (product.status === "out_of_stock")
      return <span className="v-badge v-badge-error">ناموجود</span>;
    if (product.status === "coming_soon")
      return <span className="v-badge v-badge-info">به‌زودی</span>;
    return <span className="v-badge v-badge-success">فعال</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            محصولات
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            {total} محصول
          </p>
        </div>
        <div className="flex gap-3">
          <a href="/inventory" className="v-btn v-btn-secondary">
            <Icon icon="tabler:warehouse" className="w-4 h-4" />
            مدیریت انبار
          </a>
          <button
            onClick={() => {
              const data = products.map((p) => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                price: p.price,
                salePrice: p.salePrice || "",
                stock: p.stock,
                status: p.status,
                publishStatus: p.publishStatus,
                isActive: p.isActive,
                category: p.category?.name || "",
                brand: p.brand?.name || "",
              }));
              const headers = Object.keys(data[0] || {});
              const csv = [
                headers.join(","),
                ...data.map((r) =>
                  headers.map((h) => String((r as any)[h] ?? "")).join(","),
                ),
              ].join("\n");
              const blob = new Blob(["\uFEFF" + csv], {
                type: "text/csv;charset=utf-8;",
              });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
              link.click();
              URL.revokeObjectURL(link.href);
            }}
            className="v-btn v-btn-secondary"
          >
            <Icon icon="tabler:file-spreadsheet" className="w-4 h-4" />
            خروجی CSV
          </button>
          <a href="/products/new" className="v-btn v-btn-primary">
            <Icon icon="tabler:plus" className="w-4 h-4" />
            محصول جدید
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="v-card p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--v-text-secondary)" }}
            >
              جستجو
            </label>
            <input
              type="text"
              className="v-input"
              placeholder="نام، توضیحات، SKU..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--v-text-secondary)" }}
            >
              دسته‌بندی
            </label>
            <select
              className="v-select"
              value={filters.categoryId}
              onChange={(e) => {
                setFilters({ ...filters, categoryId: e.target.value });
                setPage(1);
              }}
            >
              <option value="">همه</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--v-text-secondary)" }}
            >
              برند
            </label>
            <select
              className="v-select"
              value={filters.brandId}
              onChange={(e) => {
                setFilters({ ...filters, brandId: e.target.value });
                setPage(1);
              }}
            >
              <option value="">همه</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--v-text-secondary)" }}
            >
              وضعیت موجودی
            </label>
            <select
              className="v-select"
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(1);
              }}
            >
              <option value="">همه</option>
              <option value="in_stock">موجود</option>
              <option value="out_of_stock">ناموجود</option>
              <option value="coming_soon">به‌زودی</option>
              <option value="display_only">فقط نمایش</option>
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--v-text-secondary)" }}
            >
              وضعیت انتشار
            </label>
            <select
              className="v-select"
              value={filters.publishStatus}
              onChange={(e) => {
                setFilters({ ...filters, publishStatus: e.target.value });
                setPage(1);
              }}
            >
              <option value="">همه</option>
              <option value="published">منتشر شده</option>
              <option value="draft">پیش‌نویس</option>
              <option value="pending_review">در انتظار بررسی</option>
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--v-text-secondary)" }}
            >
              فعالیت
            </label>
            <select
              className="v-select"
              value={filters.isActive}
              onChange={(e) => {
                setFilters({ ...filters, isActive: e.target.value });
                setPage(1);
              }}
            >
              <option value="">همه</option>
              <option value="true">فعال</option>
              <option value="false">غیرفعال</option>
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--v-text-secondary)" }}
            >
              تخفیف
            </label>
            <select
              className="v-select"
              value={filters.hasDiscount}
              onChange={(e) => {
                setFilters({ ...filters, hasDiscount: e.target.value });
                setPage(1);
              }}
            >
              <option value="">همه</option>
              <option value="true">تخفیف‌دار</option>
            </select>
          </div>
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--v-text-secondary)" }}
            >
              مرتب‌سازی
            </label>
            <select
              className="v-select"
              value={filters.sort}
              onChange={(e) => {
                setFilters({ ...filters, sort: e.target.value });
                setPage(1);
              }}
            >
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="cheapest">ارزان‌ترین</option>
              <option value="expensive">گران‌ترین</option>
              <option value="popular">محبوب‌ترین</option>
              <option value="best_selling">پرفروش‌ترین</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg animate-pulse"
              style={{ background: "var(--v-bg)" }}
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:package-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هیچ محصولی یافت نشد.
          </p>
        </div>
      ) : (
        <>
          {selectedIds.size > 0 && (
            <div
              className="flex items-center gap-2 p-3 mb-3 rounded-lg"
              style={{
                background: "rgba(115,103,240,0.08)",
                border: "1px solid rgba(115,103,240,0.2)",
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: "var(--v-primary)" }}
              >
                {selectedIds.size} محصول انتخاب‌شده
              </span>
              <div className="mr-auto flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="v-btn v-btn-sm"
                  style={{ color: "var(--v-error)" }}
                >
                  <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                  حذف
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowBulkStatus(!showBulkStatus)}
                    className="v-btn v-btn-secondary v-btn-sm"
                  >
                    <Icon icon="tabler:toggle-left" className="w-3.5 h-3.5" />
                    فعال/غیرفعال
                  </button>
                  {showBulkStatus && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowBulkStatus(false)}
                      />
                      <div
                        className="absolute top-full left-0 mt-1 w-36 z-20 rounded-lg py-1 shadow-lg animate-fade-in"
                        style={{
                          background: "var(--v-card)",
                          border: "1px solid var(--v-border)",
                        }}
                      >
                        <button
                          onClick={() => handleBulkStatus(true)}
                          className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 transition"
                        >
                          فعال کردن
                        </button>
                        <button
                          onClick={() => handleBulkStatus(false)}
                          className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 transition"
                        >
                          غیرفعال کردن
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleBulkPublish("published")}
                  className="v-btn v-btn-secondary v-btn-sm"
                >
                  منتشر کردن
                </button>
                <button
                  onClick={() => handleBulkPublish("draft")}
                  className="v-btn v-btn-secondary v-btn-sm"
                >
                  پیش‌نویس
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowBulkCategory(!showBulkCategory)}
                    className="v-btn v-btn-secondary v-btn-sm"
                  >
                    <Icon icon="tabler:category" className="w-3.5 h-3.5" />
                    تغییر دسته
                  </button>
                  {showBulkCategory && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowBulkCategory(false)}
                      />
                      <div
                        className="absolute top-full left-0 mt-1 w-48 z-20 rounded-lg py-2 px-3 shadow-lg animate-fade-in"
                        style={{
                          background: "var(--v-card)",
                          border: "1px solid var(--v-border)",
                        }}
                      >
                        <select
                          className="v-select w-full mb-2"
                          value={bulkCategoryId}
                          onChange={(e) => setBulkCategoryId(e.target.value)}
                        >
                          <option value="">انتخاب دسته</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleBulkCategory}
                          className="v-btn v-btn-primary v-btn-sm w-full"
                        >
                          اعمال
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowPriceModal(true)}
                  className="v-btn v-btn-secondary v-btn-sm"
                >
                  <Icon icon="tabler:currency-dollar" className="w-3.5 h-3.5" />
                  تغییر قیمت
                </button>
                <button
                  onClick={handleExportCSV}
                  className="v-btn v-btn-secondary v-btn-sm"
                >
                  <Icon
                    icon="tabler:file-spreadsheet"
                    className="w-3.5 h-3.5"
                  />
                  خروجی CSV
                </button>
                <label className="v-btn v-btn-secondary v-btn-sm cursor-pointer">
                  <Icon icon="tabler:file-import" className="w-3.5 h-3.5" />
                  {importing ? "در حال ..." : "ورودی CSV"}
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVImport}
                    disabled={importing}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="v-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="v-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        className="v-checkbox"
                        checked={
                          products.length > 0 &&
                          selectedIds.size === products.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>شناسه</th>
                    <th>عنوان</th>
                    <th>دسته‌بندی</th>
                    <th>برند</th>
                    <th>قیمت</th>
                    <th>موجودی</th>
                    <th>وضعیت</th>
                    <th>برچسب‌ها</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      style={{
                        background: selectedIds.has(product.id)
                          ? "rgba(115,103,240,0.04)"
                          : undefined,
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          className="v-checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                        />
                      </td>
                      <td className="font-medium">{product.id}</td>
                      <td
                        className="font-medium max-w-[200px] truncate"
                        title={product.title}
                      >
                        {product.title}
                      </td>
                      <td style={{ color: "var(--v-text-secondary)" }}>
                        {product.category?.name || "—"}
                      </td>
                      <td>{product.brand?.name || "—"}</td>
                      <td>
                        {product.salePrice ? (
                          <>
                            <span style={{ color: "var(--v-error)" }}>
                              {product.salePrice.toLocaleString()}
                            </span>
                            <span
                              className="mr-1 text-xs line-through"
                              style={{ color: "var(--v-text-disabled)" }}
                            >
                              {product.price.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span>{product.price.toLocaleString()}</span>
                        )}
                      </td>
                      <td>
                        {product.stock <= 0 ? (
                          <span className="v-badge v-badge-error">ناموجود</span>
                        ) : product.stock <= product.lowStockThreshold ? (
                          <span className="v-badge v-badge-warning">
                            {product.stock}
                          </span>
                        ) : (
                          <span className="v-badge v-badge-success">
                            {product.stock}
                          </span>
                        )}
                      </td>
                      <td>{statusBadge(product)}</td>
                      <td>
                        <div className="flex gap-1 flex-wrap max-w-[120px]">
                          {(Array.isArray(product.tags) ? product.tags : [])
                            .slice(0, 2)
                            .map((tag, i) => (
                              <span
                                key={i}
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  background: "rgba(115,103,240,0.1)",
                                  color: "var(--v-primary)",
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/products/${product.id}`}
                            className="v-btn v-btn-secondary v-btn-sm"
                          >
                            <Icon icon="tabler:edit" className="w-3.5 h-3.5" />
                            ویرایش
                          </a>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="v-btn v-btn-sm"
                            style={{ color: "var(--v-error)" }}
                          >
                            <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p
                className="text-sm"
                style={{ color: "var(--v-text-secondary)" }}
              >
                صفحه {page} از {totalPages} (مجموع {total} محصول)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="v-btn v-btn-secondary v-btn-sm"
                  style={{ opacity: page <= 1 ? 0.5 : 1 }}
                >
                  <Icon icon="tabler:chevron-right" className="w-4 h-4" />
                  قبلی
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="v-btn v-btn-sm min-w-[36px]"
                      style={{
                        background:
                          p === page ? "var(--v-primary)" : "transparent",
                        color: p === page ? "white" : "var(--v-text-secondary)",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="v-btn v-btn-secondary v-btn-sm"
                  style={{ opacity: page >= totalPages ? 0.5 : 1 }}
                >
                  بعدی
                  <Icon icon="tabler:chevron-left" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bulk Price Modal */}
      {showPriceModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowPriceModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-xl p-6"
              style={{
                background: "var(--v-card)",
                border: "1px solid var(--v-border)",
              }}
            >
              <h3
                className="text-lg font-bold mb-4"
                style={{ color: "var(--v-text)" }}
              >
                تغییر قیمت دسته‌جمعی
              </h3>
              <p
                className="text-sm mb-4"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {selectedIds.size} محصول انتخاب شده
              </p>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    عملیات
                  </label>
                  <select
                    className="v-select"
                    value={priceOp}
                    onChange={(e) => setPriceOp(e.target.value as any)}
                  >
                    <option value="percent">درصد (±%)</option>
                    <option value="fixed">مبلغ ثابت (± تومان)</option>
                    <option value="set">ثبت مقدار مشخص</option>
                  </select>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    مقدار
                  </label>
                  <input
                    type="number"
                    className="v-input"
                    value={priceVal}
                    onChange={(e) => setPriceVal(e.target.value)}
                  />
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {priceOp === "percent"
                      ? "مثال: ۱۰ برای افزایش ۱۰٪، ۵- برای کاهش ۵٪"
                      : priceOp === "fixed"
                        ? "مثال: ۵۰۰۰ برای افزایش، ۲۰۰۰- برای کاهش"
                        : "قیمت نهایی به تومان"}
                  </p>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    هدف
                  </label>
                  <select
                    className="v-select"
                    value={priceTarget}
                    onChange={(e) => setPriceTarget(e.target.value as any)}
                  >
                    <option value="price">قیمت اصلی</option>
                    <option value="salePrice">قیمت حراجی</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleBulkPrice}
                    className="v-btn v-btn-primary flex-1"
                  >
                    اعمال
                  </button>
                  <button
                    onClick={() => setShowPriceModal(false)}
                    className="v-btn v-btn-secondary flex-1"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
