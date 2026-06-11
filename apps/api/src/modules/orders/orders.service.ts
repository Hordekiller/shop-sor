import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== dto.items.length) {
      throw new BadRequestException('Some products not found or inactive');
    }

    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId)!;

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for "${product.title}"`);
      }

      const price = product.salePrice || product.price;
      const total = price * item.quantity;
      subtotal += total;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price,
        total,
      });
    }

    let discount = 0;
    let couponId: number | null = null;

    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode },
      });

      if (!coupon || !coupon.isActive) {
        throw new BadRequestException('Invalid coupon code');
      }

      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        throw new BadRequestException('Coupon has expired');
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new BadRequestException('Coupon usage limit reached');
      }

      if (subtotal < coupon.minOrder) {
        throw new BadRequestException(`Minimum order amount for this coupon is ${coupon.minOrder}`);
      }

      if (coupon.type === 'percent') {
        discount = (subtotal * coupon.value) / 100;
      } else {
        discount = Math.min(coupon.value, subtotal);
      }

      couponId = coupon.id;

      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const shippingCost = dto.shippingMethod ? await this.calculateShipping(dto.shippingMethod, subtotal) : 0;

    const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        subtotal,
        shippingCost,
        discount,
        total: subtotal + shippingCost - discount,
        shippingMethod: dto.shippingMethod,
        notes: dto.notes,
        userId,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });

    for (const item of dto.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return order;
  }

  async findAll(query: { page?: number; limit?: number; status?: string; userId?: number }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: { select: { id: true, title: true, slug: true } } } },
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number, userId?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
        payments: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (userId && order.userId !== userId) throw new ForbiddenException('Access denied');

    return order;
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: true } }, payments: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    await this.findById(id);
    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async getUserOrders(userId: number, page = 1, limit = 20) {
    return this.findAll({ userId, page, limit });
  }

  private async calculateShipping(method: string, subtotal: number): Promise<number> {
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
