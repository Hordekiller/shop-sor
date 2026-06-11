import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  description: "ثبت‌نام در فروشگاه اینترنتی اطلس",
  alternates: { canonical: "https://atlas-shop.com/auth/register" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
