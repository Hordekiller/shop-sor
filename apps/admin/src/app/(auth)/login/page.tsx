"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token, user } = await api.post<{ token: string; user: any }>(
        "/auth/login",
        { email, password },
      );
      localStorage.setItem("atlas_token", token);
      localStorage.setItem("atlas_user", JSON.stringify(user));
      router.push("/");
    } catch (err: any) {
      setError(err.message || "خطا در ورود");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Illustration */}
      <div
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #7367F0 0%, #9C8CFC 50%, #B4A7FF 100%)",
        }}
      >
        <div className="text-center relative z-10 px-12">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6">
            <Icon icon="tabler:shopping-bag" className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            به اطلس شاپ خوش آمدید
          </h1>
          <p className="text-white/80 text-sm max-w-md mx-auto leading-relaxed">
            پنل مدیریت فروشگاه اطلس شاپ — مدیریت محصولات، سفارشات، کاربران و
            فروشندگان
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full bg-white/5" />
      </div>

      {/* Right - Form */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: "#F8F7FA" }}
      >
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--v-primary)" }}
              >
                <Icon
                  icon="tabler:shopping-bag"
                  className="w-6 h-6 text-white"
                />
              </div>
              <span
                className="text-xl font-bold"
                style={{ color: "var(--v-text)" }}
              >
                اطلس شاپ
              </span>
            </div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--v-text)" }}
            >
              ورود به پنل مدیریت
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--v-text-secondary)" }}
            >
              ایمیل و رمز عبور خود را وارد کنید
            </p>
          </div>

          {/* Card */}
          <div className="v-card p-8">
            {error && (
              <div
                className="mb-5 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "rgba(255, 76, 81, 0.08)",
                  color: "var(--v-error)",
                }}
              >
                <Icon icon="tabler:alert-circle" className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  ایمیل
                </label>
                <input
                  type="email"
                  required
                  className="v-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@atlas-shop.com"
                  dir="ltr"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--v-text)" }}
                >
                  رمز عبور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="v-input pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                  >
                    <Icon
                      icon={showPassword ? "tabler:eye-off" : "tabler:eye"}
                      className="w-4 h-4"
                      style={{ color: "var(--v-text-secondary)" }}
                    />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="v-btn v-btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    در حال ورود...
                  </span>
                ) : (
                  "ورود"
                )}
              </button>
            </form>
          </div>

          <p
            className="text-center text-xs mt-4"
            style={{ color: "var(--v-text-disabled)" }}
          >
            فروشگاه اطلس شاپ &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
