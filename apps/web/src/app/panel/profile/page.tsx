"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  birthDate: string;
  avatar?: string;
}

export default function PanelProfile() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    nationalId: "",
    birthDate: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("web_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    api
      .get<any>("/auth/me")
      .then((u) => {
        setUser(u);
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          nationalId: u.nationalId || "",
          birthDate: u.birthDate || "",
        });
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/auth/profile", form);
      setMessage({
        type: "success",
        text: "اطلاعات با موفقیت به‌روزرسانی شد.",
      });
    } catch {
      setMessage({ type: "error", text: "خطا در به‌روزرسانی اطلاعات." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{
            borderColor: "var(--dk-primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  const fields = [
    {
      key: "name",
      label: "نام و نام خانوادگی",
      icon: "tabler:user",
      type: "text",
    },
    { key: "email", label: "ایمیل", icon: "tabler:mail", type: "email" },
    { key: "phone", label: "شماره موبایل", icon: "tabler:phone", type: "tel" },
    { key: "nationalId", label: "کد ملی", icon: "tabler:card", type: "text" },
    {
      key: "birthDate",
      label: "تاریخ تولد",
      icon: "tabler:cake",
      type: "date",
    },
  ] as const;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1
        className="text-xl font-bold mb-1"
        style={{ color: "var(--dk-text)" }}
      >
        اطلاعات حساب
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--dk-text-light)" }}>
        اطلاعات شخصی خود را مدیریت کنید
      </p>

      {/* Avatar */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3 overflow-hidden"
            style={{
              background: "rgba(115,103,240,0.12)",
              color: "var(--dk-primary)",
            }}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              (user?.name || "ک")[0]
            )}
          </div>
          <label className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-white shadow border border-[var(--dk-border)] flex items-center justify-center cursor-pointer hover:bg-gray-50">
            <Icon
              icon={uploading ? "tabler:loader-2" : "tabler:camera"}
              className={`w-3.5 h-3.5 ${uploading ? "animate-spin" : ""}`}
              style={{ color: "var(--dk-text-light)" }}
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const fd = new FormData();
                  fd.append("file", file);
                  const token = localStorage.getItem("web_token");
                  const res = await fetch(
                    "http://localhost:8000/api/v1/upload?sourceType=admin",
                    {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: fd,
                    },
                  );
                  if (res.ok) {
                    const data = await res.json();
                    await api.put("/auth/profile", { avatar: data.url });
                    const u = await api.get<any>("/auth/me");
                    setUser(u);
                    setForm({
                      name: u.name,
                      email: u.email,
                      phone: u.phone || "",
                      nationalId: u.nationalId || "",
                      birthDate: u.birthDate || "",
                    });
                  }
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        </div>
        <p className="font-medium text-sm">{user?.name}</p>
        <p className="text-xs" style={{ color: "var(--dk-text-light)" }}>
          {user?.email}
        </p>
      </div>

      {message && (
        <div
          className="px-4 py-3 rounded-xl mb-4 text-sm font-medium flex items-center gap-2"
          style={{
            background:
              message.type === "success"
                ? "rgba(40,199,111,0.12)"
                : "rgba(255,76,81,0.12)",
            color: message.type === "success" ? "#28C76F" : "#FF4C51",
          }}
        >
          <Icon
            icon={
              message.type === "success"
                ? "tabler:check-circle"
                : "tabler:alert-circle"
            }
            className="w-5 h-5 shrink-0"
          />
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border bg-white p-5"
        style={{ borderColor: "var(--dk-border)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(({ key, label, icon, type }) => (
            <div key={key}>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--dk-text-light)" }}
              >
                {label}
              </label>
              <div className="relative">
                <Icon
                  icon={icon}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--dk-text-light)" }}
                />
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl text-sm border focus:outline-none transition"
                  style={{
                    borderColor: "var(--dk-border)",
                    color: "var(--dk-text)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm text-white font-medium transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--dk-primary)" }}
          >
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </form>
    </div>
  );
}
