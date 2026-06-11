"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface BlogComment {
  id: number;
  content: string;
  name: string | null;
  email: string | null;
  website: string | null;
  isApproved: boolean;
  createdAt: string;
  user: { id: number; name: string; avatar: string | null } | null;
  post: { id: number; title: string; slug: string };
  replies: BlogComment[];
}

export default function BlogCommentsPage() {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchComments = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      if (filter) params.set("isApproved", filter);
      const res = await api.get<{
        data: BlogComment[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/blog/admin/comments?${params}`);
      setComments(res.data);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
  }, [filter]);

  const handleApprove = async (id: number, approve: boolean) => {
    try {
      await api.put(`/blog/admin/comments/${id}`, { isApproved: approve });
      fetchComments();
    } catch {
      alert("خطا");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این نظر اطمینان دارید؟")) return;
    try {
      await api.delete(`/blog/admin/comments/${id}`);
      fetchComments();
    } catch {
      alert("خطا");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            نظرات وبلاگ
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            {total} نظر
          </p>
        </div>
        <select
          className="v-select w-36"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">همه نظرات</option>
          <option value="approved">تأیید شده</option>
          <option value="pending">در انتظار تأیید</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl animate-pulse"
              style={{ background: "#e5e7eb" }}
            />
          ))
        ) : comments.length === 0 ? (
          <div className="text-center py-16">
            <Icon
              icon="tabler:message-off"
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: "var(--v-text-disabled)" }}
            />
            <p style={{ color: "var(--v-text-secondary)" }}>
              هیچ نظری یافت نشد.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="v-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon
                      icon="tabler:user"
                      className="w-4 h-4"
                      style={{ color: "var(--v-text-secondary)" }}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      {comment.user?.name || comment.name || "ناشناس"}
                    </span>
                    {comment.post && (
                      <span
                        className="text-xs mr-2"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        روی پست: {comment.post.title}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {comment.isApproved ? (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: "#DCFCE7", color: "#166534" }}
                    >
                      تأیید شده
                    </span>
                  ) : (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: "#FEF3C7", color: "#92400E" }}
                    >
                      در انتظار
                    </span>
                  )}
                  <span
                    className="text-xs"
                    style={{ color: "var(--v-text-disabled)" }}
                  >
                    {new Date(comment.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                </div>
              </div>
              <p className="text-sm mb-3 whitespace-pre-wrap">
                {comment.content}
              </p>
              <div className="flex gap-2">
                {!comment.isApproved && (
                  <button
                    onClick={() => handleApprove(comment.id, true)}
                    className="v-btn v-btn-sm"
                    style={{ color: "#28C76F", borderColor: "#28C76F" }}
                  >
                    <Icon icon="tabler:check" className="w-3.5 h-3.5" />
                    تأیید
                  </button>
                )}
                {comment.isApproved && (
                  <button
                    onClick={() => handleApprove(comment.id, false)}
                    className="v-btn v-btn-sm"
                    style={{ color: "#FF9F43", borderColor: "#FF9F43" }}
                  >
                    <Icon icon="tabler:x" className="w-3.5 h-3.5" />
                    رد
                  </button>
                )}
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="v-btn v-btn-sm"
                  style={{ color: "#ef4444", borderColor: "#ef4444" }}
                >
                  <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => fetchComments(page - 1)}
            className="v-btn v-btn-sm v-btn-secondary"
          >
            قبلی
          </button>
          <span
            className="text-sm px-3 py-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            {page} از {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => fetchComments(page + 1)}
            className="v-btn v-btn-sm v-btn-secondary"
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
