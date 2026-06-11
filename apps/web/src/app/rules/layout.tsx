import { Metadata } from "next";

export const metadata: Metadata = {
  title: "قوانین و مقررات",
  description: "قوانین و مقررات فروشگاه اینترنتی اطلس شاپ",
  alternates: { canonical: "https://atlas-shop.com/rules" },
  openGraph: {
    title: "قوانین و مقررات | فروشگاه اطلس",
    description: "قوانین و مقررات اطلس شاپ",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
