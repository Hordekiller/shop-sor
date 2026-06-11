import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CompareProvider } from "@/context/CompareContext";
import { WalletProvider } from "@/context/WalletContext";
import CompareBar from "@/components/CompareBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import FontLoader from "@/components/FontLoader";
import "@/lib/fontawesome";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "فروشگاه اطلس", template: "%s | فروشگاه اطلس" },
  description:
    "فروشگاه اینترنتی اطلس شاپ | خرید آنلاین با بهترین قیمت‌ها و ضمانت اصالت کالا",
  keywords: ["فروشگاه آنلاین", "خرید اینترنتی", "اطلس شاپ", "فروشگاه اینترنتی"],
  openGraph: {
    title: "فروشگاه اطلس",
    description: "خرید آنلاین با بهترین قیمت‌ها و ضمانت اصالت کالا",
    type: "website",
    locale: "fa_IR",
    siteName: "فروشگاه اطلس",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className="pb-14 md:pb-0"
        style={{ background: "var(--dk-bg)", color: "var(--dk-text)" }}
      >
        <CartProvider>
          <WalletProvider>
            <WishlistProvider>
              <CompareProvider>
                <ToastProvider>
                  <FontLoader />
                  {children}
                  <MobileBottomNav />
                  <CompareBar />
                </ToastProvider>
              </CompareProvider>
            </WishlistProvider>
          </WalletProvider>
        </CartProvider>
      </body>
    </html>
  );
}
