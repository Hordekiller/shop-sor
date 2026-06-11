import { Metadata } from "next";

export const metadata: Metadata = {
  title: "پروفایل کاربری",
  description: "مدیریت حساب کاربری در فروشگاه اطلس",
  alternates: { canonical: "https://atlas-shop.com/profile" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
