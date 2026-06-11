"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { provinces } from "@/lib/iran-provinces";

export default function RegisterPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    addressTitle: "خانه",
    receiverName: "",
    province: "",
    city: "",
    postalCode: "",
    addressText: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Record<string, string>>("/settings/public")
      .then(setSettings)
      .catch(() => {});
  }, []);

  const phoneRequired = settings.register_phone_required === "true";
  const addressRequired = settings.register_address_required === "true";
  const postalcodeRequired = settings.register_postalcode_required === "true";
  const showAddress =
    addressRequired ||
    form.province ||
    form.city ||
    form.postalCode ||
    form.addressText ||
    form.receiverName;

  const selectedProvinceCities = form.province
    ? provinces.find((p) => p.name === form.province)?.cities || []
    : [];

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      };
      if (showAddress) {
        payload.receiverName = form.receiverName || form.name;
        payload.addressTitle = form.addressTitle;
        payload.phone = form.phone || "";
        payload.province = form.province;
        payload.city = form.city;
        payload.postalCode = form.postalCode;
        payload.addressText = form.addressText;
      }
      const result = await api.post<{ token: string; user: any }>(
        "/auth/register",
        payload,
      );
      localStorage.setItem("web_token", result.token);
      localStorage.setItem("web_user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("auth:change"));
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.message || err?.message || "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="dk-container py-12">
        <div className="max-w-sm mx-auto dk-card p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">ثبت‌نام</h1>
            <p className="text-sm text-[var(--dk-text-light)] mt-1">
              ایجاد حساب کاربری جدید
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 text-red-500 text-sm px-4 py-2.5">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">نام</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ایمیل</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                شماره موبایل{phoneRequired ? "" : " (اختیاری)"}
              </label>
              <input
                type="tel"
                required={phoneRequired}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">رمز عبور</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
              />
            </div>

            {addressRequired && (
              <>
                <hr className="border-[var(--dk-border)]" />
                <p className="text-sm font-bold">آدرس</p>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    عنوان آدرس
                  </label>
                  <select
                    value={form.addressTitle}
                    onChange={(e) =>
                      setForm({ ...form, addressTitle: e.target.value })
                    }
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  >
                    <option value="خانه">خانه</option>
                    <option value="محل کار">محل کار</option>
                    <option value="سایر">سایر</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    نام دریافت‌کننده
                  </label>
                  <input
                    type="text"
                    required
                    value={form.receiverName || form.name}
                    onChange={(e) =>
                      setForm({ ...form, receiverName: e.target.value })
                    }
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      استان
                    </label>
                    <select
                      required
                      value={form.province}
                      onChange={(e) =>
                        setForm({ ...form, province: e.target.value, city: "" })
                      }
                      className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                    >
                      <option value="">انتخاب استان</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      شهر
                    </label>
                    <select
                      required
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                      disabled={!form.province}
                      className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)] disabled:opacity-50"
                    >
                      <option value="">انتخاب شهر</option>
                      {selectedProvinceCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    کد پستی
                  </label>
                  <input
                    type="text"
                    required={postalcodeRequired}
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm({ ...form, postalCode: e.target.value })
                    }
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">آدرس</label>
                  <textarea
                    required
                    value={form.addressText}
                    onChange={(e) =>
                      setForm({ ...form, addressText: e.target.value })
                    }
                    className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                    rows={3}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full dk-btn-primary text-sm disabled:opacity-50"
            >
              {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
            </button>
          </form>

          <p className="text-sm text-center text-[var(--dk-text-light)] mt-4">
            قبلاً ثبت‌نام کرده‌اید؟
            <Link
              href="/auth/login"
              className="mr-1"
              style={{ color: "var(--dk-primary)" }}
            >
              ورود
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
