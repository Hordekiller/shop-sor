"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface Popup {
  id: number;
  title: string;
  description: string;
  image: string;
  link: string;
  btnText: string;
  type: "center" | "bottom_sheet" | "top_banner";
  displayMode: "once" | "each_visit" | "daily";
  delay: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

const defaultForm = {
  title: "",
  description: "",
  image: "",
  link: "",
  btnText: "مشاهده",
  type: "center" as const,
  displayMode: "once" as const,
  delay: 3000,
  startAt: "",
  endAt: "",
  isActive: true,
};

const typeLabels: Record<string, string> = {
  center: "مرکز صفحه",
  bottom_sheet: "پایین ثابت",
  top_banner: "بنر بالا",
};

const typeColors: Record<string, string> = {
  center: "var(--v-primary)",
  bottom_sheet: "var(--v-success)",
  top_banner: "var(--v-warning)",
};

const displayLabels: Record<string, string> = {
  once: "یک بار",
  each_visit: "هر بازدید",
  daily: "روزانه",
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const fetchPopups = () => {
    setLoading(true);
    api
      .get<Popup[]>("/popups")
      .then(setPopups)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const update = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      await api.post("/popups", form);
      setShowForm(false);
      setForm(defaultForm);
      fetchPopups();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggle = async (item: Popup) => {
    try {
      await api.put(`/popups/${item.id}`, { isActive: !item.isActive });
      fetchPopups();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این پاپ‌آپ اطمینان دارید؟")) return;
    try {
      await api.delete(`/popups/${id}`);
      fetchPopups();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--v-text)" }}>
            مدیریت پاپ‌آپ‌ها
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--v-text-secondary)" }}
          >
            پنجره‌های تبلیغاتی فروشگاه
          </p>
        </div>
        <button
          onClick={() => {
            setForm(defaultForm);
            setShowForm(true);
          }}
          className="v-btn v-btn-primary"
        >
          <Icon icon="tabler:plus" className="w-4 h-4" /> افزودن پاپ‌آپ
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-[var(--v-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : popups.length === 0 ? (
        <div className="v-card p-12 text-center">
          <Icon
            icon="tabler:popup"
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--v-text-disabled)" }}
          />
          <p style={{ color: "var(--v-text-secondary)" }}>
            هنوز هیچ پاپ‌آپی ساخته نشده است.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popups.map((item) => (
            <div key={item.id} className="v-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-base truncate"
                    style={{ color: "var(--v-text)" }}
                  >
                    {item.title}
                  </h3>
                  <span
                    className="inline-block v-badge mt-1.5"
                    style={{ background: typeColors[item.type], color: "#fff" }}
                  >
                    {typeLabels[item.type]}
                  </span>
                </div>
                <span
                  className={`v-badge shrink-0 ${item.isActive ? "v-badge-success" : "v-badge-secondary"}`}
                >
                  {item.isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <p
                className="text-sm"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {formatDate(item.startAt)} — {formatDate(item.endAt)}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--v-text-secondary)" }}
              >
                {displayLabels[item.displayMode]} | تأخیر: {item.delay}ms
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleToggle(item)}
                  className="v-btn v-btn-sm"
                  style={{
                    color: item.isActive
                      ? "var(--v-warning)"
                      : "var(--v-primary)",
                  }}
                >
                  <Icon
                    icon={item.isActive ? "tabler:eye-off" : "tabler:eye"}
                    className="w-3.5 h-3.5"
                  />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="v-btn v-btn-sm"
                  style={{ color: "var(--v-error)" }}
                >
                  <Icon icon="tabler:trash" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowForm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
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
                افزودن پاپ‌آپ جدید
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
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="مثلاً: تخفیف ویژه نوروز"
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
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="متن داخل پاپ‌آپ"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    تصویر
                  </label>
                  <input
                    className="v-input"
                    value={form.image}
                    onChange={(e) => update("image", e.target.value)}
                    placeholder="https://example.com/poster.jpg"
                  />
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--v-text-secondary)" }}
                  >
                    سایز پیشنهادی: 600×800
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
                    onChange={(e) => update("link", e.target.value)}
                    placeholder="https://example.com/landing"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    متن دکمه
                  </label>
                  <input
                    className="v-input"
                    value={form.btnText}
                    onChange={(e) => update("btnText", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--v-text)" }}
                    >
                      نوع نمایش
                    </label>
                    <select
                      className="v-select"
                      value={form.type}
                      onChange={(e) => update("type", e.target.value)}
                    >
                      {Object.entries(typeLabels).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--v-text)" }}
                    >
                      دفعات نمایش
                    </label>
                    <select
                      className="v-select"
                      value={form.displayMode}
                      onChange={(e) => update("displayMode", e.target.value)}
                    >
                      {Object.entries(displayLabels).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--v-text)" }}
                  >
                    تأخیر نمایش (ms)
                  </label>
                  <input
                    className="v-input"
                    type="number"
                    value={form.delay}
                    onChange={(e) => update("delay", Number(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--v-text)" }}
                    >
                      شروع
                    </label>
                    <input
                      className="v-input"
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(e) => update("startAt", e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--v-text)" }}
                    >
                      پایان
                    </label>
                    <input
                      className="v-input"
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(e) => update("endAt", e.target.value)}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={form.isActive}
                    onChange={(e) => update("isActive", e.target.checked)}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--v-text)" }}
                  >
                    فعال
                  </span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCreate}
                    className="v-btn v-btn-primary flex-1"
                  >
                    ایجاد
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
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
