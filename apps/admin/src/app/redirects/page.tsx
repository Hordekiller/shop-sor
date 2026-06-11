"use client";

import { useEffect, useState, FormEvent } from "react";
import { api } from "@/lib/api";

interface Redirect {
  id: number;
  source: string;
  target: string;
  type: number;
  isActive: boolean;
  createdAt: string;
}

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [type, setType] = useState(301);
  const [submitting, setSubmitting] = useState(false);

  const fetchRedirects = async () => {
    try {
      const data = await api.get<Redirect[]>("/redirects");
      setRedirects(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  const openCreate = () => {
    setSource("");
    setTarget("");
    setType(301);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (r: Redirect) => {
    setSource(r.source);
    setTarget(r.target);
    setType(r.type);
    setEditingId(r.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { source, target, type };
      if (editingId) {
        await api.put(`/redirects/${editingId}`, payload);
      } else {
        await api.post("/redirects", payload);
      }
      cancelForm();
      fetchRedirects();
    } catch (err: any) {
      alert(err.message || "Error saving redirect");
    }
    setSubmitting(false);
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await api.put(`/redirects/${id}`, { isActive: !isActive });
      fetchRedirects();
    } catch {
      alert("Error toggling redirect");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف شود؟")) return;
    try {
      await api.delete(`/redirects/${id}`);
      fetchRedirects();
    } catch {
      alert("Error deleting redirect");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">مدیریت تغییر مسیر (Redirect)</h2>
        <button
          onClick={showForm ? cancelForm : openCreate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          {showForm ? "انصراف" : "تغییر مسیر جدید"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl bg-white p-5 shadow-sm border space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                آدرس مبدأ (Source)
              </label>
              <input
                type="text"
                required
                dir="ltr"
                placeholder="/old-page"
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                آدرس مقصد (Target)
              </label>
              <input
                type="text"
                required
                dir="ltr"
                placeholder="/new-page"
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">نوع</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(Number(e.target.value))}
              >
                <option value={301}>۳۰۱ (دائمی)</option>
                <option value={302}>۳۰۲ (موقت)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting
                ? "در حال ذخیره..."
                : editingId
                  ? "بروزرسانی"
                  : "ایجاد"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg border px-6 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">در حال بارگذاری...</p>
      ) : redirects.length === 0 ? (
        <p className="text-gray-500">هیچ تغییر مسیری تعریف نشده است.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-right">
              <tr>
                <th className="px-4 py-3 font-medium">مبدأ</th>
                <th className="px-4 py-3 font-medium">مقصد</th>
                <th className="px-4 py-3 font-medium">نوع</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {redirects.map((r) => (
                <tr
                  key={r.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-mono text-xs dir-ltr">
                    {r.source}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs dir-ltr">
                    {r.target}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.type === 301 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(r.id, r.isActive)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {r.isActive ? "فعال" : "غیرفعال"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        حذف
                      </button>
                    </div>
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
