"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import JalaliDate from "@/components/JalaliDate";

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
}
interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  user: { id: number; name: string; email: string };
  items: OrderItem[];
  createdAt: string;
}

const statusOptions = [
  { value: "", label: "همه" },
  { value: "pending", label: "در انتظار" },
  { value: "confirmed", label: "تایید شده" },
  { value: "processing", label: "در حال پردازش" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل شده" },
  { value: "cancelled", label: "لغو شده" },
];

const statusBadge: Record<string, string> = {
  pending: "v-badge-warning",
  confirmed: "v-badge-info",
  processing: "v-badge-primary",
  shipped: "v-badge-secondary",
  delivered: "v-badge-success",
  cancelled: "v-badge-error",
};

const statusLabels: Record<string, string> = {
  pending: "در انتظار",
  confirmed: "تایید شده",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("take", String(perPage));
      const data = await api.get<{ data: Order[]; total: number }>(
        `/orders/all?${params}`,
      );
      setOrders(data.data);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleStatus = async (id: number, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      fetchOrders();
    } catch (err) {
      alert(err);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            سفارشات
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            مدیریت و پیگیری سفارشات
          </p>
        </div>
        <span
          className="text-sm px-3 py-1 rounded-lg"
          style={{
            background: "rgba(115,103,240,0.08)",
            color: "var(--v-primary)",
          }}
        >
          مجموع: {total}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی شماره سفارش یا مشتری..."
            className="v-input"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="v-select w-auto min-w-[140px]"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
      ) : orders.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:shopping-cart-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هیچ سفارشی یافت نشد.
          </p>
        </div>
      ) : (
        <div className="v-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="v-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>شماره سفارش</th>
                  <th>مشتری</th>
                  <th>تعداد</th>
                  <th>مجموع</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      <a
                        href={`/orders/${order.id}`}
                        className="font-medium hover:underline"
                        style={{ color: "var(--v-primary)" }}
                      >
                        {order.orderNumber}
                      </a>
                    </td>
                    <td>{order.user?.name || order.user?.email}</td>
                    <td>{order.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="font-medium">
                      {order.total.toLocaleString()} تومان
                    </td>
                    <td>
                      <span
                        className={`v-badge ${statusBadge[order.status] || "v-badge-secondary"}`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td
                      className="text-xs"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      <JalaliDate date={order.createdAt} showTime />
                    </td>
                    <td>
                      <select
                        className="v-select w-auto text-xs py-1 min-w-[100px]"
                        value={order.status}
                        onChange={(e) => handleStatus(order.id, e.target.value)}
                      >
                        {statusOptions
                          .filter((o) => o.value)
                          .map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="v-btn v-btn-secondary v-btn-sm"
          >
            <Icon icon="tabler:chevron-right" className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="v-btn v-btn-sm"
              style={{
                background: page === p ? "var(--v-primary)" : "transparent",
                color: page === p ? "white" : "var(--v-text-secondary)",
                border: page === p ? "none" : "1px solid var(--v-border)",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="v-btn v-btn-secondary v-btn-sm"
          >
            <Icon icon="tabler:chevron-left" className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
