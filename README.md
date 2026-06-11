<div dir="rtl" align="center">

# 🛍️ فروشگاه اطلس — Atlas Shop

**پلتفرم فروشگاهی مدرن و کامل | NestJS + Next.js + Turborepo**

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/Hordekiller/shop-sor/ci.yml?style=for-the-badge&label=CI)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwind-css)
![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?style=for-the-badge&logo=turborepo)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

---

🚀 **فروشگاه اطلس** یک پلتفرم فروشگاهی فول‌استک، کاملاً فارسی و مشابه ووکامرس ایرانیزه است که با آخرین تکنولوژی‌های وب ساخته شده. از مدیریت محصولات و سفارشات گرفته تا درگاه‌های پرداخت ایرانی و پنل فروشنده — همه چیز در یک مونورپوی حرفه‌ای.

</div>

---

## ✨ قابلیت‌ها

<div dir="rtl">

### 🏪 فروشگاه (مشتری)
- **صفحه اصلی** — نمایش بنر، محصولات ویژه، دسته‌بندی‌ها
- **صفحه محصولات** — جستجو، فیلتر بر اساس دسته و قیمت، مرتب‌سازی و صفحه‌بندی
- **جزئیات محصول** — تصاویر، قیمت، نظرات کاربران، افزودن به سبد خرید
- **سبد خرید** — مدیریت مبتنی بر localStorage، تغییر تعداد، حذف
- **تسویه حساب** — انتخاب روش ارسال، اعمال کد تخفیف، انتخاب درگاه پرداخت
- **پروفایل کاربری** — ویرایش اطلاعات شخصی، تاریخچه سفارشات
- **احراز هویت** — ورود / ثبت‌نام با JWT

### 👑 پنل مدیریت
- **داشبورد** — آمار واقعی فروش، سفارشات، کاربران، محصولات
- **مدیریت محصولات** — CRUD کامل با آپلود تصویر، قیمت‌گذاری، دسته‌بندی
- **مدیریت دسته‌بندی‌ها** — سلسله‌مراتب دسته‌بندی (والد/فرزند)
- **مدیریت سفارشات** — مشاهده، تغییر وضعیت (تأیید/ارسال/تحویل/لغو)، فیلتر پیشرفته
- **مدیریت تخفیف‌ها** — کوپن‌های درصدی و مبلغی با تاریخ انقضا
- **مدیریت کاربران** — لیست کاربران، جزئیات، مشاهده سفارشات هر کاربر
- **فروشندگان** — مدیریت فروشگاه‌های فعال
- **گزارشات** — آمار فروش و عملکرد
- **تنظیمات** — تنظیمات فروشگاه

### 🧑‍💼 پنل فروشنده
- **داشبورد فروشنده** — آمار فروشگاه شخصی (محصولات، سفارشات، درآمد)
- **محصولات من** — مدیریت محصولات فروشگاه خود
- **سفارشات من** — مشاهده سفارشات مربوط به محصولات خود

### 💳 درگاه‌های پرداخت
- **زرین‌پال** — یکپارچه‌سازی واقعی با API v4
- **بانک ملت** — شبیه‌سازی شده (قابل اتصال واقعی)
- **بانک سامان** — شبیه‌سازی شده (قابل اتصال واقعی)

### 📦 روش‌های ارسال
- پست پیشتاز / سفارشی
- تیپاکس
- ماهکس
- اسنپ‌باکس

### 🌐 فارسی‌سازی کامل
- **RTL** — پشتیبانی کامل از راست‌به‌چپ
- **تاریخ شمسی** — با کتابخانه `date-fns-jalali`
- **اعداد فارسی** — نمایش اعداد به صورت فارسی
- **UI کاملاً فارسی** — تمام رابط‌های کاربری به زبان فارسی

### 🐳 Docker
- **Dockerfile** مجزا برای API، فروشگاه و پنل ادمین
- **docker-compose.yml** با Nginx reverse proxy
- آماده استقرار در تولید

