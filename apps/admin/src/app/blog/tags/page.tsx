"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface BlogTag {
  id: number;
  name: string;
  slug: string;
  _count: { posts: number };
}

export default function BlogTagsPage() {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const fetchTags = async () => {
    setLoading(true);
    try {
      const data = await api.get<BlogTag[]>("/blog/tags");
      setTags(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post("/blog/admin/tags", {
        name: newName,
        slug: newSlug || undefined,
      });
      setNewName("");
      setNewSlug("");
      fetchTags();
    } catch (err: any) {
      alert(err?.message || "خطا");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این برچسب اطمینان دارید؟")) return;
    try {
      await api.delete(`/blog/admin/tags/${id}`);
      fetchTags();
    } catch {
      alert("خطا در حذف");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
          برچسب‌های وبلاگ
        </h1>
      </div>

      <div className="v-card p-5 mb-6">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">نام برچسب</label>
            <input
              type="text"
              className="v-input"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(
                  e.target.value
                    .replace(/\s+/g, "-")
                    .replace(/[^a-zA-Z0-9\-]/g, "")
                    .toLowerCase(),
                );
              }}
              placeholder="نام برچسب جدید..."
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">اسلاگ</label>
            <input
              type="text"
              className="v-input"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              dir="ltr"
            />
          </div>
          <button
            onClick={handleCreate}
            className="v-btn v-btn-primary shrink-0"
          >
            <Icon icon="tabler:plus" className="w-4 h-4" />
            افزودن
          </button>
        </div>
      </div>

      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl animate-pulse mb-2"
            style={{ background: "#e5e7eb" }}
          />
        ))
      ) : tags.length === 0 ? (
        <div className="text-center py-16">
          <Icon
            icon="tabler:tags-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هیچ برچسبی وجود ندارد.
          </p>
        </div>
      ) : (
        <div className="v-card overflow-hidden">
          <table className="v-table">
            <thead>
              <tr>
                <th>نام</th>
                <th>اسلاگ</th>
                <th>تعداد پست</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="font-medium text-sm">{tag.name}</td>
                  <td
                    className="text-xs"
                    dir="ltr"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {tag.slug}
                  </td>
                  <td
                    className="text-xs"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {tag._count.posts}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="p-1 rounded hover:bg-red-50"
                    >
                      <Icon
                        icon="tabler:trash"
                        className="w-3.5 h-3.5"
                        style={{ color: "#ef4444" }}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
