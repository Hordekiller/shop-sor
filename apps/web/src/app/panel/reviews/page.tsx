"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";

interface Review {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  pros: string | null;
  cons: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { id: number; title: string; slug: string; images: string[] };
  media: { id: number; url: string; type: string }[];
}

export default function PanelReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [myReviews, setMyReviews] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.get<Review[]>("/reviews/my");
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const stars = (n: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          icon={i < n ? "tabler:star-filled" : "tabler:star"}
          className="w-3.5 h-3.5"
          style={{ color: i < n ? "#FF9F43" : "var(--dk-text-disabled)" }}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: "var(--dk-text)" }}>
        دیدگاه‌های من
      </h1>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl animate-pulse"
            style={{ background: "#e5e7eb" }}
          />
        ))
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <Icon
            icon="tabler:message-off"
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "var(--dk-text-disabled)" }}
          />
          <h2
            className="font-bold text-lg mb-2"
            style={{ color: "var(--dk-text)" }}
          >
            هنوز دیدگاهی ثبت نکرده‌اید
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--dk-text-light)" }}>
            پس از خرید می‌توانید نظر خود را درباره محصول بنویسید
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium"
            style={{ background: "var(--dk-primary)" }}
          >
            سفارشات من
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-[var(--dk-border)] p-4"
            >
              <div className="flex items-start gap-4">
                <Link
                  href={`/products/${r.product.slug}`}
                  className="w-16 h-16 rounded-lg bg-[var(--dk-bg)] flex items-center justify-center shrink-0 overflow-hidden"
                >
                  {r.product.images?.[0] ? (
                    <img
                      src={mediaUrl(r.product.images[0])}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon
                      icon="tabler:box"
                      className="w-6 h-6"
                      style={{ color: "var(--dk-text-disabled)" }}
                    />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${r.product.slug}`}
                    className="text-sm font-medium hover:text-[var(--dk-primary)] line-clamp-1"
                  >
                    {r.product.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {stars(r.rating)}
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: r.isApproved ? "#DCFCE7" : "#FEF3C7",
                        color: r.isApproved ? "#166534" : "#92400E",
                      }}
                    >
                      {r.isApproved ? "تأیید شده" : "در انتظار تأیید"}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--dk-text-light)" }}
                    >
                      {new Date(r.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  {r.title && (
                    <p className="text-sm font-medium mt-2">{r.title}</p>
                  )}
                  {r.comment && (
                    <p
                      className="text-sm mt-1 leading-relaxed"
                      style={{ color: "var(--dk-text-light)" }}
                    >
                      {r.comment}
                    </p>
                  )}

                  {/* Media */}
                  {r.media?.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {r.media.map((m) => (
                        <a
                          key={m.id}
                          href={mediaUrl(m.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-lg bg-[var(--dk-bg)] flex items-center justify-center overflow-hidden border border-[var(--dk-border)]"
                        >
                          {m.type === "image" ? (
                            <img
                              src={mediaUrl(m.url)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon
                              icon="tabler:video"
                              className="w-5 h-5"
                              style={{ color: "var(--dk-text-disabled)" }}
                            />
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
