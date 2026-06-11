import { Metadata } from "next";

export const metadata: Metadata = {
  title: "فروشندگی",
  description: "پنل فروشندگان فروشگاه اطلس",
  alternates: { canonical: "https://atlas-shop.com/vendor" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
