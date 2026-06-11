"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface SiteSlide {
  id: number;
  title: string;
  description: string | null;
  bgColor: string;
  image: string | null;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
}

const defaultForm = {
  title: "",
  description: "",
  bgColor: "from-[#ef4056] to-[#d8364a]",
  image: "",
  link: "",
  sortOrder: "0",
  isActive: true,
};

export default function SlidesPage() {
  const [slides, setSlides] = useState<SiteSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const fetchSlides = () => {
    setLoading(true);
    api
      .get<SiteSlide[]>("/slides")
      .then(setSlides)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowModal(false);
  };

  const openNew = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (slide: SiteSlide) => {
    setForm({
      title: slide.title,
      description: slide.description || "",
      bgColor: slide.bgColor,
      image: slide.image || "",
      link: slide.link || "",
      sortOrder: String(slide.sortOrder),
      isActive: slide.isActive,
    });
    setEditingId(slide.id);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        bgColor: form.bgColor,
        image: form.image || undefined,
        link: form.link || undefined,
        sortOrder: parseInt(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editingId) {
        await api.put(`/slides/${editingId}`, payload);
      } else {
        await api.post("/slides", payload);
      }
      resetForm();
      fetchSlides();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/slides/${id}`, { isActive: !isActive });
      fetchSlides();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این بنر اطمینان دارید؟")) return;
    try {
      await api.delete(`/slides/${id}`);
      fetchSlides();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            مدیریت بنرها
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            اسلایدهای صفحه اصلی
          </p>
        </div>
        <button onClick={openNew} className="v-btn v-btn-primary">
          <Icon icon="tabler:plus" className="w-4 h-4" /> افزودن بنر
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-[var(--v-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : slides.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:photo-off"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هنوز هیچ بنری ساخته نشده است.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide) => (
            <div key={slide.id} className="v-card overflow-hidden">
              <div
                className="h-32 bg-gradient-to-r flex items-end p-3"
                style={{
                  backgroundImage: `linear-gradient(to left, ${slide.bgColor})`,
                }}
              >
                {slide.image && (
                  <div className="rounded-lg overflow-hidden border-2 border-white/30 shadow-md">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="h-16 w-28 object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className="font-bold text-sm"
                    style={{ color: "var(--v-text)" }}
                  >
                    {slide.title}
                  </h3>
                  <span
                    className={`v-badge ${slide.isActive ? "v-badge-success" : "v-badge-secondary"}`}
                  >
                    {slide.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </div>
                {slide.description && (
                  <p
                    className="text-xs mb-2 line-clamp-2"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    {slide.description}
                  </p>
                )}
                <div
                  className="flex items-center gap-2 text-xs mb-3"
                  style={{ color: "var(--v-text-secondary)" }}
                >
                  {slide.link && (
                    <span className="flex items-center gap-1">
                      <Icon icon="tabler:link" className="w-3 h-3" />
                      {slide.link.length > 30
                        ? slide.link.slice(0, 30) + "..."
                        : slide.link}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Icon icon="tabler:list-numbers" className="w-3 h-3" />
                    ترتیب: {slide.sortOrder}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(slide)}
                    className="v-btn v-btn-secondary v-btn-sm flex-1"
                  >
                    <Icon icon="tabler:edit" className="w-3.5 h-3.5" /> ویرایش
                  </button>
                  <button
                    onClick={() => handleToggle(slide.id, slide.isActive)}
                    className="v-btn v-btn-sm"
                    style={{
                      color: slide.isActive
                        ? "var(--v-warning)"
                        : "var(--v-primary)",
                    }}
                  >
                    <Icon
                      icon={slide.isActive ? "tabler:eye-off" : "tabler:eye"}
                      className="w-3.5 h-3.5"
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
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
          <div className="fixed inset-0 z-40 bg-black/30" onClick={resetForm} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-lg rounded-xl p-6"
              style={{
                background: "var(--v-card)",
                border: "1px solid var(--v-border)",
              }}
            >
              <h3
                className="text-lg font-bold mb-4"
                style={{ color: "var(--v-text)" }}
              >
                {editingId ? "ویرایش بنر" : "افزودن بنر جدید"}
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
                    placeholder="عنوان بنر"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    توضیحات
                  </label>
                  <input
                    className="v-input"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="توضیحات (اختیاری)"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    رنگ پس‌زمینه (گرادینت Tailwind)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      className="v-input flex-1"
                      value={form.bgColor}
                      onChange={(e) =>
                        setForm({ ...form, bgColor: e.target.value })
                      }
                      placeholder="مثال: from-[#ef4056] to-[#d8364a]"
                    />
                    <div
                      className="w-10 h-10 rounded-lg shrink-0 border"
                      style={{
                        background: `linear-gradient(to left, ${form.bgColor})`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    تصویر (آدرس URL)
                  </label>
                  <input
                    className="v-input"
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    placeholder="https://..."
                  />
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    سایز پیشنهادی: ۱۹۲۰×۶۰۰
                  </p>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    لینک
                  </label>
                  <input
                    className="v-input"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="https:// یا /products/..."
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--v-text)" }}
                    >
                      ترتیب
                    </label>
                    <input
                      type="number"
                      className="v-input"
                      value={form.sortOrder}
                      onChange={(e) =>
                        setForm({ ...form, sortOrder: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded"
                        checked={form.isActive}
                        onChange={(e) =>
                          setForm({ ...form, isActive: e.target.checked })
                        }
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--v-text)" }}
                      >
                        فعال
                      </span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSubmit}
                    className="v-btn v-btn-primary flex-1"
                  >
                    {editingId ? "ویرایش" : "ایجاد"}
                  </button>
                  <button
                    onClick={resetForm}
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
