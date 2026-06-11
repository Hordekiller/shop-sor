"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import JalaliDate from "@/components/JalaliDate";

interface ReturnItem {
  itemId: number;
  quantity: number;
}

interface ReturnRequest {
  id: number;
  orderId: number;
  reason: string;
  description?: string;
  status: string;
  items: string;
  refundAmount?: number;
  adminNote?: string;
  createdAt: string;
  user: { id: number; name: string; email: string; phone?: string };
  order: { orderNumber: string; total: number };
}

const reasonLabels: Record<string, string> = {
  defective: "معیوب",
  wrong_item: "کالای اشتباه",
  not_as_described: "مغایر با توضیحات",
  other: "سایر",
};

const statusBadge: Record<string, string> = {
  pending: "v-badge-warning",
  approved: "v-badge-info",
  rejected: "v-badge-error",
  completed: "v-badge-success",
};

const statusLabels: Record<string, string> = {
  pending: "در انتظار",
  approved: "تایید شده",
  rejected: "رد شده",
  completed: "تکمیل شده",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      const data = await api.get<{ data: ReturnRequest[]; total: number }>(
        `/admin/returns?${params}`,
      );
      setReturns(data.data);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [page, statusFilter]);

  const handleStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/returns/${id}/status`, { status });
      fetchReturns();
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
            بازگشت کالا
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            مدیریت درخواست‌های بازگشت کالا
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
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="v-select w-auto min-w-[140px]"
        >
          <option value="">همه</option>
          <option value="pending">در انتظار</option>
          <option value="approved">تایید شده</option>
          <option value="rejected">رد شده</option>
          <option value="completed">تکمیل شده</option>
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
      ) : returns.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:rotate-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هیچ درخواست بازگشتی یافت نشد.
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
                  <th>دلیل</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>
                      <a
                        href={`/orders/${r.orderId}`}
                        className="font-medium hover:underline"
                        style={{ color: "var(--v-primary)" }}
                      >
                        {r.order.orderNumber}
                      </a>
                    </td>
                    <td>{r.user?.name || r.user?.email}</td>
                    <td>{reasonLabels[r.reason] || r.reason}</td>
                    <td>
                      <span
                        className={`v-badge ${statusBadge[r.status] || "v-badge-secondary"}`}
                      >
                        {statusLabels[r.status] || r.status}
                      </span>
                    </td>
                    <td
                      className="text-xs"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      <JalaliDate date={r.createdAt} showTime />
                    </td>
                    <td>
                      {r.status === "pending" ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStatus(r.id, "approved")}
                            className="v-btn v-btn-sm v-btn-success px-2"
                          >
                            <Icon icon="tabler:check" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatus(r.id, "rejected")}
                            className="v-btn v-btn-sm v-btn-error px-2"
                          >
                            <Icon icon="tabler:x" className="w-4 h-4" />
                          </button>
                        </div>
                      ) : r.status === "approved" ? (
                        <button
                          onClick={() => handleStatus(r.id, "completed")}
                          className="v-btn v-btn-sm px-2"
                          style={{
                            background: "var(--v-primary)",
                            color: "white",
                          }}
                        >
                          تکمیل
                        </button>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: "var(--v-text-disabled)" }}
                        >
                          —
                        </span>
                      )}
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
