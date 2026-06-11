import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@atlas-shop.com" },
    update: {},
    create: {
      name: "مدیر سیستم",
      email: "admin@atlas-shop.com",
      password: adminPassword,
      role: "SUPER_ADMIN",
    },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "لوازم الکترونیکی",
      slug: "electronics",
      description: "انواع لوازم الکترونیکی و دیجیتال",
      sortOrder: 1,
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {},
    create: {
      name: "مد و پوشاک",
      slug: "fashion",
      description: "انواع پوشاک و اکسسوری",
      sortOrder: 2,
    },
  });

  const mobile = await prisma.category.upsert({
    where: { slug: "mobile" },
    update: {},
    create: {
      name: "موبایل",
      slug: "mobile",
      description: "گوشی موبایل و تبلت",
      parentId: electronics.id,
      sortOrder: 1,
    },
  });

  // Create brands
  const samsung = await prisma.brand.upsert({
    where: { slug: "samsung" },
    update: {},
    create: {
      name: "سامسونگ",
      slug: "samsung",
      description: "محصولات الکترونیکی سامسونگ",
      isActive: true,
    },
  });

  const apple = await prisma.brand.upsert({
    where: { slug: "apple" },
    update: {},
    create: {
      name: "اپل",
      slug: "apple",
      description: "محصولات اپل",
      isActive: true,
    },
  });

  const xiaomi = await prisma.brand.upsert({
    where: { slug: "xiaomi" },
    update: {},
    create: {
      name: "شیائومی",
      slug: "xiaomi",
      description: "محصولات شیائومی",
      isActive: true,
    },
  });

  // Create more categories
  const laptop = await prisma.category.upsert({
    where: { slug: "laptop" },
    update: {},
    create: {
      name: "لپ‌تاپ",
      slug: "laptop",
      description: "لپ‌تاپ و نوت‌بوک",
      parentId: electronics.id,
      sortOrder: 2,
    },
  });

  const clothing = await prisma.category.upsert({
    where: { slug: "clothing" },
    update: {},
    create: {
      name: "پوشاک",
      slug: "clothing",
      description: "انواع پوشاک مردانه و زنانه",
      parentId: fashion.id,
      sortOrder: 1,
    },
  });

  // Create more brands
  const nike = await prisma.brand.upsert({
    where: { slug: "nike" },
    update: {},
    create: {
      name: "نایکی",
      slug: "nike",
      description: "برند ورزشی نایکی",
      isActive: true,
    },
  });

  // Create sample products
  const productData = [
    {
      title: "گوشی سامسونگ گلکسی S24",
      slug: "samsung-galaxy-s24",
      shortDescription: "گوشی هوشمند پرچمدار سامسونگ با دوربین پیشرفته",
      description:
        "<p>گوشی سامسونگ گلکسی S24 با جدیدترین تکنولوژی‌های روز دنیا</p><ul><li>دوربین ۲۰۰ مگاپیکسلی</li><li>پردازنده Exynos 2400</li><li>رم ۱۲ گیگابایت</li></ul>",
      price: 45000000,
      salePrice: 39900000,
      discountPercent: 11,
      discountStartAt: new Date("2026-06-01"),
      discountEndAt: new Date("2026-07-15"),
      stock: 50,
      lowStockThreshold: 5,
      minOrderQty: 1,
      maxOrderQty: 3,
      status: "in_stock",
      weight: 200,
      length: 15,
      width: 7,
      height: 0.8,
      images: [
        { url: "/uploads/products/s24.jpg", alt: "گوشی سامسونگ گلکسی S24" },
      ],
      tags: ["پرفروش", "جدید"],
      metaTitle: "خرید گوشی سامسونگ گلکسی S24",
      metaDesc: "گوشی سامسونگ گلکسی S24 با گارانتی اصالت کالا",
      categoryId: mobile.id,
      brandId: samsung.id,
    },
    {
      title: "هدفون بلوتوثی سامسونگ Galaxy Buds Pro",
      slug: "samsung-galaxy-buds-pro",
      shortDescription: "هدفون بی‌سیم با کیفیت صدای استثنایی",
      description:
        "<p>هدفون Galaxy Buds Pro با نویز کنسلینگ فعال</p><ul><li>نویز کنسلینگ هوشمند</li><li>مقاوم در برابر آب IPX7</li><li>باتری ۸ ساعت</li></ul>",
      price: 8500000,
      salePrice: 7200000,
      discountPercent: 15,
      stock: 3,
      lowStockThreshold: 5,
      status: "in_stock",
      weight: 50,
      images: [{ url: "/uploads/products/buds-pro.jpg", alt: "هدفون سامسونگ" }],
      tags: ["پیشنهاد ویژه"],
      categoryId: mobile.id,
      brandId: samsung.id,
    },
    {
      title: "لپ‌تاپ اپل مک بوک پرو 16 اینچ",
      slug: "apple-macbook-pro-16",
      shortDescription: "لپ‌تاپ قدرتمند اپل با تراشه M3 Pro",
      description:
        "<p>مک بوک پرو ۱۶ اینچ با تراشه M3 Pro</p><ul><li>تراشه M3 Pro با ۱۲ هسته CPU</li><li>رم ۱۸ گیگابایت</li><li>حافظه ۵۱۲ گیگابایت SSD</li></ul>",
      price: 89000000,
      salePrice: 84900000,
      discountPercent: 5,
      stock: 15,
      lowStockThreshold: 3,
      minOrderQty: 1,
      maxOrderQty: 2,
      status: "in_stock",
      weight: 2200,
      length: 36,
      width: 25,
      height: 2,
      images: [{ url: "/uploads/products/macbook-pro.jpg", alt: "مک بوک پرو" }],
      tags: ["پرفروش"],
      metaTitle: "خرید مک بوک پرو 16 اینچ M3 Pro",
      metaDesc: "لپ‌تاپ اپل مک بوک پرو با گارانتی معتبر",
      categoryId: laptop.id,
      brandId: apple.id,
    },
    {
      title: "گوشی شیائومی ردمی نوت 13",
      slug: "xiaomi-redmi-note-13",
      shortDescription: "گوشی میان‌رده با دوربین ۱۰۸ مگاپیکسل",
      description: "<p>گوشی شیائومی ردمی نوت ۱۳ با صفحه‌نمایش AMOLED</p>",
      price: 12500000,
      salePrice: null,
      stock: 200,
      lowStockThreshold: 10,
      minOrderQty: 1,
      maxOrderQty: 5,
      status: "in_stock",
      weight: 180,
      images: [
        { url: "/uploads/products/redmi-note-13.jpg", alt: "ردمی نوت ۱۳" },
      ],
      tags: ["جدید"],
      categoryId: mobile.id,
      brandId: xiaomi.id,
    },
    {
      title: "هدفون بلوتوثی شیائومی مدل Buds 4",
      slug: "xiaomi-buds-4",
      shortDescription: "هدفون بی‌سیم اقتصادی با کیفیت خوب",
      description: "<p>هدفون شیائومی Buds 4 با قابلیت حذف نویز</p>",
      price: 2800000,
      salePrice: 2200000,
      discountPercent: 21,
      stock: 4,
      lowStockThreshold: 5,
      status: "in_stock",
      weight: 40,
      images: [{ url: "/uploads/products/buds-4.jpg", alt: "شیائومی بادز ۴" }],
      tags: ["پیشنهاد ویژه"],
      categoryId: mobile.id,
      brandId: xiaomi.id,
    },
    {
      title: "لباس ورزشی نایکی مردانه",
      slug: "nike-sportswear-men",
      shortDescription: "ست ورزشی نایکی شامل تیشرت و شلوارک",
      description:
        "<p>ست ورزشی اصلی نایکی با کیفیت عالی</p><ul><li>جنس نخ پنبه</li><li>قابل شستشو با ماشین</li><li>طرح اورجینال</li></ul>",
      price: 3800000,
      salePrice: 3200000,
      discountPercent: 16,
      stock: 0,
      status: "out_of_stock",
      weight: 300,
      images: [{ url: "/uploads/products/nike-set.jpg", alt: "ست نایکی" }],
      tags: ["پرفروش"],
      categoryId: clothing.id,
      brandId: nike.id,
    },
    {
      title: "کفش کتانی نایکی ایر فورس 1",
      slug: "nike-air-force-1",
      shortDescription: "کفش اسپرت کلاسیک نایکی",
      description: "<p>کفش نایکی ایر فورس ۱ اصل با ضمانت اصالت</p>",
      price: 5200000,
      salePrice: 4800000,
      discountPercent: 8,
      stock: 25,
      status: "in_stock",
      weight: 800,
      images: [{ url: "/uploads/products/air-force.jpg", alt: "ایر فورس ۱" }],
      tags: ["پیشنهاد ویژه", "پرفروش"],
      metaTitle: "خرید کفش نایکی ایر فورس 1",
      metaDesc: "کفش کتانی نایکی ایر فورس ۱ اصل",
      categoryId: clothing.id,
      brandId: nike.id,
    },
    {
      title: "هدفون بلوتوثی اپل AirPods Pro 2",
      slug: "apple-airpods-pro-2",
      shortDescription: "ایرپادز پرو ۲ با تراشه H2",
      description: "<p>ایرپادز پرو ۲ با صدای فضایی و حذف نویز فعال</p>",
      price: 14500000,
      salePrice: null,
      stock: 35,
      status: "in_stock",
      weight: 45,
      images: [
        { url: "/uploads/products/airpods-pro-2.jpg", alt: "ایرپادز پرو ۲" },
      ],
      tags: ["جدید", "پرفروش"],
      categoryId: mobile.id,
      brandId: apple.id,
    },
  ];

  for (const data of productData) {
    const { brandId, ...rest } = data;
    await prisma.product.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...rest,
        brandId: brandId || null,
        specifications: {
          create: [
            { name: "وزن", value: `${data.weight || 0} گرم` },
            { name: "گارانتی", value: "۱۸ ماه گارانتی" },
          ],
        },
      },
    });
  }

  console.log("Seed completed:");
  console.log(`  Admin: ${admin.email} / admin123`);
  console.log(
    `  Categories: ${electronics.name}, ${mobile.name}, ${laptop.name}, ${fashion.name}, ${clothing.name}`,
  );
  console.log("  Brands: سامسونگ, اپل, شیائومی, نایکی");
  console.log(`  Products: ${productData.length} محصول اضافه شد`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
