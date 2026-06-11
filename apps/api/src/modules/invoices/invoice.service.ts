import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import * as PDFDocument from "pdfkit";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private fontRegular: string;
  private fontBold: string;

  constructor(private prisma: PrismaService) {
    const fontsDir = path.join(__dirname, "fonts");
    this.fontRegular = path.join(fontsDir, "Vazirmatn-NL-Regular.ttf");
    this.fontBold = path.join(fontsDir, "Vazirmatn-NL-Bold.ttf");

    if (!fs.existsSync(this.fontRegular)) {
      this.logger.warn(
        `Vazir font not found at ${this.fontRegular}, trying fallback`,
      );
      this.fontRegular = path.join(
        process.cwd(),
        "apps",
        "api",
        "src",
        "modules",
        "invoices",
        "fonts",
        "Vazirmatn-NL-Regular.ttf",
      );
      this.fontBold = path.join(
        process.cwd(),
        "apps",
        "api",
        "src",
        "modules",
        "invoices",
        "fonts",
        "Vazirmatn-NL-Bold.ttf",
      );
      if (!fs.existsSync(this.fontRegular)) {
        this.logger.warn(
          "Vazir font not found at fallback path either — PDF will use Helvetica",
        );
      }
    }
  }

  async generateInvoice(orderId: number, userId?: number): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: {
              select: { id: true, title: true, slug: true, images: true },
            },
          },
        },
        payments: true,
        address: true,
      },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (userId && order.userId !== userId)
      throw new ForbiddenException("Access denied");

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Invoice ${order.orderNumber}`,
          Author: "Atlas Shop",
          Subject: `صورتحساب ${order.orderNumber}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const hasFont = fs.existsSync(this.fontRegular);

      if (hasFont) {
        doc.registerFont("Vazir", this.fontRegular);
        doc.registerFont("Vazir-Bold", this.fontBold);
      }

      const font = hasFont ? "Vazir" : "Helvetica";
      const fontBold = hasFont ? "Vazir-Bold" : "Helvetica";

      // Header
      doc.fontSize(24).font(fontBold).text("اطلس شاپ", { align: "right" });
      doc.fontSize(14).font(font).text("صورتحساب", { align: "right" });
      doc.moveDown(0.5);

      // Separator line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#7c3aed").stroke();
      doc.moveDown(0.5);

      // Order info
      const paymentStatusLabels: Record<string, string> = {
        unpaid: "پرداخت نشده",
        paid: "پرداخت شده",
        failed: "ناموفق",
        refunded: "مسترد شده",
      };

      doc.fontSize(10).font(font);
      const orderInfo = [
        `شماره سفارش: ${order.orderNumber}`,
        `تاریخ: ${new Date(order.createdAt).toLocaleDateString("fa-IR")}`,
        `وضعیت پرداخت: ${paymentStatusLabels[order.paymentStatus] || order.paymentStatus}`,
      ];
      orderInfo.forEach((line) => doc.text(line, { align: "right" }));
      doc.moveDown(0.3);

      // Billing info
      const billingInfo = [
        `مشتری: ${order.user?.name || "—"}`,
        `شماره همراه: ${order.user?.phone || "—"}`,
      ];
      if (order.address) {
        billingInfo.push(
          `آدرس: ${order.address.province}، ${order.address.city}، ${order.address.addressText}`,
        );
      }
      doc.font(fontBold).text("اطلاعات صورتحساب", { align: "right" });
      doc.font(font).fontSize(9);
      billingInfo.forEach((line) => doc.text(line, { align: "right" }));

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ddd").stroke();
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      const col1 = 50; // #
      const col2 = 90; // name
      const col3 = 350; // qty
      const col4 = 410; // unit price
      const col5 = 480; // total
      const rowHeight = 18;

      doc.fontSize(9).font(fontBold);
      doc.text("ردیف", col1, tableTop, { width: 40, align: "center" });
      doc.text("نام کالا", col2, tableTop, { width: 260, align: "right" });
      doc.text("تعداد", col3, tableTop, { width: 60, align: "center" });
      doc.text("قیمت واحد", col4, tableTop, { width: 70, align: "left" });
      doc.text("مبلغ کل", col5, tableTop, { width: 65, align: "left" });

      doc
        .moveTo(50, tableTop + 16)
        .lineTo(545, tableTop + 16)
        .strokeColor("#7c3aed")
        .stroke();

      // Table rows
      doc.font(font).fontSize(9);
      let yPos = tableTop + 22;

      order.items.forEach((item, i) => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 50;
        }

        const title = item.product?.title || `Product #${item.productId}`;
        const unitPrice = item.price;
        const lineTotal = item.total || item.price.toNumber() * item.quantity;

        doc.text(String(i + 1), col1, yPos, { width: 40, align: "center" });
        doc.text(title, col2, yPos, { width: 260, align: "right" });
        doc.text(String(item.quantity), col3, yPos, {
          width: 60,
          align: "center",
        });
        doc.text(unitPrice.toLocaleString(), col4, yPos, {
          width: 70,
          align: "left",
        });
        doc.text(lineTotal.toLocaleString(), col5, yPos, {
          width: 65,
          align: "left",
        });

        yPos += rowHeight;
      });

      // Summary
      yPos += 10;
      doc.moveTo(350, yPos).lineTo(545, yPos).strokeColor("#ddd").stroke();
      yPos += 10;

      const summaryItems = [
        { label: "زیرمجموع", value: order.subtotal.toNumber().toLocaleString() },
        {
          label: "هزینه ارسال",
          value:
            order.shippingCost.equals(0)
              ? "رایگان"
              : `${order.shippingCost.toNumber().toLocaleString()}`,
        },
      ];

      if (order.taxAmount.greaterThan(0)) {
        summaryItems.push({
          label: "مالیات",
          value: order.taxAmount.toNumber().toLocaleString(),
        });
      }

      if (order.discount.greaterThan(0)) {
        summaryItems.push({
          label: "تخفیف",
          value: `-${order.discount.toNumber().toLocaleString()}`,
        });
      }

      summaryItems.forEach((item) => {
        doc
          .font(font)
          .fontSize(10)
          .text(item.label, 350, yPos, { width: 100, align: "right" });
        doc.text(item.value, 450, yPos, { width: 95, align: "left" });
        yPos += 16;
      });

      // Total
      yPos += 5;
      doc.moveTo(350, yPos).lineTo(545, yPos).strokeColor("#7c3aed").stroke();
      yPos += 10;
      doc
        .font(fontBold)
        .fontSize(12)
        .text("مبلغ قابل پرداخت", 350, yPos, { width: 100, align: "right" });
      doc.text(`${order.total.toNumber().toLocaleString()} ریال`, 450, yPos, {
        width: 95,
        align: "left",
      });

      // Footer
      const footerY = 780;
      doc.font(font).fontSize(9).fillColor("#999");
      doc.text("با تشکر از خرید شما", 50, footerY, {
        align: "center",
        width: 495,
      });
      doc.fillColor("#000");

      doc.end();
    });
  }
}
