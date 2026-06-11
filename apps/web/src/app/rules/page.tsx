"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMobile,
  faComment,
  faTv,
  faX,
} from "@fortawesome/free-solid-svg-icons";

const sections = [
  {
    id: "buy",
    title: "شرایط خرید",
    content:
      "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می‌باشد. خرید از فروشگاه اطلس شاپ به معنای پذیرش کامل قوانین و مقررات زیر است.",
  },
  {
    id: "return",
    title: "شرایط بازگشت کالا",
    content:
      "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است. مشتریان گرامی تا ۷ روز پس از دریافت سفارش، امکان بازگرداندن کالا را دارند. کالای بازگشتی باید در بسته‌بندی اصلی و بدون استفاده باشد.",
  },
  {
    id: "privacy",
    title: "حریم خصوصی",
    content:
      "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است. اطلاعات شخصی شما نزد ما محفوظ بوده و تحت هیچ شرایطی در اختیار اشخاص ثالث قرار نخواهد گرفت.",
  },
  {
    id: "shipping",
    title: "قوانین ارسال",
    content:
      "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است. سفارشات در اسرع وقت و حداکثر طی ۳ تا ۷ روز کاری به دست مشتریان عزیز خواهد رسید. هزینه ارسال بر اساس وزن و مقصد محاسبه می‌شود.",
  },
];

export default function RulesPage() {
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
          <span className="text-[var(--dk-text)] font-medium">
            قوانین و مقررات
          </span>
        </nav>

        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: "var(--dk-primary)" }}
        >
          قوانین و مقررات
        </h1>

        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Sidebar */}
          <div className="lg:w-56 shrink-0">
            <div className="dk-card p-4 sticky top-24">
              <h3 className="font-bold text-sm mb-3">فهرست</h3>
              <ul className="space-y-2">
                {sections.map((sec, i) => (
                  <li key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      className="text-sm text-[var(--dk-text-light)] hover:text-[var(--dk-primary)] transition block py-1.5 px-3 rounded-lg hover:bg-[var(--dk-bg)]"
                    >
                      {i + 1}. {sec.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {sections.map((sec, i) => (
              <section
                key={sec.id}
                id={sec.id}
                className="dk-card p-8 animate-slide-up"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: "var(--dk-primary)" }}
                  >
                    {i + 1}
                  </span>
                  <h2 className="text-xl font-bold">{sec.title}</h2>
                </div>
                <p className="text-sm text-[var(--dk-text-light)] leading-7">
                  {sec.content}
                </p>
              </section>
            ))}
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
