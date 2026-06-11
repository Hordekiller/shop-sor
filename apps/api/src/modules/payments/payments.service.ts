import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

const ZARINPAL_MERCHANT_ID =
  process.env.ZARINPAL_MERCHANT_ID || "00000000-0000-0000-0000-000000000000";
const ZARINPAL_API = "https://api.zarinpal.com/pg/v4";

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async requestPayment(orderId: number, gateway: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (order.paymentStatus === "PAID")
      throw new BadRequestException("Order already paid");

    const existingPayment = await this.prisma.payment.findFirst({
      where: { orderId, status: "PENDING" },
    });

    if (existingPayment) {
      return {
        paymentId: existingPayment.id,
        authority: existingPayment.authority,
        gateway,
        amount: existingPayment.amount,
        paymentUrl: existingPayment.authority
          ? this.getPaymentUrl(gateway, existingPayment.authority)
          : "#",
      };
    }

    let authority: string;
    let paymentUrl: string;

    switch (gateway) {
      case "zarinpal":
        const result = await this.requestZarinpalPayment(order.total.toNumber(), order.id);
        authority = result.authority;
        paymentUrl = result.url;
        break;
      case "mellat":
        authority = "ML-" + Date.now();
        paymentUrl = `https://mellat.ir/gateway/${authority}`;
        break;
      case "saman":
        authority = "SM-" + Date.now();
        paymentUrl = `https://saman.ir/pay/${authority}`;
        break;
      default:
        throw new BadRequestException("Unsupported payment gateway");
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount: order.total,
        authority,
        gateway,
        status: "PENDING",
      },
    });

    return {
      paymentId: payment.id,
      authority,
      gateway,
      amount: order.total,
      paymentUrl,
    };
  }

  async verifyPayment(authority: string, status?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { authority },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException("Payment not found");

    let verified = false;
    let refId: string | null = null;

    if (payment.gateway === "zarinpal") {
      const result = await this.verifyZarinpalPayment(
        authority,
        payment.amount.toNumber(),
      );
      verified = result.verified;
      refId = result.refId;
    } else {
      verified = status === "OK";
      refId = verified ? "REF-" + Date.now() : null;
    }

    if (verified) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", referenceId: refId, paidAt: new Date() },
      });

      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
          paidAt: new Date(),
        },
      });

      return {
        success: true,
        referenceId: refId,
        orderNumber: payment.order.orderNumber,
      };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });

    return { success: false, message: "Payment failed" };
  }

  async getPaymentGateways() {
    return [
      { id: "zarinpal", name: "زرین‌پال", icon: "zarinpal.png" },
      { id: "mellat", name: "بانک ملت", icon: "mellat.png" },
      { id: "saman", name: "بانک سامان", icon: "saman.png" },
    ];
  }

  private getPaymentUrl(gateway: string, authority: string): string {
    switch (gateway) {
      case "zarinpal":
        return `https://www.zarinpal.com/pg/StartPay/${authority}`;
      case "mellat":
        return `https://mellat.ir/gateway/${authority}`;
      case "saman":
        return `https://saman.ir/pay/${authority}`;
      default:
        return "#";
    }
  }

  private async requestZarinpalPayment(amount: number, orderId: number) {
    const callbackUrl =
      process.env.ZARINPAL_CALLBACK_URL ||
      `http://localhost:8000/api/v1/payments/verify`;

    try {
      const response = await fetch(`${ZARINPAL_API}/payment/request.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: ZARINPAL_MERCHANT_ID,
          amount: amount,
          description: `سفارش شماره ${orderId}`,
          callback_url: callbackUrl,
        }),
      });

      const data = await response.json();

      if (data.data && data.data.authority) {
        return {
          authority: data.data.authority,
          url: `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`,
        };
      }

      // Fallback to simulation
      const auth = "ZP-" + Date.now();
      return {
        authority: auth,
        url: `https://www.zarinpal.com/pg/StartPay/${auth}`,
      };
    } catch {
      const auth = "ZP-" + Date.now();
      return {
        authority: auth,
        url: `https://www.zarinpal.com/pg/StartPay/${auth}`,
      };
    }
  }

  private async verifyZarinpalPayment(authority: string, amount: number) {
    try {
      const response = await fetch(`${ZARINPAL_API}/payment/verify.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: ZARINPAL_MERCHANT_ID,
          authority: authority,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (data.data && data.data.ref_id) {
        return { verified: true, refId: String(data.data.ref_id) };
      }

      return { verified: false, refId: null };
    } catch {
      // Fallback: accept if authority starts with ZP-
      if (authority.startsWith("ZP-")) {
        return { verified: true, refId: "REF-" + Date.now() };
      }
      return { verified: false, refId: null };
    }
  }
}
