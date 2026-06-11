"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Header from "@/components/Header";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [form, setForm] = useState({ email: "", password: "" });
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.post<{ token: string; user: any }>(
        "/auth/login",
        form,
      );
      localStorage.setItem("web_token", result.token);
      localStorage.setItem("web_user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("auth:change"));
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.message || err?.message || "خطا در ورود");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (phone.length < 11) {
      setError("شماره موبایل را وارد کنید");
      return;
    }
    setOtpLoading(true);
    setError("");
    try {
      await api.post("/otp/request", { phone });
      setOtpSent(true);
      setOtpTimer(120);
      const interval = setInterval(() => {
        setOtpTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.message || err?.message || "خطا در ارسال کد");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      setError("کد تأیید را وارد کنید");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.post<{ token: string; user: any }>(
        "/auth/otp-login",
        { phone, code: otpCode },
      );
      localStorage.setItem("web_token", result.token);
      localStorage.setItem("web_user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("auth:change"));
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.message || err?.message || "خطا در ورود");
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
            <h1 className="text-xl font-bold">ورود</h1>
            <p className="text-sm text-[var(--dk-text-light)] mt-1">
              به اطلس شاپ خوش آمدید
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex mb-6 rounded-xl bg-[var(--dk-bg)] p-1 text-sm">
            <button
              className={`flex-1 py-2 rounded-lg transition ${mode === "email" ? "bg-white font-medium shadow-sm" : "text-[var(--dk-text-light)]"}`}
              onClick={() => {
                setMode("email");
                setError("");
              }}
            >
              ایمیل
            </button>
            <button
              className={`flex-1 py-2 rounded-lg transition ${mode === "phone" ? "bg-white font-medium shadow-sm" : "text-[var(--dk-text-light)]"}`}
              onClick={() => {
                setMode("phone");
                setError("");
              }}
            >
              شماره موبایل
            </button>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 text-red-500 text-sm px-4 py-2.5 mb-4">
              {error}
            </div>
          )}

          {mode === "email" ? (
            <form onSubmit={handleLogin} className="space-y-4">
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
                  رمز عبور
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full dk-btn-primary text-sm disabled:opacity-50"
              >
                {loading ? "در حال ورود..." : "ورود"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  شماره موبایل
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="09123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)]"
                  disabled={otpSent}
                />
              </div>
              {!otpSent ? (
                <button
                  type="button"
                  disabled={otpLoading}
                  onClick={handleRequestOtp}
                  className="w-full dk-btn-primary text-sm disabled:opacity-50"
                >
                  {otpLoading ? "در حال ارسال..." : "دریافت کد تأیید"}
                </button>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      کد تأیید
                    </label>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      className="w-full rounded-xl bg-[var(--dk-bg)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--dk-primary)] text-center tracking-widest"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-full dk-btn-primary text-sm disabled:opacity-50"
                  >
                    {loading ? "در حال ورود..." : "ورود با کد تأیید"}
                  </button>
                  {otpTimer > 0 ? (
                    <p className="text-xs text-center text-[var(--dk-text-light)]">
                      {Math.floor(otpTimer / 60)}:
                      {String(otpTimer % 60).padStart(2, "0")} تا ارسال مجدد
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="w-full text-sm text-center"
                      style={{ color: "var(--dk-primary)" }}
                    >
                      ارسال مجدد کد
                    </button>
                  )}
                </>
              )}
            </form>
          )}

          <p className="text-sm text-center text-[var(--dk-text-light)] mt-4">
            حساب کاربری ندارید؟
            <Link
              href="/auth/register"
              className="mr-1"
              style={{ color: "var(--dk-primary)" }}
            >
              ثبت‌نام
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
