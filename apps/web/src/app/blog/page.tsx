"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  viewCount: number;
  author: { id: number; name: string; avatar: string | null };
  categories: { category: { id: number; name: string; slug: string } }[];
  tags: { tag: { id: number; name: string } }[];
  _count: { comments: number };
}

interface Cat {
  id: number;
  name: string;
  slug: string;
  _count: { posts: number };
  children: Cat[];
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("");

  const fetchPosts = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      if (catFilter) params.set("categoryId", catFilter);
      const res = await api.get<{
        data: Post[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/blog/posts?${params}`);
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
    api
      .get<Cat[]>("/blog/categories")
      .then(setCategories)
      .catch(() => {});
  }, [catFilter]);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero */}
        <div className="bg-gradient-to-l from-[var(--dk-primary)] to-[var(--dk-primary-dark)] py-12 text-white">
          <div className="dk-container">
            <h1 className="text-3xl font-bold mb-2">وبلاگ اطلس شاپ</h1>
            <p className="text-white/80">
              آخرین مقالات، راهنماها و اخبار فروشگاه
            </p>
          </div>
        </div>

        <div className="dk-container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-64 shrink-0">
              <div className="bg-white rounded-xl border border-[var(--dk-border)] p-5 space-y-5 sticky top-24">
                <div>
                  <h3 className="font-bold text-sm mb-3">دسته‌بندی‌ها</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setCatFilter("")}
                      className={`block w-full text-right px-3 py-2 rounded-lg text-sm transition ${!catFilter ? "text-white" : "text-[var(--dk-text)] hover:bg-[var(--dk-bg)]"}`}
                      style={
                        !catFilter ? { background: "var(--dk-primary)" } : {}
                      }
                    >
                      همه مطالب
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCatFilter(String(cat.id))}
                        className={`block w-full text-right px-3 py-2 rounded-lg text-sm transition ${catFilter === String(cat.id) ? "text-white" : "text-[var(--dk-text)] hover:bg-[var(--dk-bg)]"}`}
                        style={
                          catFilter === String(cat.id)
                            ? { background: "var(--dk-primary)" }
                            : {}
                        }
                      >
                        {cat.name}
                        <span className="mr-1 text-xs opacity-60">
                          ({cat._count.posts})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Posts */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden border border-[var(--dk-border)] animate-pulse"
                    >
                      <div className="aspect-[16/9] bg-gray-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <p className="text-[var(--dk-text-light)]">
                    هنوز مطلبی منتشر نشده است.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group bg-white rounded-xl border border-[var(--dk-border)] overflow-hidden hover:shadow-lg transition"
                    >
                      <div className="aspect-[16/9] bg-[var(--dk-bg)] overflow-hidden">
                        {post.featuredImage ? (
                          <img
                            src={mediaUrl(post.featuredImage)}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-12 h-12 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {post.categories.slice(0, 2).map((c) => (
                            <span
                              key={c.category.id}
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: "#F3F4F6",
                                color: "var(--dk-primary)",
                              }}
                            >
                              {c.category.name}
                            </span>
                          ))}
                        </div>
                        <h2 className="font-bold text-[var(--dk-text)] group-hover:text-[var(--dk-primary)] transition line-clamp-2 mb-2">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-sm text-[var(--dk-text-light)] line-clamp-2 mb-3">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-[var(--dk-text-light)]">
                          <span>{post.author.name}</span>
                          <span>
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString(
                                  "fa-IR",
                                )
                              : ""}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => fetchPosts(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg border border-[var(--dk-border)] text-sm hover:bg-[var(--dk-bg)] disabled:opacity-50"
                  >
                    قبلی
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => fetchPosts(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium border ${p === page ? "text-white border-transparent" : "border-[var(--dk-border)] hover:bg-[var(--dk-bg)]"}`}
                        style={
                          p === page ? { background: "var(--dk-primary)" } : {}
                        }
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => fetchPosts(page + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-lg border border-[var(--dk-border)] text-sm hover:bg-[var(--dk-bg)] disabled:opacity-50"
                  >
                    بعدی
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
