"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

export default function PanelSecurity() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (form.newPassword !== form.confirmPassword) {
      setMessage({
        type: "error",
        text: "رمز عبور جدید با تکرار آن مطابقت ندارد",
      });
      return;
    }
    if (form.newPassword.length < 6) {
      setMessage({ type: "error", text: "رمز عبور باید حداقل ۶ کاراکتر باشد" });
      return;
    }
    setSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage({ type: "success", text: "رمز عبور با موفقیت تغییر کرد" });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "خطا در تغییر رمز عبور",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "var(--dk-text)" }}>
        امنیت حساب
      </h1>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-[var(--dk-border)] p-5 space-y-4">
        <div
          className="flex items-center gap-2 pb-3 border-b"
          style={{ borderColor: "var(--dk-border)" }}
        >
          <Icon
            icon="tabler:lock"
            className="w-5 h-5"
            style={{ color: "var(--dk-primary)" }}
          />
          <h2 className="font-bold text-sm">تغییر رمز عبور</h2>
        </div>

        {message && (
          <div
            className={`rounded-lg px-4 py-2.5 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon
                icon={
                  message.type === "success"
                    ? "tabler:check-circle"
                    : "tabler:alert-circle"
                }
                className="w-4 h-4 shrink-0"
              />
              {message.text}
            </div>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              رمز عبور فعلی
            </label>
            <input
              type="password"
              required
              className="v-input w-full"
              value={form.currentPassword}
              onChange={(e) =>
                setForm({ ...form, currentPassword: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              رمز عبور جدید
            </label>
            <input
              type="password"
              required
              className="v-input w-full"
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              تکرار رمز عبور جدید
            </label>
            <input
              type="password"
              required
              className="v-input w-full"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg py-2.5 text-white text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--dk-primary)" }}
          >
            {saving ? "در حال ذخیره..." : "تغییر رمز عبور"}
          </button>
        </form>
      </div>

      {/* Security tips */}
      <div className="bg-white rounded-xl border border-[var(--dk-border)] p-5">
        <h3 className="font-bold text-sm mb-3">نکات امنیتی</h3>
        <ul
          className="space-y-2 text-sm"
          style={{ color: "var(--dk-text-light)" }}
        >
          <li className="flex items-start gap-2">
            <Icon
              icon="tabler:circle-check"
              className="w-4 h-4 mt-0.5 shrink-0 text-green-500"
            />
            از رمز عبور قوی با ترکیب حروف بزرگ، کوچک، اعداد و علائم استفاده کنید
          </li>
          <li className="flex items-start gap-2">
            <Icon
              icon="tabler:circle-check"
              className="w-4 h-4 mt-0.5 shrink-0 text-green-500"
            />
            رمز عبور خود را به صورت دوره‌ای تغییر دهید
          </li>
          <li className="flex items-start gap-2">
            <Icon
              icon="tabler:circle-check"
              className="w-4 h-4 mt-0.5 shrink-0 text-green-500"
            />
            از رمز عبور یکسان برای چند سرویس استفاده نکنید
          </li>
          <li className="flex items-start gap-2">
            <Icon
              icon="tabler:circle-check"
              className="w-4 h-4 mt-0.5 shrink-0 text-green-500"
            />
            هرگز رمز عبور خود را در اختیار دیگران قرار ندهید
          </li>
        </ul>
      </div>
    </div>
  );
}
