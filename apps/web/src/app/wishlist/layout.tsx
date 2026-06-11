import { Metadata } from "next";

export const metadata: Metadata = {
  title: "علاقه‌مندی‌ها",
  description: "محصولات مورد علاقه شما در فروشگاه اطلس",
  alternates: { canonical: "https://atlas-shop.com/wishlist" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
