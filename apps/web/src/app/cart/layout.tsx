import { Metadata } from "next";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: "سبد خرید شما در فروشگاه اطلس",
  alternates: { canonical: "https://atlas-shop.com/cart" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
