"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import PageBuilderRenderer from "@/components/page-builder/PageBuilderRenderer";

interface PageData {
  id: number;
  title: string;
  slug: string;
  content: string;
  contentJson?: string;
  metaTitle: string | null;
  metaDesc: string | null;
}

export default function PagePreview() {
  const { id } = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [globalColors, setGlobalColors] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/pages/preview/${id}`,
      ).then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      }),
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/settings/public`,
      )
        .then((res) => (res.ok ? res.json() : ({} as any)))
        .catch(() => ({}) as any),
    ])
      .then(([pageData, settings]) => {
        setPage(pageData);
        if (settings?.global_colors) {
          try {
            setGlobalColors(JSON.parse(settings.global_colors));
          } catch {
            setGlobalColors(null);
          }
        }
      })
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="dk-container py-20 text-center text-gray-400">
          در حال بارگذاری...
        </div>
      </>
    );
  }

  if (!page) {
    return (
      <>
        <Header />
        <div className="dk-container py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-2">
            صفحه مورد نظر یافت نشد
          </h1>
          <p className="text-gray-400">صفحه‌ای با این آدرس وجود ندارد.</p>
        </div>
      </>
    );
  }

  if (page.contentJson) {
    return (
      <>
        <Header />
        <PageBuilderRenderer
          contentJson={page.contentJson}
          globalColors={globalColors}
        />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="dk-container py-8">
        <h1 className="text-2xl font-bold mb-6">{page.title}</h1>
        <div
          className="prose prose-sm max-w-none leading-relaxed"
          style={{ color: "var(--dk-text)" }}
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </>
  );
}
