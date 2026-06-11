"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMobile,
  faComment,
  faTv,
  faX,
} from "@fortawesome/free-solid-svg-icons";

interface FooterConfig {
  aboutTitle: string;
  aboutLinks: { label: string; href: string }[];
  customerTitle: string;
  customerLinks: { label: string; href: string }[];
  guideTitle: string;
  guideLinks: { label: string; href: string }[];
  socialTitle: string;
  copyright: string;
  shopName: string;
  shopDescription: string;
}

const defaultFooter: FooterConfig = {
  aboutTitle: "اطلس شاپ",
  aboutLinks: [
    { label: "درباره ما", href: "/about" },
    { label: "تماس با ما", href: "/contact" },
    { label: "فرصت‌های شغلی", href: "#" },
  ],
  customerTitle: "خدمات مشتریان",
  customerLinks: [
    { label: "راهنمای خرید", href: "#" },
    { label: "شرایط بازگشت", href: "/rules" },
    { label: "پرسش‌های متداول", href: "#" },
  ],
  guideTitle: "راهنمایی",
  guideLinks: [
    { label: "نحوه ثبت سفارش", href: "#" },
    { label: "روش‌های پرداخت", href: "#" },
    { label: "روش‌های ارسال", href: "#" },
  ],
  socialTitle: "با ما همراه شوید",
  copyright:
    "استفاده از مطالب فروشگاه اینترنتی اطلس شاپ فقط برای مقاصد غیرتجاری و با ذکر منبع بلامانع است.",
  shopName: "فروشگاه اطلس",
  shopDescription:
    "فروشگاه اینترنتی اطلس شاپ، مرجع تخصصی خرید آنلاین با بهترین قیمت‌ها و ضمانت اصالت کالا.",
};

const socialIcons = [faMobile, faComment, faTv, faX];

export default function Footer() {
  const [config, setConfig] = useState<FooterConfig>(defaultFooter);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/settings/public`,
    )
      .then((res) => res.json())
      .then((settings) => {
        if (settings?.footer_config) {
          try {
            const parsed = JSON.parse(settings.footer_config);
            setConfig({ ...defaultFooter, ...parsed });
          } catch {
            /* use default */
          }
        }
      })
      .catch(() => {
        /* use default */
      });
  }, []);

  return (
    <footer className="bg-white border-t border-[var(--dk-border)] py-8 mt-4">
      <div className="dk-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-sm mb-3">{config.aboutTitle}</h4>
            <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
              {config.aboutLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="hover:text-[var(--dk-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3">{config.customerTitle}</h4>
            <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
              {config.customerLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="hover:text-[var(--dk-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3">{config.guideTitle}</h4>
            <ul className="space-y-2 text-xs text-[var(--dk-text-light)]">
              {config.guideLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="hover:text-[var(--dk-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-3">{config.socialTitle}</h4>
            <div className="flex gap-3">
              {socialIcons.map((icon, i) => (
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
          <p>{config.copyright}</p>
          <p className="mt-2">
            کلیه حقوق این سایت متعلق به {config.shopName} می‌باشد.
          </p>
        </div>
      </div>
    </footer>
  );
}
