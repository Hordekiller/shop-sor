import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  async getMyShop(userId: number) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerId: userId },
    });

    if (!shop) throw new NotFoundException("No shop found for this user");

    const [products, orders] = await Promise.all([
      this.prisma.product.count({ where: { shopId: shop.id } }),
      this.prisma.orderItem.count({
        where: { product: { shopId: shop.id } },
      }),
    ]);

    const orderItems = await this.prisma.orderItem.findMany({
      where: { product: { shopId: shop.id } },
      select: { price: true, quantity: true },
    });
    const totalRevenue = orderItems.reduce(
      (sum, item) => sum + item.price.toNumber() * item.quantity,
      0,
    );

    return {
      totalProducts: products,
      totalOrders: orders,
      totalRevenue,
      shop,
    };
  }

  async createShop(
    userId: number,
    body: { name: string; slug: string; description?: string },
  ) {
    const existing = await this.prisma.shop.findUnique({
      where: { ownerId: userId },
    });
    if (existing) throw new BadRequestException("User already has a shop");

    const slugExists = await this.prisma.shop.findUnique({
      where: { slug: body.slug },
    });
    if (slugExists) throw new BadRequestException("Shop slug already exists");

    return this.prisma.shop.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        ownerId: userId,
        isActive: true,
      },
    });
  }
}
