import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class NotificationTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: { type: "asc" },
    });
  }

  async findByType(type: string) {
    return this.prisma.notificationTemplate.findUnique({ where: { type } });
  }

  async create(data: {
    type: string;
    titleTemplate: string;
    messageTemplate?: string;
    emailSubject?: string;
    emailHtml?: string;
    smsTemplate?: string;
    channels?: string;
    isActive?: boolean;
  }) {
    return this.prisma.notificationTemplate.create({ data });
  }

  async update(
    type: string,
    data: {
      titleTemplate?: string;
      messageTemplate?: string;
      emailSubject?: string;
      emailHtml?: string;
      smsTemplate?: string;
      channels?: string;
      isActive?: boolean;
    },
  ) {
    const existing = await this.findByType(type);
    if (!existing) throw new NotFoundException("Template not found");
    return this.prisma.notificationTemplate.update({ where: { type }, data });
  }

  async remove(type: string) {
    const existing = await this.findByType(type);
    if (!existing) throw new NotFoundException("Template not found");
    return this.prisma.notificationTemplate.delete({ where: { type } });
  }

  render(template: string, vars: Record<string, string | number>): string {
    return template.replace(/{(\w+)}/g, (_, key) =>
      String(vars[key] ?? `{${key}}`),
    );
  }

  async renderNotification(
    type: string,
    vars: Record<string, string | number>,
  ): Promise<{ title: string; message?: string; channels: string[] } | null> {
    const tpl = await this.prisma.notificationTemplate.findUnique({
      where: { type },
    });
    if (!tpl || !tpl.isActive) return null;

    return {
      title: this.render(tpl.titleTemplate, vars),
      message: tpl.messageTemplate
        ? this.render(tpl.messageTemplate, vars)
        : undefined,
      channels: (tpl.channels || "in_app,email")
        .split(",")
        .map((c) => c.trim()),
    };
  }

  async renderEmail(
    type: string,
    vars: Record<string, string | number>,
  ): Promise<{ subject: string; html: string } | null> {
    const tpl = await this.prisma.notificationTemplate.findUnique({
      where: { type },
    });
    if (!tpl || !tpl.emailHtml) return null;

    return {
      subject: tpl.emailSubject
        ? this.render(tpl.emailSubject, vars)
        : "اطلس شاپ",
      html: this.render(tpl.emailHtml, vars),
    };
  }

  // Seed defaults if none exist
  async seedDefaults() {
    const count = await this.prisma.notificationTemplate.count();
    if (count > 0) return;

    const defaults = [
      {
        type: "order_confirmed",
        titleTemplate: "سفارش {orderNumber} ثبت شد ✅",
        messageTemplate:
          "سفارش شما با مبلغ {amount} تومان ثبت و در انتظار پرداخت است.",
        emailSubject: "تأیید سفارش {orderNumber} — اطلس شاپ",
        emailHtml: `<div style="font-family:Tahoma,sans-serif;max-width:600px;margin:auto;padding:24px;">
<h2 style="color:#ef4056;">سفارش شما ثبت شد ✅</h2>
<p>سلام {userName}،</p>
<p>سفارش شما با شماره <strong>{orderNumber}</strong> با موفقیت ثبت شد.</p>
<p>مبلغ کل: <strong>{amount} تومان</strong></p>
<p>به محض تغییر وضعیت سفارش، از طریق اطلاع‌رسانی به شما خبر می‌دهیم.</p>
<hr style="margin:24px 0;border:none;border-top:1px solid #e0e0e6;" />
<p style="color:#81858b;font-size:12px;">اطلس شاپ — فروشگاه اینترنتی</p>
</div>`,
        channels: "in_app,email",
      },
      {
        type: "order_paid",
        titleTemplate: "پرداخت سفارش {orderNumber} تأیید شد ✅",
        messageTemplate:
          "پرداخت سفارش {orderNumber} به مبلغ {amount} تومان با موفقیت انجام شد.",
        emailSubject: "پرداخت سفارش {orderNumber} تأیید شد — اطلس شاپ",
        emailHtml: `<div style="font-family:Tahoma,sans-serif;max-width:600px;margin:auto;padding:24px;">
<h2 style="color:#ef4056;">پرداخت تأیید شد ✅</h2>
<p>سلام {userName}،</p>
<p>پرداخت سفارش <strong>{orderNumber}</strong> به مبلغ <strong>{amount} تومان</strong> با موفقیت انجام شد.</p>
<p>سفارش شما در اسرع وقت پردازش خواهد شد.</p>
<hr style="margin:24px 0;border:none;border-top:1px solid #e0e0e6;" />
<p style="color:#81858b;font-size:12px;">اطلس شاپ — فروشگاه اینترنتی</p>
</div>`,
        channels: "in_app,email",
      },
      {
        type: "order_status_change",
        titleTemplate: "وضعیت سفارش {orderNumber} به‌روز شد 🔔",
        messageTemplate:
          "وضعیت سفارش {orderNumber} به {statusLabel} تغییر کرد.",
        emailSubject: "بروزرسانی وضعیت سفارش {orderNumber} — اطلس شاپ",
        emailHtml: `<div style="font-family:Tahoma,sans-serif;max-width:600px;margin:auto;padding:24px;">
<h2 style="color:#ef4056;">بروزرسانی وضعیت سفارش 🔔</h2>
<p>سلام {userName}،</p>
<p>وضعیت سفارش <strong>{orderNumber}</strong> به <strong>{statusLabel}</strong> تغییر کرد.</p>
<hr style="margin:24px 0;border:none;border-top:1px solid #e0e0e6;" />
<p style="color:#81858b;font-size:12px;">اطلس شاپ — فروشگاه اینترنتی</p>
</div>`,
        channels: "in_app,email",
      },
      {
        type: "order_cancelled",
        titleTemplate: "سفارش {orderNumber} لغو شد ❌",
        messageTemplate: "سفارش {orderNumber} با مبلغ {amount} تومان لغو شد.",
        channels: "in_app",
      },
      {
        type: "stock_alert",
        titleTemplate: "{productName} موجود شد 🎉",
        messageTemplate: "محصول {productName} که منتظر آن بودید، موجود شد.",
        channels: "in_app",
      },
    ];

    for (const tpl of defaults) {
      await this.prisma.notificationTemplate.create({ data: tpl });
    }
  }
}
