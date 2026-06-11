import { Metadata } from "next";

export const metadata: Metadata = {
  title: "درباره ما",
  description:
    "درباره فروشگاه اینترنتی اطلس شاپ | خرید آنلاین با بهترین قیمت‌ها",
  alternates: { canonical: "https://atlas-shop.com/about" },
  openGraph: {
    title: "درباره ما | فروشگاه اطلس",
    description: "درباره فروشگاه اینترنتی اطلس شاپ",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
