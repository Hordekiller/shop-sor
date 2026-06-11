import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به حساب کاربری فروشگاه اطلس",
  alternates: { canonical: "https://atlas-shop.com/auth/login" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
