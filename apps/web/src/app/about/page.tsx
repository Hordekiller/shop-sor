"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faMobile,
  faComment,
  faTv,
  faX,
} from "@fortawesome/free-solid-svg-icons";

export default function AboutPage() {
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
          <span className="text-[var(--dk-text)] font-medium">درباره ما</span>
        </nav>

        {/* Hero */}
        <div className="dk-card p-8 mb-6 text-center animate-fade-in">
          <h1
            className="text-3xl font-bold mb-4"
            style={{ color: "var(--dk-primary)" }}
          >
            درباره اطلس شاپ
          </h1>
          <p className="text-[var(--dk-text-light)] max-w-2xl mx-auto leading-7">
            لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با
            استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در
            ستون و سطرآنچنان که لازم است.
          </p>
        </div>

        {/* Why Us */}
        <section className="dk-card p-8 mb-6 animate-slide-up">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span
              className="w-1 h-6 rounded-full inline-block"
              style={{ background: "var(--dk-primary)" }}
            />
            چرا اطلس شاپ؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: "var(--dk-bg)" }}
              >
                <FontAwesomeIcon icon={faCheck} className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-2">ضمانت اصالت کالا</h3>
              <p className="text-sm text-[var(--dk-text-light)] leading-6">
                لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ.
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: "var(--dk-bg)" }}
              >
                <FontAwesomeIcon icon={faCheck} className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-2">بهترین قیمت‌ها</h3>
              <p className="text-sm text-[var(--dk-text-light)] leading-6">
                لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ.
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: "var(--dk-bg)" }}
              >
                <FontAwesomeIcon icon={faCheck} className="w-8 h-8" />
              </div>
              <h3 className="font-bold mb-2">ارسال سریع</h3>
              <p className="text-sm text-[var(--dk-text-light)] leading-6">
                لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ.
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="dk-card p-8 mb-6 animate-slide-up">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span
              className="w-1 h-6 rounded-full inline-block"
              style={{ background: "var(--dk-primary)" }}
            />
            تیم ما
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "علی محمدی", role: "مدیر عامل" },
              { name: "سارا احمدی", role: "مدیر فروش" },
              { name: "رضا کریمی", role: "مدیر فنی" },
              { name: "مریم حسینی", role: "مدیر پشتیبانی" },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <div className="w-24 h-24 rounded-full mx-auto mb-3 bg-gradient-to-br from-[var(--dk-primary)] to-[var(--dk-secondary)] flex items-center justify-center text-white text-3xl font-bold">
                  {m.name[0]}
                </div>
                <h3 className="font-bold text-sm">{m.name}</h3>
                <p className="text-xs text-[var(--dk-text-light)]">{m.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section className="dk-card p-8 mb-6 animate-slide-up">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span
              className="w-1 h-6 rounded-full inline-block"
              style={{ background: "var(--dk-primary)" }}
            />
            افتخارات ما
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div
              className="p-6 rounded-2xl"
              style={{ background: "var(--dk-bg)" }}
            >
              <span
                className="text-4xl font-bold"
                style={{ color: "var(--dk-primary)" }}
              >
                ۱۰+
              </span>
              <p className="text-sm text-[var(--dk-text-light)] mt-2">
                سال تجربه
              </p>
            </div>
            <div
              className="p-6 rounded-2xl"
              style={{ background: "var(--dk-bg)" }}
            >
              <span
                className="text-4xl font-bold"
                style={{ color: "var(--dk-primary)" }}
              >
                ۵۰٬۰۰۰+
              </span>
              <p className="text-sm text-[var(--dk-text-light)] mt-2">
                مشتری راضی
              </p>
            </div>
            <div
              className="p-6 rounded-2xl"
              style={{ background: "var(--dk-bg)" }}
            >
              <span
                className="text-4xl font-bold"
                style={{ color: "var(--dk-primary)" }}
              >
                ۱۰۰٬۰۰۰+
              </span>
              <p className="text-sm text-[var(--dk-text-light)] mt-2">
                سفارش موفق
              </p>
            </div>
          </div>
        </section>
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
