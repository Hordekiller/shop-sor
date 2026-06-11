import { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسویه حساب",
  description: "تکمیل سفارش و پرداخت در فروشگاه اطلس",
  alternates: { canonical: "https://atlas-shop.com/checkout" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