### 🔄 CI/CD
- **GitHub Actions** — lint + build + smoke test خودکار

</div>

---

## 🏗️ معماری

<div dir="rtl">

```
atlas-shop/
├── apps/
│   ├── api/          # NestJS API — پورت ۸۰۰۰
│   ├── web/          # فروشگاه (Next.js) — پورت ۳۰۰۰
│   └── admin/        # پنل مدیریت (Next.js) — پورت ۳۰۰۱
├── packages/
│   ├── shared-types/ # تایپ‌های مشترک TypeScript
│   ├── api-client/   # کلاینت API خودکار
│   └── eslint-config/ # تنظیمات ESLint مشترک
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
└── turbo.json        # تنظیمات Turborepo
```

### دیاگرام معماری

```
🌐 کاربر
   │
   ▼
┌──────────────────────────────────────────────────┐
│                  Nginx (پورت ۸۰)                   │
│   / → web:3000  /admin/* → admin:3001  /api → api │
└──────────────────────────────────────────────────┘
   │           │            │
   ▼           ▼            ▼
┌──────┐  ┌────────┐  ┌──────────┐
│ Web  │  │ Admin  │  │ API      │
│:3000 │  │:3001   │  │:8000     │
└──────┘  └────────┘  └────┬─────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Prisma     │
                    │   (SQLite)   │
                    └──────────────┘
```

</div>

---

## 🛠️ تکنولوژی‌ها

<div dir="rtl">

| بخش | تکنولوژی |
|------|----------|
| **Backend** | NestJS 11, Prisma 5, Passport JWT, Swagger, Multer |
| **Frontend (فروشگاه)** | Next.js 16, React 19, Tailwind CSS 4 |
| **Frontend (ادمین)** | Next.js 16, React 19, Tailwind CSS 4 |
| **دیتابیس** | SQLite (توسعه) / PostgreSQL (تولید) |
| **مونورپو** | Turborepo 2, npm workspaces |
| **زبان** | TypeScript 5 (تمامی بخش‌ها) |
| **احراز هویت** | JWT (bcryptjs) |
| **مستندات API** | Swagger (OpenAPI) |
| **CI/CD** | GitHub Actions |
| **Container** | Docker + docker-compose |
| **تاریخ شمسی** | date-fns-jalali |
| **درگاه پرداخت** | Zarinpal API v4 |

</div>

---

## 🚀 شروع سریع

### پیش‌نیازها

<div dir="rtl">

- Node.js ≥ 22
- npm ≥ 10

</div>

### نصب و راه‌اندازی

<div dir="rtl">

```bash
# ۱. کلون کردن پروژه
git clone https://github.com/Hordekiller/shop-sor.git
cd "shop sor"

# ۲. نصب وابستگی‌ها
npm install

# ۳. راه‌اندازی دیتابیس
npm run db:push -w @atlas-shop/api
npm run db:generate -w @atlas-shop/api

# ۴. پر کردن دیتابیس با داده‌های اولیه
npm run db:seed -w @atlas-shop/api

# ۵. اجرای همزمان همه سرویس‌ها
npm run dev
```

</div>

### دسترسی‌ها

<div dir="rtl">

| نقش | ایمیل | رمز عبور |
|------|-------|----------|
| **مدیر سیستم** | `admin@atlas-shop.com` | `admin123` |
| **مشتری** | ثبت‌نام از طریق سایت | — |

> اولین کاربر ثبت‌نام‌کننده به صورت خودکار نقش **SUPER_ADMIN** می‌گیرد.

</div>

### لینک‌ها

<div dir="rtl">

| سرویس | آدرس |
|-------|------|
| فروشگاه | http://localhost:3000 |
| پنل مدیریت | http://localhost:3001 |
| API | http://localhost:8000/api/v1 |
| مستندات API | http://localhost:8000/api/docs |

</div>

---

## 🐳 اجرا با Docker

