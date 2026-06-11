"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faPhone,
  faEnvelope,
  faClock,
  faMobile,
  faComment,
  faTv,
  faX,
} from "@fortawesome/free-solid-svg-icons";

export default function ContactPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForm({ name: "", email: "", subject: "", message: "" });
    addToast("پیام شما ارسال شد");
  };

  return (
    <>
      <Header />

      {/* Breadcrumb */}
      <div className="dk-container pt-4">
        <nav className="flex items-center gap-2 text-sm text-[var(--dk-text-light)] mb-6">
          <Link href="/" className="hover:text-[var(--dk-primary)] transition">
            خانه
          </Link>
          <span>/</span>
          <span className="text-[var(--dk-text)] font-medium">تماس با ما</span>
        </nav>

        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: "var(--dk-primary)" }}
        >
          تماس با ما
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Contact Info */}
          <div className="space-y-4">
            <div className="dk-card p-6 flex items-start gap-4 animate-fade-in">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background: "var(--dk-bg)",
                  color: "var(--dk-primary)",
                }}
              >
                <FontAwesomeIcon icon={faLocationDot} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">آدرس</h3>
                <p className="text-sm text-[var(--dk-text-light)] leading-6">
                  تهران، خیابان ولیعصر، کوچه گلستان، پلاک ۱۲۳، واحد ۵
                </p>
              </div>
            </div>

            <div className="dk-card p-6 flex items-start gap-4 animate-fade-in">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background: "var(--dk-bg)",
                  color: "var(--dk-primary)",
                }}
              >
                <FontAwesomeIcon icon={faPhone} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">شماره تماس</h3>
                <p className="text-sm text-[var(--dk-text-light)]">
                  ۰۲۱-۱۲۳۴۵۶۷۸
                </p>
                <p className="text-sm text-[var(--dk-text-light)]">
                  ۰۹۱۲-۱۲۳۴۵۶۷
                </p>
              </div>
            </div>

            <div className="dk-card p-6 flex items-start gap-4 animate-fade-in">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background: "var(--dk-bg)",
                  color: "var(--dk-primary)",
                }}
              >
                <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">ایمیل</h3>
                <p className="text-sm text-[var(--dk-text-light)]">
                  info@atlasso.ir
                </p>
                <p className="text-sm text-[var(--dk-text-light)]">
                  support@atlasso.ir
                </p>
              </div>
            </div>

            <div className="dk-card p-6 flex items-start gap-4 animate-fade-in">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background: "var(--dk-bg)",
                  color: "var(--dk-primary)",
                }}
              >
                <FontAwesomeIcon icon={faClock} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">ساعات کاری</h3>
                <p className="text-sm text-[var(--dk-text-light)]">
                  شنبه تا چهارشنبه: ۹:۰۰ الی ۱۸:۰۰
                </p>
                <p className="text-sm text-[var(--dk-text-light)]">
                  پنجشنبه: ۹:۰۰ الی ۱۴:۰۰
                </p>
                <p className="text-sm text-[var(--dk-text-light)]">
                  جمعه: تعطیل
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="dk-card p-8 animate-slide-up">
            <h2 className="text-lg font-bold mb-6">فرم تماس</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--dk-text-light)] block mb-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--dk-border)] px-4 py-2.5 text-sm focus:border-[var(--dk-primary)] focus:outline-none transition bg-white"
                  placeholder="نام خود را وارد کنید"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--dk-text-light)] block mb-1">
                  ایمیل
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-[var(--dk-border)] px-4 py-2.5 text-sm focus:border-[var(--dk-primary)] focus:outline-none transition bg-white"
                  placeholder="ایمیل خود را وارد کنید"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--dk-text-light)] block mb-1">
                  موضوع
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--dk-border)] px-4 py-2.5 text-sm focus:border-[var(--dk-primary)] focus:outline-none transition bg-white"
                  placeholder="موضوع پیام"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--dk-text-light)] block mb-1">
                  پیام
                </label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--dk-border)] px-4 py-2.5 text-sm focus:border-[var(--dk-primary)] focus:outline-none transition bg-white resize-none"
                  placeholder="پیام خود را بنویسید..."
                />
              </div>
              <button type="submit" className="dk-btn-primary w-full">
                ارسال پیام
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[var(--dk-border)] py-8 mt-4">
        <div className="dk-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-sm mb-3">اطلس شاپ</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li>
                  <a href="/about" className="hover:text-[var(--dk-primary)]">
                    درباره ما
                  </a>
                </li>
                <li>
                  <a href="/contact" className="hover:text-[var(--dk-primary)]">
                    تماس با ما
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    فرصت‌های شغلی
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">خدمات مشتریان</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    راهنمای خرید
                  </a>
                </li>
                <li>
                  <a href="/rules" className="hover:text-[var(--dk-primary)]">
                    شرایط بازگشت
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    پرسش‌های متداول
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">راهنمایی</h4>
              <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    نحوه ثبت سفارش
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    روش‌های پرداخت
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[var(--dk-primary)]">
                    روش‌های ارسال
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">با ما همراه شوید</h4>
              <div className="flex gap-3">
                {[faMobile, faComment, faTv, faX].map((icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-full bg-[var(--dk-bg)] flex items-center justify-center text-lg hover:bg-[var(--dk-primary)] hover:text-white transition"
                  >
                    <FontAwesomeIcon icon={icon} className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-[var(--dk-border)] pt-6 text-center text-xs text-[var(--dk-text-light)]">
            <p>
              استفاده از مطالب فروشگاه اینترنتی اطلس شاپ فقط برای مقاصد غیرتجاری
              و با ذکر منبع بلامانع است.
            </p>
            <p className="mt-2">
              کلیه حقوق این سایت متعلق به اطلس شاپ می‌باشد.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
