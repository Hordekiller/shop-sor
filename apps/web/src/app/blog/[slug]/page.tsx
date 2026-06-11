"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  viewCount: number;
  metaTitle: string | null;
  metaDesc: string | null;
  author: { id: number; name: string; avatar: string | null };
  categories: { category: { id: number; name: string; slug: string } }[];
  tags: { tag: { id: number; name: string } }[];
  _count: { comments: number };
}

interface Comment {
  id: number;
  content: string;
  name: string | null;
  createdAt: string;
  user: { id: number; name: string; avatar: string | null } | null;
  replies: Comment[];
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({
    name: "",
    email: "",
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get<Post>(`/blog/posts/${slug}`)
      .then((p) => {
        setPost(p);
        document.title = p.metaTitle || `${p.title} | وبلاگ اطلس شاپ`;
        const meta = document.querySelector('meta[name="description"]');
        if (p.metaDesc && meta) meta.setAttribute("content", p.metaDesc);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    api
      .get<{ data: Comment[] }>(`/blog/posts/${slug}/comments`)
      .then((res) => setComments(res.data))
      .catch(() => {});
  }, [slug]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentForm.content.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/blog/comments", {
        postId: post!.id,
        content: commentForm.content,
        name: commentForm.name || undefined,
        email: commentForm.email || undefined,
      });
      setSubmitted(true);
      setCommentForm({ name: "", email: "", content: "" });
    } catch {
      alert("خطا در ثبت نظر");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen">
          <div className="dk-container py-12">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="aspect-[16/9] bg-gray-200 rounded-xl animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-200 rounded animate-pulse"
                    style={{ width: `${70 + Math.random() * 30}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const jsonLdBlog = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.excerpt || post.metaDesc || "",
        image: post.featuredImage ? mediaUrl(post.featuredImage) : undefined,
        datePublished: post.publishedAt || new Date().toISOString(),
        author: { "@type": "Person", name: post.author.name },
        publisher: { "@type": "Organization", name: "اطلس شاپ" },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": typeof window !== "undefined" ? window.location.href : "",
        },
      }
    : null;

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--dk-text-light)]">
              مطلب مورد نظر یافت نشد.
            </p>
            <Link
              href="/blog"
              className="text-[var(--dk-primary)] mt-2 inline-block"
            >
              بازگشت به وبلاگ
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      {jsonLdBlog && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBlog) }}
        />
      )}
      <main className="min-h-screen">
        <article className="dk-container py-8">
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-[var(--dk-text-light)] mb-6">
              <Link href="/" className="hover:text-[var(--dk-primary)]">
                خانه
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-[var(--dk-primary)]">
                وبلاگ
              </Link>
              {post.categories.length > 0 && (
                <>
                  <span>/</span>
                  <Link
                    href={`/blog?categoryId=${post.categories[0].category.id}`}
                    className="hover:text-[var(--dk-primary)]"
                  >
                    {post.categories[0].category.name}
                  </Link>
                </>
              )}
            </nav>

            {/* Header */}
            <h1 className="text-3xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-[var(--dk-text-light)] mb-6">
              <span>نویسنده: {post.author.name}</span>
              <span>|</span>
              <span>
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("fa-IR")
                  : ""}
              </span>
              <span>|</span>
              <span>{post.viewCount.toLocaleString()} بازدید</span>
            </div>

            {/* Categories & Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.categories.map((c) => (
                <Link
                  key={c.category.id}
                  href={`/blog?categoryId=${c.category.id}`}
                  className="text-xs px-3 py-1 rounded-full font-medium bg-[var(--dk-bg)] text-[var(--dk-primary)] hover:bg-[var(--dk-primary)] hover:text-white transition"
                >
                  {c.category.name}
                </Link>
              ))}
              {post.tags.map((t) => (
                <span
                  key={t.tag.id}
                  className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600"
                >
                  #{t.tag.name}
                </span>
              ))}
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="aspect-[16/9] rounded-xl overflow-hidden mb-8 bg-[var(--dk-bg)]">
                <img
                  src={mediaUrl(post.featuredImage)}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            {post.excerpt && (
              <div
                className="text-lg text-[var(--dk-text-light)] mb-6 leading-relaxed border-r-4 pr-4"
                style={{ borderColor: "var(--dk-primary)" }}
              >
                {post.excerpt}
              </div>
            )}

            <div
              className="prose prose-lg max-w-none leading-8"
              dangerouslySetInnerHTML={{ __html: post.content || "" }}
            />

            {/* Comments Section */}
            <div className="mt-12 pt-8 border-t border-[var(--dk-border)]">
              <h2 className="text-xl font-bold mb-6">
                نظرات ({post._count.comments})
              </h2>

              {comments.length === 0 ? (
                <p className="text-[var(--dk-text-light)] mb-6">
                  هنوز نظری ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-4 mb-8">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-[var(--dk-bg)] rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                          {comment.user?.name?.charAt(0) ||
                            comment.name?.charAt(0) ||
                            "?"}
                        </div>
                        <span className="text-sm font-medium">
                          {comment.user?.name || comment.name || "ناشناس"}
                        </span>
                        <span className="text-xs text-[var(--dk-text-light)]">
                          {new Date(comment.createdAt).toLocaleDateString(
                            "fa-IR",
                          )}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment Form */}
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                  نظر شما با موفقیت ثبت شد و پس از تأیید نمایش داده خواهد شد.
                </div>
              ) : (
                <form onSubmit={handleComment} className="space-y-4">
                  <h3 className="font-bold text-sm">دیدگاه خود را بنویسید</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="نام"
                        className="w-full border border-[var(--dk-border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--dk-primary)]"
                        value={commentForm.name}
                        onChange={(e) =>
                          setCommentForm({
                            ...commentForm,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="ایمیل (اختیاری)"
                        className="w-full border border-[var(--dk-border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--dk-primary)]"
                        value={commentForm.email}
                        onChange={(e) =>
                          setCommentForm({
                            ...commentForm,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="متن دیدگاه..."
                    required
                    className="w-full border border-[var(--dk-border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--dk-primary)]"
                    value={commentForm.content}
                    onChange={(e) =>
                      setCommentForm({
                        ...commentForm,
                        content: e.target.value,
                      })
                    }
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                    style={{ background: "var(--dk-primary)" }}
                  >
                    {submitting ? "در حال ارسال..." : "ارسال دیدگاه"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
