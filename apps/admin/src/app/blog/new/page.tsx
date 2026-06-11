"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";
import TiptapEditor from "@/components/TiptapEditor";

interface BlogCategory {
  id: number;
  name: string;
  parentId: number | null;
  children: BlogCategory[];
}
interface BlogTag {
  id: number;
  name: string;
}

export default function NewBlogPost() {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState("draft");
  const [publishedAt, setPublishedAt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<BlogCategory[]>("/blog/categories"),
      api.get<BlogTag[]>("/blog/tags"),
    ])
      .then(([cats, ts]) => {
        setCategories(cats);
        setTags(ts);
      })
      .catch(console.error);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("atlas_token");
      const res = await fetch(
        `http://localhost:8000/api/v1/upload?sourceType=blog`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        },
      );
      if (res.ok) {
        const data = await res.json();
        setFeaturedImage(data.url);
      }
    } finally {
      setUploading(false);
    }
  };

  const toggleCat = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleTag = (id: number) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/blog/admin/posts", {
        title,
        slug: slug || undefined,
        content,
        excerpt,
        featuredImage: featuredImage || undefined,
        status,
        publishedAt: publishedAt || undefined,
        metaTitle,
        metaDesc,
        categoryIds: selectedCategories,
        tagIds: selectedTags,
      });
      router.push("/blog");
    } catch (err: any) {
      alert(err?.message || "خطا در ذخیره پست");
    } finally {
      setSaving(false);
    }
  };

  const renderCatTree = (items: BlogCategory[], depth = 0) => (
    <div style={{ marginRight: depth * 16 }}>
      {items.map((cat) => (
        <div key={cat.id} className="mb-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer py-1 hover:bg-gray-50 rounded px-2">
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat.id)}
              onChange={() => toggleCat(cat.id)}
            />
            {cat.name}
          </label>
          {cat.children &&
            cat.children.length > 0 &&
            renderCatTree(cat.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded hover:bg-gray-100"
        >
          <Icon icon="tabler:arrow-right" className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
          پست جدید
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="v-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">عنوان *</label>
              <input
                type="text"
                required
                className="v-input"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slug)
                    setSlug(
                      e.target.value
                        .replace(/\s+/g, "-")
                        .replace(/[^a-zA-Z0-9\-]/g, "")
                        .toLowerCase(),
                    );
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                اسلاگ (URL)
              </label>
              <input
                type="text"
                className="v-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  تصویر شاخص
                </label>
                <input
                  type="text"
                  className="v-input"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="/uploads/..."
                />
              </div>
              <label className="v-btn v-btn-sm v-btn-secondary cursor-pointer">
                <Icon
                  icon={uploading ? "tabler:loader-2" : "tabler:upload"}
                  className={`w-3.5 h-3.5 ${uploading ? "animate-spin" : ""}`}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="v-card p-5">
          <label className="block text-sm font-medium mb-1">
            خلاصه / چکیده
          </label>
          <textarea
            className="v-input"
            rows={3}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="خلاصه پست..."
          />
        </div>

        <div className="v-card p-5">
          <label className="block text-sm font-medium mb-1">محتوای کامل</label>
          <TiptapEditor
            value={content}
            onChange={setContent}
            placeholder="محتوای پست را بنویسید..."
            minHeight={400}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="v-card p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Icon
                icon="tabler:folder"
                className="w-4 h-4"
                style={{ color: "var(--v-primary)" }}
              />
              دسته‌بندی‌ها
            </h3>
            <div className="max-h-48 overflow-y-auto">
              {renderCatTree(categories)}
            </div>
          </div>

          <div className="v-card p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Icon
                icon="tabler:tags"
                className="w-4 h-4"
                style={{ color: "var(--v-primary)" }}
              />
              برچسب‌ها
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${selectedTags.includes(tag.id) ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}
                  style={
                    selectedTags.includes(tag.id)
                      ? { background: "var(--v-primary)" }
                      : {}
                  }
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && (
                <p
                  className="text-xs"
                  style={{ color: "var(--v-text-disabled)" }}
                >
                  هنوز برچسبی ایجاد نشده است.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="v-card p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Icon
              icon="tabler:settings"
              className="w-4 h-4"
              style={{ color: "var(--v-primary)" }}
            />
            وضعیت و زمان‌بندی
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">وضعیت</label>
              <select
                className="v-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">پیش‌نویس</option>
                <option value="published">منتشر شده</option>
                <option value="scheduled">زمان‌بندی شده</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                تاریخ انتشار
              </label>
              <input
                type="datetime-local"
                className="v-input"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="v-card p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Icon
              icon="tabler:seo"
              className="w-4 h-4"
              style={{ color: "var(--v-primary)" }}
            />
            سئو
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Meta Title
              </label>
              <input
                type="text"
                className="v-input"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Meta Description
              </label>
              <textarea
                className="v-input"
                rows={2}
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="v-btn v-btn-secondary"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={saving}
            className="v-btn v-btn-primary"
          >
            <Icon
              icon={saving ? "tabler:loader-2" : "tabler:device-floppy"}
              className={`w-4 h-4 ${saving ? "animate-spin" : ""}`}
            />
            {saving ? "در حال ذخیره..." : "ذخیره پست"}
          </button>
        </div>
      </form>
    </div>
  );
}
