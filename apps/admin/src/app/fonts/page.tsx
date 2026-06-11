"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface FontRecord {
  id: number;
  name: string;
  source: string;
  url?: string;
  mediaId?: number;
  filepath?: string;
  weights: string;
  subsets?: string;
  isActive: boolean;
  isDefault: boolean;
  media?: { url: string; originalName: string } | null;
}

export default function FontsPage() {
  const [fonts, setFonts] = useState<FontRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    source: "link",
    url: "",
    weights: "400",
    subsets: "",
    isDefault: false,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const loadFonts = () => {
    setLoading(true);
    api
      .get<FontRecord[]>("/fonts")
      .then(setFonts)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFonts();
  }, []);

  const resetForm = () => {
    setForm({
      name: "",
      source: "link",
      url: "",
      weights: "400",
      subsets: "",
      isDefault: false,
    });
    setUploadFile(null);
    setShowForm(false);
    setMessage(null);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let payload: any = {
        name: form.name,
        source: form.source,
        weights: form.weights,
        subsets: form.subsets,
        isDefault: form.isDefault,
      };

      if (form.source === "link") {
        payload.url = form.url;
      } else if (form.source === "upload" && uploadFile) {
        const fd = new FormData();
        fd.append("file", uploadFile);
        fd.append("sourceType", "admin");
        const token = localStorage.getItem("web_token");
        const uploadRes = await fetch("http://localhost:8000/api/v1/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!uploadRes.ok) {
          setMessage({ type: "error", text: "خطا در آپلود فایل" });
          return;
        }
        const mediaData = await uploadRes.json();
        payload.mediaId = mediaData.id;
        payload.filepath = mediaData.url;
      }

      await api.post("/fonts", payload);
      setMessage({ type: "success", text: "فونت با موفقیت اضافه شد" });
      resetForm();
      loadFonts();
    } catch {
      setMessage({ type: "error", text: "خطا در ذخیره فونت" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (font: FontRecord) => {
    try {
      await api.put(`/fonts/${font.id}`, { isActive: !font.isActive });
      loadFonts();
    } catch {}
  };

  const setAsDefault = async (font: FontRecord) => {
    try {
      await api.put(`/fonts/${font.id}`, { isDefault: true });
      loadFonts();
    } catch {}
  };

  const remove = async (id: number) => {
    if (!confirm("حذف شود؟")) return;
    try {
      await api.delete(`/fonts/${id}`);
      loadFonts();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--v-text)" }}>
          مدیریت فونت‌ها
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="v-btn-primary text-sm"
        >
          <Icon icon="tabler:plus" className="w-4 h-4" />
          افزودن فونت
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 mb-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="v-card p-5 mb-6 space-y-4">
          <h3 className="font-bold text-sm">افزودن فونت جدید</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="v-label">نام فونت</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="v-input"
                placeholder="مثال: Vazir"
              />
            </div>
            <div>
              <label className="v-label">منبع</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="v-select"
              >
                <option value="link">لینک (CDN)</option>
                <option value="upload">آپلود فایل</option>
              </select>
            </div>
          </div>

          {form.source === "link" ? (
            <div>
              <label className="v-label">آدرس لینک فونت</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="v-input"
                placeholder="https://fonts.googleapis.com/..."
              />
            </div>
          ) : (
            <div>
              <label className="v-label">
                فایل فونت (woff2, woff, ttf, otf)
              </label>
              <input
                type="file"
                accept=".woff2,.woff,.ttf,.otf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="v-input"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="v-label">وزن‌ها (جداساز با ,)</label>
              <input
                type="text"
                value={form.weights}
                onChange={(e) => setForm({ ...form, weights: e.target.value })}
                className="v-input"
                placeholder="400,700"
              />
            </div>
            <div>
              <label className="v-label">زبان‌ها</label>
              <input
                type="text"
                value={form.subsets}
                onChange={(e) => setForm({ ...form, subsets: e.target.value })}
                className="v-input"
                placeholder="latin,arabic"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm({ ...form, isDefault: e.target.checked })
                  }
                  className="accent-[var(--v-primary)]"
                />
                <span className="text-sm">فونت پیش‌فرض</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={saving || !form.name}
              className="v-btn-primary text-sm disabled:opacity-50"
            >
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button onClick={resetForm} className="v-btn text-sm">
              انصراف
            </button>
          </div>

          {form.name && (
            <div className="border-t border-[var(--v-border)] pt-4">
              <p className="text-xs text-[var(--v-text-secondary)] mb-2">
                پیش‌نمایش:
              </p>
              <p className="text-lg" style={{ fontFamily: form.name }}>
                سلام دنیا! این یک نمونه متن فارسی است. The quick brown fox jumps
                over the lazy dog. ۱۲۳۴۵۶۷۸۹۰
              </p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{
              borderColor: "var(--v-primary)",
              borderTopColor: "transparent",
            }}
          />
        </div>
      ) : (
        <div className="v-card overflow-hidden">
          <table className="v-table">
            <thead>
              <tr>
                <th>نام فونت</th>
                <th>منبع</th>
                <th>وزن‌ها</th>
                <th>پیش‌نمایش</th>
                <th>وضعیت</th>
                <th>پیش‌فرض</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {fonts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center text-sm text-[var(--v-text-secondary)] py-12"
                  >
                    هیچ فونتی ثبت نشده است
                  </td>
                </tr>
              ) : (
                fonts.map((font) => (
                  <tr key={font.id}>
                    <td className="font-medium">{font.name}</td>
                    <td>
                      <span
                        className={`v-badge ${font.source === "link" ? "v-badge-info" : "v-badge-warning"}`}
                      >
                        {font.source === "link" ? "لینک" : "آپلودی"}
                      </span>
                    </td>
                    <td className="text-sm text-[var(--v-text-secondary)]">
                      {font.weights}
                    </td>
                    <td>
                      <span
                        className="text-base"
                        style={{ fontFamily: font.name }}
                      >
                        نمونه متن
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleActive(font)}
                        className={`v-badge cursor-pointer ${font.isActive ? "v-badge-success" : "v-badge-secondary"}`}
                      >
                        {font.isActive ? "فعال" : "غیرفعال"}
                      </button>
                    </td>
                    <td>
                      {font.isDefault ? (
                        <span className="v-badge v-badge-primary">پیش‌فرض</span>
                      ) : (
                        <button
                          onClick={() => setAsDefault(font)}
                          className="text-xs text-[var(--v-primary)] hover:underline"
                        >
                          تنظیم به عنوان پیش‌فرض
                        </button>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => remove(font.id)}
                        className="v-btn-icon text-red-500"
                        title="حذف"
                      >
                        <Icon icon="tabler:trash" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
