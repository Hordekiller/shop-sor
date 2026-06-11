import { Metadata } from "next";

export const metadata: Metadata = {
  title: "سفارشات",
  description: "مشاهده سفارشات شما در فروشگاه اطلس",
  alternates: { canonical: "https://atlas-shop.com/orders" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
