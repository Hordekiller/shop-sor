"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCheck,
  faTimes,
  faTrash,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";

interface Review {
  id: number;
  rating: number;
  comment: string;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: string;
  product: { id: number; title: string };
  user: { id: number; name: string };
}

interface Stats {
  totalReviews: number;
  pendingReviews: number;
  avgRating: number;
}

interface ReviewsResponse {
  data: Review[];
  totalPages: number;
  page: number;
  stats: Stats;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-400 text-xs">
      {[1, 2, 3, 4, 5].map((i) => (
        <FontAwesomeIcon
          key={i}
          icon={faStar}
          className={i <= rating ? "" : "opacity-25"}
        />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "approved">("all");
  const [expert, setExpert] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    pendingReviews: 0,
    avgRating: 0,
  });

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), status, search });
      if (expert) params.set("expert", "1");
      const res = await api.get<ReviewsResponse>(`/admin/reviews?${params}`);
      setReviews(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
      setStats(res.stats);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews(1);
  }, [search, status, expert]);

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/admin/reviews/${id}/approve`, {});
      fetchReviews(page);
    } catch {
      alert("خطا در تأیید نظر");
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await api.delete(`/admin/reviews/${id}`);
      setDeleteConfirm(null);
      fetchReviews(page);
    } catch {
      alert("خطا در حذف نظر");
    }
    setDeleting(false);
  };

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-gray-500">تعداد نظرات</div>
          <div className="text-2xl font-bold mt-1">{stats.totalReviews}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-gray-500">نظرات در انتظار تأیید</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">
            {stats.pendingReviews}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-sm text-gray-500">میانگین امتیاز</div>
          <div className="text-2xl font-bold mt-1 flex items-center gap-2">
            {stats.avgRating.toFixed(1)}
            <FontAwesomeIcon icon={faStar} className="text-amber-400 text-lg" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            />
            <input
              type="text"
              placeholder="جستجو در نظرات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border pr-9 px-4 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["all", "pending", "approved"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-md text-sm transition ${status === s ? "bg-white shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"}`}
              >
                {s === "all"
                  ? "همه"
                  : s === "pending"
                    ? "در انتظار"
                    : "تأیید شده"}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={expert}
              onChange={(e) => setExpert(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            نظرات کارشناسی
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium w-12">ردیف</th>
              <th className="text-right px-4 py-3 font-medium">محصول</th>
              <th className="text-right px-4 py-3 font-medium">کاربر</th>
              <th className="text-center px-4 py-3 font-medium">امتیاز</th>
              <th className="text-right px-4 py-3 font-medium">نظر</th>
              <th className="text-center px-4 py-3 font-medium">تأیید شده</th>
              <th className="text-center px-4 py-3 font-medium">
                خریدار تأیید شده
              </th>
              <th className="text-center px-4 py-3 font-medium">تاریخ</th>
              <th className="text-center px-4 py-3 font-medium w-28">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  در حال بارگذاری...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  نظری یافت نشد
                </td>
              </tr>
            ) : (
              reviews.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-gray-500">
                    {(page - 1) * 50 + i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/products/${r.product.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {r.product.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.user.name}</td>
                  <td className="px-4 py-3 text-center">
                    <Stars rating={r.rating} />
                  </td>
                  <td
                    className="px-4 py-3 text-gray-600 max-w-xs truncate"
                    title={r.comment}
                  >
                    {truncate(r.comment, 80)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.isApproved ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                        تأیید شده
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">
                        در انتظار تأیید
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.isVerified ? (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-green-500 text-sm"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faTimes}
                        className="text-red-400 text-sm"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString("fa-IR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {!r.isApproved && (
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-green-50 text-green-600 hover:bg-green-100 transition"
                        >
                          تأیید
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(r.id)}
                        className="px-3 py-1.5 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100 transition"
                      >
                        <FontAwesomeIcon icon={faTrash} className="ml-1" />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchReviews(p)}
              className={`px-3 py-1.5 rounded-lg text-sm ${page === p ? "bg-indigo-600 text-white" : "bg-white border hover:bg-gray-50"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2">حذف نظر</h3>
            <p className="text-sm text-gray-500 mb-6">
              آیا از حذف این نظر اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 text-white py-2.5 text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "در حال حذف..." : "حذف"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
