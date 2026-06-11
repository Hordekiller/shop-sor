import { Metadata } from "next";

export const metadata: Metadata = {
  title: "مقایسه محصولات",
  description: "مقایسه محصولات در فروشگاه اطلس",
  alternates: { canonical: "https://atlas-shop.com/compare" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
