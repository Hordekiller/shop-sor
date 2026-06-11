import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class StockAlertsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, productId: number, variantId = 0) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException("Product not found");

    const effectiveStock = variantId
      ? ((
          await this.prisma.productVariant.findUnique({
            where: { id: variantId },
          })
        )?.stock ?? product.stock)
      : product.stock;

    if (effectiveStock > 0) {
      throw new BadRequestException("Product is already in stock");
    }

    const existing = await this.prisma.stockAlert.findUnique({
      where: { userId_productId_variantId: { userId, productId, variantId } },
    });

    if (existing) return existing;

    return this.prisma.stockAlert.create({
      data: { userId, productId, variantId },
    });
  }

  async remove(userId: number, id: number) {
    const alert = await this.prisma.stockAlert.findUnique({ where: { id } });
    if (!alert || alert.userId !== userId)
      throw new NotFoundException("Stock alert not found");
    return this.prisma.stockAlert.delete({ where: { id } });
  }

  async findMyAlerts(userId: number) {
    const alerts = await this.prisma.stockAlert.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            stock: true,
            images: true,
            price: true,
            salePrice: true,
          },
        },
      },
    });

    return alerts.map((a) => ({
      id: a.id,
      productId: a.productId,
      variantId: a.variantId || undefined,
      notified: a.notified,
      createdAt: a.createdAt,
      product: {
        ...a.product,
        images: Array.isArray(a.product.images) ? a.product.images : [],
      },
    }));
  }
}
