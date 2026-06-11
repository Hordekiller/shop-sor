import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CouponsService } from "../coupons/coupons.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EmailService } from "../email/email.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private couponsService: CouponsService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    if (!dto.agreedToTerms) {
      throw new BadRequestException("باید قوانین و مقررات را تأیید کنید");
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException("Some products not found or inactive");
    }

    let subtotal = 0;
    const orderItems: any[] = [];

    // Phase 1: validate prices and stock (outside transaction)
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId)!;

      const discountValid =
        product.salePrice != null &&
        (!product.discountStartAt || product.discountStartAt <= new Date()) &&
        (!product.discountEndAt || product.discountEndAt >= new Date());
      let price =
        discountValid && product.salePrice != null
          ? product.salePrice
          : product.price;

      let stock = product.stock;
      let variantName: string | null = null;

      if (item.variantId) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
        });
        if (!variant || variant.productId !== product.id || !variant.isActive) {
          throw new BadRequestException(
            `Variant #${item.variantId} not found for "${product.title}"`,
          );
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant "${variant.name}" of "${product.title}"`,
          );
        }
        if (variant.price != null) price = variant.price;
        stock = variant.stock;
        variantName = variant.name;
      }

      if (stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.title}"`,
        );
      }

      const total = price.toNumber() * item.quantity;
      subtotal += total;

      orderItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        variantName,
        quantity: item.quantity,
        price,
        total,
      });
    }

    let discount = 0;
    let couponId: number | null = null;

    if (dto.couponCode) {
      const orderProductIds = dto.items.map((i) => i.productId);
      const orderCategoryIds = [...new Set(products.map((p) => p.categoryId))];
      const result = await this.couponsService.validate(
        dto.couponCode,
        subtotal,
        userId,
        orderProductIds,
        orderCategoryIds,
      );
      discount = result.discount;
      couponId = result.couponId;
    }

    const shippingCost = dto.shippingMethod
      ? await this.calculateShipping(dto.shippingMethod, subtotal)
      : 0;

    // Read tax percent from ShopSettings
    let taxPercent = 0;
    const shopSettings = await this.prisma.shopSettings.findUnique({
      where: { id: "singleton" },
    });
    if (shopSettings) taxPercent = shopSettings.taxPercent || 0;
    const tax = Math.round((subtotal * taxPercent) / 100);

    const total = subtotal + shippingCost + tax - discount;

    // Handle wallet payment
    let walletAmount = 0;
    if (dto.useWallet) {
      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      if (wallet && wallet.balance.greaterThan(0)) {
        walletAmount = Math.min(wallet.balance.toNumber(), total);
      }
    }

    const orderNumber =
      "ORD-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // Phase 2: atomic order creation + stock decrement + wallet
    const order = await this.prisma.$transaction(async (tx) => {
      // Re-check and decrement stock atomically
      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `موجودی "${product?.title || item.productId}" کافی نیست`,
          );
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (!variant || variant.stock < item.quantity) {
            throw new BadRequestException(`موجودی variant کافی نیست`);
          }
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        await tx.stockMovement.create({
          data: {
            type: "OUT",
            quantity: -item.quantity,
            reason: "فروش",
            stockAfter: product.stock - item.quantity,
            productId: item.productId,
            variantId: item.variantId || null,
            createdBy: userId,
          },
        });
      }

      // Deduct from wallet if applicable
      if (walletAmount > 0) {
        await tx.wallet.update({
          where: { userId },
          data: { balance: { decrement: walletAmount } },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: (await tx.wallet.findUnique({ where: { userId } }))!.id,
            amount: -walletAmount,
            type: "PAYMENT",
            description: "پرداخت سفارش",
            refType: "order",
            balanceAfter:
              (await tx.wallet.findUnique({ where: { userId } }))!.balance.minus(walletAmount),
          },
        });
      }

      // Create order
      const created = await tx.order.create({
        data: {
          orderNumber,
          subtotal,
          shippingCost,
          taxAmount: tax,
          discount,
          total,
          paymentMethod: dto.paymentMethod || "zarinpal",
          paymentStatus: walletAmount >= total ? "PAID" : "UNPAID",
          shippingMethod: dto.shippingMethod,
          notes: dto.notes,
          userId,
          addressId: dto.addressId || null,
          items: { create: orderItems },
          ...(walletAmount >= total
            ? { paidAt: new Date(), status: "PROCESSING" }
            : {}),
        },
        include: { items: { include: { product: true } } },
      });

      // Coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: {
            usedCount: { increment: 1 },
            totalDiscount: { increment: discount },
          },
        });
        await tx.couponUsage.create({
          data: { couponId, userId, orderId: created.id, discount },
        });
      }

      return created;
    });

    // Clear cart items for these products
    await this.prisma.cartItem.deleteMany({
      where: {
        userId,
        productId: { in: productIds },
      },
    });

    // Send notifications
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.notificationsService.create(
        userId,
        "order_confirmed",
        `سفارش ${orderNumber} ثبت شد ✅`,
        `سفارش شما با مبلغ ${total.toLocaleString()} تومان ثبت و در انتظار پرداخت است.`,
        `/orders/${order.id}`,
        { orderNumber, amount: total, userName: user.name },
      );
      if (user.email) {
        this.emailService
          .sendOrderConfirmation(user.email, orderNumber, user.name, total)
          .catch(() => {});
      }
    }

    return order;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: number;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, title: true, slug: true } },
              variant: { select: { id: true, name: true } },
            },
          },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number, userId?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: true,
            variant: { select: { id: true, name: true } },
          },
        },
        payments: true,
        address: true,
      },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (userId && order.userId !== userId)
      throw new ForbiddenException("Access denied");

    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: true } }, payments: true },
    });

    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  private static readonly VALID_TRANSITIONS: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered", "returned"],
    delivered: ["returned"],
    cancelled: [],
    returned: [],
  };

  async updateStatus(id: number, dto: UpdateOrderStatusDto, userId?: number) {
    const order = await this.findById(id);

    if (order.status === dto.status) return order;

    const allowed = OrdersService.VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from "${order.status}" to "${dto.status}". Allowed: ${allowed?.join(", ") || "none"}`,
      );
    }

    // Restore stock on cancellation or return
    if (
      (dto.status === "CANCELLED" || dto.status === "returned") &&
      order.status !== "CANCELLED"
    ) {
      for (const item of order.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        if (item.variantId) {
          await this.prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await this.prisma.stockMovement.create({
          data: {
            type: "IN",
            quantity: item.quantity,
            reason: dto.status === "CANCELLED" ? "لغو سفارش" : "مرجوعی",
            stockAfter: (await this.prisma.product.findUnique({
              where: { id: item.productId },
              select: { stock: true },
            }))!.stock,
            productId: item.productId,
            variantId: item.variantId || null,
            orderId: order.id,
            createdBy: userId || order.userId,
          },
        });
      }
    }

    const updateData: any = { status: dto.status };

    if (dto.trackingCode) {
      updateData.trackingCode = dto.trackingCode;
    }

    if (dto.status === "delivered") {
      updateData.deliveredAt = new Date();
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    // Send notification on status change
    const orderUser = await this.prisma.user.findUnique({
      where: { id: order.userId },
    });
    if (orderUser) {
      const statusMessages: Record<string, string> = {
        confirmed: "سفارش شما تأیید شد ✅",
        processing: "سفارش شما در حال پردازش است 📦",
        shipped: "سفارش شما ارسال شد 🚚",
        delivered: "سفارش شما تحویل داده شد 🎉",
        cancelled: "سفارش شما لغو شد ❌",
        returned: "سفارش شما مرجوع شد ↩️",
      };
      const notifTitle =
        statusMessages[dto.status] || `وضعیت سفارش به ${dto.status} تغییر کرد`;
      const statusLabel =
        statusMessages[dto.status]?.replace(/[✅❌↩️🔔]/g, "").trim() ||
        dto.status;
      const notifType =
        dto.status === "cancelled" ? "order_cancelled" : "order_status_change";
      await this.notificationsService.create(
        order.userId,
        notifType,
        notifTitle,
        `وضعیت سفارش ${order.orderNumber} به‌روز شد.`,
        `/orders/${order.id}`,
        {
          orderNumber: order.orderNumber,
          status: dto.status,
          statusLabel,
          amount: order.total.toNumber(),
          userName: orderUser?.name || "",
        },
      );
      if (orderUser.email && dto.status !== "pending") {
        this.emailService
          .sendOrderStatusUpdate(
            orderUser.email,
            order.orderNumber,
            dto.status,
            orderUser.name,
          )
          .catch(() => {});
      }
    }

    return updated;
  }

  async cancel(id: number, userId: number) {
    const order = await this.findById(id, userId);
    const cancellable = ["pending", "confirmed"];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestException("Order cannot be cancelled at this stage");
    }
    return this.updateStatus(id, { status: "cancelled" }, userId);
  }

  async getUserOrders(userId: number, page = 1, limit = 20) {
    return this.findAll({ userId, page, limit });
  }

  private async calculateShipping(
    method: string,
    subtotal: number,
  ): Promise<number> {
    const rates: Record<string, number> = {
      post_pishtaz: 150000,
      post_sefareshi: 80000,
      tipax: 200000,
      mahax: 180000,
      snapp_box: 120000,
    };

    const freeShippingThreshold = 5000000;
    if (subtotal >= freeShippingThreshold) return 0;

    return rates[method] || 0;
  }
}
