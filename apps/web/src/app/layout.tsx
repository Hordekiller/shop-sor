import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "فروشگاه اطلس", template: "%s | فروشگاه اطلس" },
  description: "فروشگاه اینترنتی اطلس شاپ | خرید آنلاین با بهترین قیمت‌ها و ضمانت اصالت کالا",
  keywords: ["فروشگاه آنلاین", "خرید اینترنتی", "اطلس شاپ", "فروشگاه اینترنتی"],
  openGraph: {
    title: "فروشگاه اطلس",
    description: "خرید آنلاین با بهترین قیمت‌ها و ضمانت اصالت کالا",
    type: "website",
    locale: "fa_IR",
    siteName: "فروشگاه اطلس",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-gray-50 text-gray-800">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
