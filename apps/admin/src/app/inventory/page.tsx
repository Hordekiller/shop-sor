"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import JalaliDate from "@/components/JalaliDate";

interface Product {
  id: number;
  title: string;
  slug: string;
  sku: string | null;
  stock: number;
  lowStockThreshold: number;
  price: number;
  salePrice: number | null;
  isActive: boolean;
  images: string;
  category: { id: number; name: string } | null;
  _count: { stockMovements: number };
}

interface Movement {
  id: number;
  type: string;
  quantity: number;
  reason: string | null;
  stockAfter: number | null;
  createdAt: string;
  creator: { id: number; name: string };
  variant: { id: number; name: string } | null;
}

function StockBadge({
  stock,
  threshold,
}: {
  stock: number;
  threshold: number;
}) {
  if (stock <= 0) return <span className="v-badge v-badge-error">ناموجود</span>;
  if (stock <= threshold)
    return <span className="v-badge v-badge-warning">محدود ({stock})</span>;
  return <span className="v-badge v-badge-success">موجود ({stock})</span>;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [adjustModal, setAdjustModal] = useState<{
    productId: number;
    title: string;
    currentStock: number;
  } | null>(null);
  const [adjustType, setAdjustType] = useState<"IN" | "OUT" | "ADJUSTMENT">(
    "ADJUSTMENT",
  );
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const [historyProduct, setHistoryProduct] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const fetchProducts = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/inventory/products?page=${p}&limit=50${search ? `&search=${encodeURIComponent(search)}` : ""}`,
      );
      setProducts(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts(1);
  }, [search]);

  const openAdjust = (p: Product) => {
    setAdjustModal({ productId: p.id, title: p.title, currentStock: p.stock });
    setAdjustType("ADJUSTMENT");
    setAdjustQty(0);
    setAdjustReason("");
  };

  const handleAdjust = async () => {
    if (!adjustModal) return;
    setAdjusting(true);
    try {
      await api.post("/inventory/adjust", {
        productId: adjustModal.productId,
        type: adjustType,
        quantity: adjustQty,
        reason:
          adjustReason ||
          (adjustType === "IN"
            ? "افزایش موجودی"
            : adjustType === "OUT"
              ? "کاهش موجودی"
              : "تنظیم دستی"),
      });
      setAdjustModal(null);
      fetchProducts(page);
    } catch {
      alert("خطا در ثبت تغییرات");
    }
    setAdjusting(false);
  };

  const openHistory = async (p: Product) => {
    setHistoryProduct({ id: p.id, title: p.title });
    setMovements([]);
    setHistoryPage(1);
    setHistoryTotalPages(1);
    setHistoryLoading(true);
    try {
      const res = await api.get<any>(
        `/inventory/movements/${p.id}?page=1&limit=20`,
      );
      setMovements(res.data);
      setHistoryTotalPages(res.totalPages);
    } catch {}
    setHistoryLoading(false);
  };

  const loadMoreHistory = async () => {
    if (!historyProduct || historyPage >= historyTotalPages) return;
    const np = historyPage + 1;
    setHistoryLoading(true);
    try {
      const res = await api.get<any>(
        `/inventory/movements/${historyProduct.id}?page=${np}&limit=20`,
      );
      setMovements((prev) => [...prev, ...res.data]);
      setHistoryPage(np);
    } catch {}
    setHistoryLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--v-text)" }}
          >
            <Icon
              icon="tabler:building-factory"
              className="w-7 h-7"
              style={{ color: "var(--v-primary)" }}
            />
            مدیریت انبار
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            مدیریت موجودی و حرکات انبار
          </p>
        </div>
        <input
          type="text"
          placeholder="جستجوی محصول..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="v-input w-64"
        />
      </div>

      <div className="v-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="v-table">
            <thead>
              <tr>
                <th>محصول</th>
                <th>دسته</th>
                <th className="text-center">موجودی</th>
                <th className="text-center">آستانه</th>
                <th className="text-center">قیمت</th>
                <th className="text-center">حرکات</th>
                <th className="text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}>
                      <div
                        className="h-10 rounded animate-pulse"
                        style={{ background: "var(--v-bg)" }}
                      />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    <Icon
                      icon="tabler:package-off"
                      className="w-8 h-8 mx-auto mb-2"
                      style={{ color: "var(--v-text-disabled)" }}
                    />
                    محصولی یافت نشد
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button
                        onClick={() => openHistory(p)}
                        className="text-right font-medium hover:underline"
                        style={{ color: "var(--v-primary)" }}
                      >
                        {p.title}
                        {p.sku && (
                          <div
                            className="text-xs font-normal"
                            style={{ color: "var(--v-text-disabled)" }}
                          >
                            SKU: {p.sku}
                          </div>
                        )}
                      </button>
                    </td>
                    <td style={{ color: "var(--v-text-secondary)" }}>
                      {p.category?.name || "-"}
                    </td>
                    <td className="text-center">
                      <StockBadge
                        stock={p.stock}
                        threshold={p.lowStockThreshold}
                      />
                    </td>
                    <td
                      className="text-center"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      {p.lowStockThreshold}
                    </td>
                    <td className="text-center">
                      {p.salePrice || p.price} تومان
                    </td>
                    <td
                      className="text-center"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      {p._count.stockMovements}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => openAdjust(p)}
                        className="v-btn v-btn-secondary v-btn-sm"
                      >
                        <Icon
                          icon="tabler:adjustments-horizontal"
                          className="w-3.5 h-3.5"
                        />
                        تنظیم موجودی
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="v-pagination">
          <button
            onClick={() => fetchProducts(page - 1)}
            disabled={page <= 1}
            className="v-pagination-btn"
          >
            <Icon icon="tabler:chevron-right" className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchProducts(p)}
              className={`v-pagination-btn ${page === p ? "v-pagination-btn-active" : ""}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => fetchProducts(page + 1)}
            disabled={page >= totalPages}
            className="v-pagination-btn"
          >
            <Icon icon="tabler:chevron-left" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustModal && (
        <div className="v-modal-overlay" onClick={() => setAdjustModal(null)}>
          <div
            className="v-modal max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="v-modal-header">
              <h3 className="font-semibold text-lg">تنظیم موجودی</h3>
              <button
                onClick={() => setAdjustModal(null)}
                className="v-btn v-btn-sm"
                style={{ color: "var(--v-text-disabled)" }}
              >
                &times;
              </button>
            </div>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--v-text-secondary)" }}
            >
              {adjustModal.title} — موجودی فعلی:{" "}
              <strong>{adjustModal.currentStock}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  نوع عملیات
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="v-select"
                >
                  <option value="ADJUSTMENT">تنظیم دستی</option>
                  <option value="IN">ورود به انبار</option>
                  <option value="OUT">خروج از انبار</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تعداد</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="v-input"
                  min={0}
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--v-text-disabled)" }}
                >
                  {adjustType === "IN"
                    ? "تعداد اضافه‌شونده به انبار"
                    : adjustType === "OUT"
                      ? "تعداد کم‌شونده از انبار"
                      : "تعداد نهایی (مثبت = افزایش، منفی = کاهش)"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">دلیل</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="v-select"
                >
                  <option value="">انتخاب کنید</option>
                  <option value="خرید از تامین‌کننده">
                    خرید از تامین‌کننده
                  </option>
                  <option value="مرجوعی">مرجوعی</option>
                  <option value="برگشت از سفارش">برگشت از سفارش</option>
                  <option value="انبارگردانی">انبارگردانی</option>
                  <option value="خراب شده">خراب شده</option>
                  <option value="گم شده">گم شده</option>
                  <option value="سایر">سایر</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAdjust}
                disabled={adjusting}
                className="v-btn v-btn-primary flex-1 justify-center"
              >
                {adjusting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    در حال ذخیره...
                  </>
                ) : (
                  "ثبت تغییرات"
                )}
              </button>
              <button
                onClick={() => setAdjustModal(null)}
                className="v-btn v-btn-secondary"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyProduct && (
        <div
          className="v-modal-overlay"
          onClick={() => setHistoryProduct(null)}
        >
          <div
            className="v-modal max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="v-modal-header">
              <h3 className="font-semibold text-lg">تاریخچه حرکات انبار</h3>
              <span
                className="text-sm"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {historyProduct.title}
              </span>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {historyLoading && movements.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg animate-pulse"
                    style={{ background: "var(--v-bg)" }}
                  />
                ))
              ) : movements.length === 0 ? (
                <div
                  className="text-center py-12"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  <Icon
                    icon="tabler:history-off"
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: "var(--v-text-disabled)" }}
                  />
                  هیچ حرکتی ثبت نشده است
                </div>
              ) : (
                movements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg border text-sm"
                    style={{ borderColor: "var(--v-border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${m.type === "IN" ? "bg-green-500" : m.type === "OUT" ? "bg-red-500" : "bg-amber-500"}`}
                      />
                      <div>
                        <span
                          className={`font-medium ${m.type === "IN" ? "text-green-700" : m.type === "OUT" ? "text-red-700" : "text-amber-700"}`}
                        >
                          {m.type === "IN"
                            ? "ورود"
                            : m.type === "OUT"
                              ? "خروج"
                              : "تنظیم"}{" "}
                          {Math.abs(m.quantity)} عدد
                        </span>
                        {m.reason && (
                          <span
                            className="mr-2"
                            style={{ color: "var(--v-text-disabled)" }}
                          >
                            — {m.reason}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className="text-left text-xs"
                      style={{ color: "var(--v-text-disabled)" }}
                    >
                      {m.stockAfter != null && (
                        <div>موجودی پس از تغییر: {m.stockAfter}</div>
                      )}
                      <div>
                        <JalaliDate date={m.createdAt} showTime />
                      </div>
                      <div>{m.creator?.name || "-"}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {historyPage < historyTotalPages && (
              <button
                onClick={loadMoreHistory}
                disabled={historyLoading}
                className="v-btn v-btn-secondary w-full justify-center mt-4"
              >
                {historyLoading ? "در حال بارگذاری..." : "نمایش بیشتر"}
              </button>
            )}
            <button
              onClick={() => setHistoryProduct(null)}
              className="v-btn v-btn-secondary w-full justify-center mt-3"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
