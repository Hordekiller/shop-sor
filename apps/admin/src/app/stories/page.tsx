"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface Story {
  id: number;
  title: string;
  subtitle: string | null;
  image: string | null;
  videoUrl: string | null;
  link: string | null;
  bgColor: string;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm = {
  title: "",
  subtitle: "",
  image: "",
  videoUrl: "",
  link: "",
  bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  sortOrder: 0,
  isActive: true,
};

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Story | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchStories = () => {
    setLoading(true);
    api
      .get<Story[]>("/stories")
      .then(setStories)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (story: Story) => {
    setEditing(story);
    setForm({
      title: story.title,
      subtitle: story.subtitle || "",
      image: story.image || "",
      videoUrl: story.videoUrl || "",
      link: story.link || "",
      bgColor: story.bgColor,
      sortOrder: story.sortOrder,
      isActive: story.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) };
      if (editing) {
        await api.put(`/stories/${editing.id}`, payload);
      } else {
        await api.post("/stories", payload);
      }
      setShowModal(false);
      fetchStories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggle = async (story: Story) => {
    try {
      await api.put(`/stories/${story.id}`, { isActive: !story.isActive });
      fetchStories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این استوری اطمینان دارید؟")) return;
    try {
      await api.delete(`/stories/${id}`);
      fetchStories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            مدیریت استوری‌ها
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            استوری‌های اینستاگرامی فروشگاه
          </p>
        </div>
        <button onClick={openNew} className="v-btn v-btn-primary">
          <Icon icon="tabler:plus" className="w-4 h-4" /> افزودن استوری
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-[var(--v-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:photo-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هنوز هیچ استوری‌ای ساخته نشده است.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <div key={story.id} className="v-card overflow-hidden">
              <div
                className="h-40 flex items-center justify-center relative"
                style={{ background: story.bgColor }}
              >
                {story.image ? (
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : story.videoUrl ? (
                  <Icon
                    icon="tabler:player-play"
                    className="w-10 h-10"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  />
                ) : (
                  <Icon
                    icon="tabler:photo"
                    className="w-10 h-10"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  />
                )}
                {!story.isActive && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-sm font-bold bg-black/60 px-3 py-1 rounded-lg">
                      غیرفعال
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-bold text-sm truncate"
                      style={{ color: "var(--v-text)" }}
                    >
                      {story.title}
                    </h3>
                    {story.subtitle && (
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "var(--v-text-secondary)" }}
                      >
                        {story.subtitle}
                      </p>
                    )}
                  </div>
                  <span
                    className={`v-badge mr-2 shrink-0 ${story.isActive ? "v-badge-success" : "v-badge-secondary"}`}
                  >
                    {story.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </div>
                <p
                  className="text-xs mb-3"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  ترتیب: {story.sortOrder}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(story)}
                    className="v-btn v-btn-secondary v-btn-sm flex-1"
                  >
                    <Icon icon="tabler:edit" className="w-3.5 h-3.5" /> ویرایش
                  </button>
                  <button
                    onClick={() => handleToggle(story)}
                    className="v-btn v-btn-sm"
                    style={{
                      color: story.isActive
                        ? "var(--v-warning)"
                        : "var(--v-primary)",
                    }}
                  >
                    <Icon
                      icon={story.isActive ? "tabler:eye-off" : "tabler:eye"}
                      className="w-3.5 h-3.5"
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(story.id)}
                    className="v-btn v-btn-sm"
                    style={{ color: "var(--v-error)" }}
                  >
                    <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto"
              style={{
                background: "var(--v-card)",
                border: "1px solid var(--v-border)",
              }}
            >
              <h3
                className="text-lg font-bold mb-4"
                style={{ color: "var(--v-text)" }}
              >
                {editing ? "ویرایش استوری" : "افزودن استوری"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    عنوان
                  </label>
                  <input
                    className="v-input"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="عنوان استوری"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    زیرعنوان
                  </label>
                  <input
                    className="v-input"
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm({ ...form, subtitle: e.target.value })
                    }
                    placeholder="زیرعنوان (اختیاری)"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    تصویر{" "}
                    <span
                      className="text-xs"
                      style={{ color: "var(--v-text-secondary)" }}
                    >
                      (سایز پیشنهادی: 1080×1920)
                    </span>
                  </label>
                  <input
                    className="v-input"
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    placeholder="آدرس تصویر"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    آدرس ویدیو (اختیاری)
                  </label>
                  <input
                    className="v-input"
                    value={form.videoUrl}
                    onChange={(e) =>
                      setForm({ ...form, videoUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    لینک (اختیاری)
                  </label>
                  <input
                    className="v-input"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    رنگ پس‌زمینه
                  </label>
                  <input
                    className="v-input"
                    value={form.bgColor}
                    onChange={(e) =>
                      setForm({ ...form, bgColor: e.target.value })
                    }
                    placeholder="linear-gradient(...)"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    ترتیب
                  </label>
                  <input
                    className="v-input"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "var(--v-primary)" }}
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium"
                    style={{ color: "var(--v-text)" }}
                  >
                    فعال
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    className="v-btn v-btn-primary flex-1"
                  >
                    {editing ? "ذخیره تغییرات" : "ایجاد"}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="v-btn v-btn-secondary flex-1"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