<div dir="rtl">

```bash
# استقرار کامل با Docker
docker compose up -d

# سرویس‌ها:
#   - Nginx: پورت ۸۰
#   - API: پورت ۸۰۰۰
#   - فروشگاه: پورت ۳۰۰۰
#   - پنل مدیریت: پورت ۳۰۰۱
```

### متغیرهای محیطی Docker

| متغیر | توضیح | پیش‌فرض |
|-------|-------|---------|
| `JWT_SECRET` | کلید امضای JWT | `change-this-secret-in-production` |
| `ZARINPAL_MERCHANT_ID` | شناسه درگاه زرین‌پال | — |
| `ZARINPAL_CALLBACK_URL` | آدرس بازگشت پرداخت | `http://localhost:8000/api/v1/payments/verify` |

</div>

---

## 📸 اسکرین‌شات‌ها

<div dir="rtl">

> 👷 به زودی...

| بخش | تصویر |
|-----|-------|
| 🏪 فروشگاه | ![]() |
| 👑 پنل مدیریت | ![]() |
| 🧾 جزئیات سفارش | ![]() |
| 📊 داشبورد | ![]() |

</div>

---

## 📁 ساختار API (مسیرهای اصلی)

<div dir="rtl">

```
/api/v1
├── POST   /auth/register     ثبت‌نام
├── POST   /auth/login        ورود
├── GET    /auth/me           اطلاعات کاربر فعلی
├── PUT    /auth/profile      ویرایش پروفایل
├── GET    /products          لیست محصولات
├── GET    /products/:id      جزئیات محصول
├── POST   /products          ایجاد محصول (ادمین/فروشنده)
├── PUT    /products/:id      ویرایش محصول (ادمین/فروشنده)
├── DELETE /products/:id      حذف محصول (ادمین)
├── GET    /categories        لیست دسته‌بندی‌ها
├── POST   /orders            ثبت سفارش
├── GET    /orders            سفارشات من
├── GET    /orders/:id        جزئیات سفارش
├── PUT    /orders/:id/status تغییر وضعیت (ادمین)
├── POST   /payments/request  درخواست پرداخت
├── GET    /payments/verify   تأیید پرداخت
├── GET    /admin/stats       آمار داشبورد (ادمین)
├── GET    /users             لیست کاربران (ادمین)
├── GET    /users/:id         جزئیات کاربر (ادمین)
├── GET    /shops/my          فروشگاه من (فروشنده)
├── POST   /shops             ایجاد فروشگاه (فروشنده)
├── POST   /upload            آپلود تصویر
└── ... و بسیاری مسیرهای دیگر
```

مستندات کامل Swagger در آدرس `/api/docs` در دسترس است.

</div>

---

## 🧪 CI/CD

<div dir="rtl">

پروژه دارای **GitHub Actions CI** است که در هر Push و Pull Request:

1. ✅ وابستگی‌ها را نصب می‌کند
2. 🔍 ESLint lint را اجرا می‌کند
3. 🏗️ همه سه اپ (API, Web, Admin) را build می‌کند
4. 🧪 Smoke test اجرا می‌کند:
   - ثبت‌نام و ورود کاربر
   - ایجاد محصول و دسته‌بندی
   - ثبت سفارش
   - اعمال تخفیف
   - درخواست پرداخت
   - دریافت آمار ادمین

</div>

---

## 🤝 مشارکت

<div dir="rtl">

1. Fork کنید 🍴
2. یک Branch جدید ایجاد کنید (`git checkout -b feature/amazing`)
3. Commit کنید (`git commit -m 'feat: add amazing feature'`)
4. Push کنید (`git push origin feature/amazing`)
5. Pull Request ایجاد کنید 🎉

</div>

---

## 📜 لایسنس

<div dir="rtl">

**پروژه شخصی** — تمامی حقوق محفوظ است.

</div>

---

<div dir="rtl" align="center">

ساخته شده با ❤️ در ایران

</div>
