import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class SettingsService {
  private readonly defaults: Record<string, string> = {
    site_name: "اطلس شاپ",
    site_description: "فروشگاه اینترنتی اطلس شاپ",
    support_email: "info@atlas-shop.com",
    support_phone: "۰۲۱-۱۲۳۴۵۶۷۸",
    default_shipping: "post_pishtaz",
    currency: "تومان",
    slides: JSON.stringify([
      {
        bg: "from-[#ef4056] to-[#d8364a]",
        title: "فروش ویژه بهاره",
        desc: "تخفیف تا ۵۰٪ روی هزاران محصول",
      },
      {
        bg: "from-[#19bfd3] to-[#1599a8]",
        title: "محصولات دیجیتال",
        desc: "جدیدترین گوشی‌ها و لپ‌تاپ‌ها",
      },
      {
        bg: "from-[#f9a825] to-[#e8960c]",
        title: "مد و پوشاک",
        desc: "جدیدترین مدل‌های بهاره و تابستانه",
      },
    ]),
    sections: JSON.stringify([
      {
        type: "products",
        title: "جدیدترین محصولات",
        sort: "newest",
        count: 12,
      },
    ]),
    global_colors: JSON.stringify({
      primary: "#ef4056",
      secondary: "#19bfd3",
      text: "#3f3f3f",
      bg: "#f5f5f5",
      muted: "#81858b",
      success: "#28C76F",
      error: "#FF4C51",
      warning: "#FF9F43",
    }),
  };

  constructor(private prisma: PrismaService) {}

  async get(key: string): Promise<string> {
    const cfg = await this.prisma.siteConfig.findUnique({ where: { key } });
    return cfg?.value ?? this.defaults[key] ?? "";
  }

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.prisma.siteConfig.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    for (const key of Object.keys(this.defaults)) {
      if (!map[key]) map[key] = this.defaults[key];
    }
    return map;
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.siteConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async setMany(data: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
  }
}
