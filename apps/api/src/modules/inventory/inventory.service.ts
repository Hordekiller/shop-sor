import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getMovements(productId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          creator: { select: { id: true, name: true } },
          variant: { select: { id: true, name: true } },
        },
      }),
      this.prisma.stockMovement.count({ where: { productId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllProducts(page = 1, limit = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          sku: true,
          stock: true,
          lowStockThreshold: true,
          price: true,
          salePrice: true,
          isActive: true,
          images: true,
          category: { select: { id: true, name: true } },
          _count: { select: { stockMovements: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adjustStock(
    productId: number,
    type: string,
    quantity: number,
    reason: string,
    userId: number,
    variantId?: number,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException("Product not found");

    let stockChange = quantity;
    if (type === "OUT") stockChange = -Math.abs(quantity);
    else if (type === "IN") stockChange = Math.abs(quantity);
    // ADJUSTMENT uses the exact quantity (could be negative or positive)

    const newStock = product.stock + stockChange;

    await this.prisma.product.update({
      where: { id: productId },
      data: { stock: Math.max(0, newStock) },
    });

    if (variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      if (variant) {
        const newVariantStock = variant.stock + stockChange;
        await this.prisma.productVariant.update({
          where: { id: variantId },
          data: { stock: Math.max(0, newVariantStock) },
        });
      }
    }

    return this.prisma.stockMovement.create({
      data: {
        type: type as any,
        quantity: stockChange,
        reason,
        stockAfter: Math.max(0, newStock),
        productId,
        variantId: variantId || null,
        createdBy: userId,
      },
    });
  }

  async recordOrderMovement(
    productId: number,
    orderId: number,
    userId: number,
    quantity: number,
    variantId?: number,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return null;

    return this.prisma.stockMovement.create({
      data: {
        type: "OUT",
        quantity: -Math.abs(quantity),
        reason: "فروش",
        stockAfter: product.stock,
        productId,
        variantId: variantId || null,
        orderId,
        createdBy: userId,
      },
    });
  }

  async recordCancelMovement(
    productId: number,
    orderId: number,
    userId: number,
    quantity: number,
    variantId?: number,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return null;

    return this.prisma.stockMovement.create({
      data: {
        type: "IN",
        quantity: Math.abs(quantity),
        reason: "لغو سفارش",
        stockAfter: product.stock,
        productId,
        variantId: variantId || null,
        orderId,
        createdBy: userId,
      },
    });
  }
}
