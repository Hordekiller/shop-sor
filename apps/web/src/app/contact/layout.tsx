import { Metadata } from "next";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباطی با فروشگاه اینترنتی اطلس شاپ",
  alternates: { canonical: "https://atlas-shop.com/contact" },
  openGraph: {
    title: "تماس با ما | فروشگاه اطلس",
    description: "راه‌های ارتباطی با اطلس شاپ",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
