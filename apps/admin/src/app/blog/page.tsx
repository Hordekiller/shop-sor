"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface Post {
  id: number;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  author: { id: number; name: string; avatar: string | null };
  categories: { category: { id: number; name: string } }[];
  tags: { tag: { id: number; name: string } }[];
  _count: { comments: number };
}

export default function BlogListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const fetchPosts = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await api.get<{
        data: Post[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/blog/admin/posts?${params}`);
      setPosts(res.data);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, [statusFilter]);

  const statusBadge = (s: string) => {
    const m: Record<string, { label: string; color: string }> = {
      draft: { label: "پیش‌نویس", color: "#6B7280" },
      published: { label: "منتشر شده", color: "#28C76F" },
      scheduled: { label: "زمان‌بندی شده", color: "#FF9F43" },
    };
    const b = m[s] || { label: s, color: "#64748B" };
    return (
      <span
        className="px-2 py-0.5 rounded text-xs text-white font-medium"
        style={{ background: b.color }}
      >
        {b.label}
      </span>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            وبلاگ
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            {total} پست
          </p>
        </div>
        <button
          onClick={() => router.push("/blog/new")}
          className="v-btn v-btn-primary"
        >
          <Icon icon="tabler:plus" className="w-4 h-4" />
          پست جدید
        </button>
      </div>

      <div className="v-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            className="v-input w-full"
            placeholder="جستجوی پست‌ها..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPosts(1)}
          />
        </div>
        <select
          className="v-select w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="draft">پیش‌نویس</option>
          <option value="published">منتشر شده</option>
          <option value="scheduled">زمان‌بندی شده</option>
        </select>
        <button onClick={() => fetchPosts(1)} className="v-btn v-btn-primary">
          <Icon icon="tabler:search" className="w-4 h-4" />
          جستجو
        </button>
      </div>

      <div className="v-card overflow-hidden">
        <table className="v-table">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) setSelected(posts.map((p) => p.id));
                    else setSelected([]);
                  }}
                  checked={selected.length === posts.length && posts.length > 0}
                />
              </th>
              <th>عنوان</th>
              <th>نویسنده</th>
              <th>دسته‌بندی</th>
              <th>وضعیت</th>
              <th>بازدید</th>
              <th>نظرات</th>
              <th>تاریخ</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j}>
                      <div
                        className="h-5 rounded animate-pulse"
                        style={{ background: "#e5e7eb" }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : posts.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-12"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  هیچ پستی یافت نشد
                </td>
              </tr>
            ) : (
              posts.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/blog/${p.id}`)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(p.id)
                            ? prev.filter((x) => x !== p.id)
                            : [...prev, p.id],
                        )
                      }
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-sm truncate max-w-[300px]">
                        {p.title}
                      </div>
                    </div>
                  </td>
                  <td
                    className="text-xs"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {p.author.name}
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {p.categories.slice(0, 2).map((c) => (
                        <span
                          key={c.category.id}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{ background: "#F3F4F6", color: "#6B7280" }}
                        >
                          {c.category.name}
                        </span>
                      ))}
                      {p.categories.length > 2 && (
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--v-text-disabled)" }}
                        >
                          +{p.categories.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{statusBadge(p.status)}</td>
                  <td
                    className="text-xs"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {p.viewCount.toLocaleString()}
                  </td>
                  <td
                    className="text-xs"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {p._count.comments}
                  </td>
                  <td
                    className="text-xs"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {new Date(p.createdAt).toLocaleDateString("fa-IR")}
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/blog/${p.id}`);
                      }}
                      className="p-1 rounded hover:bg-gray-100"
                      style={{ color: "var(--v-primary)" }}
                    >
                      <Icon icon="tabler:edit" className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => fetchPosts(page - 1)}
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
            onClick={() => fetchPosts(page + 1)}
            className="v-btn v-btn-sm v-btn-secondary"
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
