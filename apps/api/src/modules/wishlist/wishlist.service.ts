import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async add(userId: number, productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });
    if (!product) throw new NotFoundException("Product not found");

    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) throw new ConflictException("Already in wishlist");

    return this.prisma.wishlist.create({ data: { userId, productId } });
  }

  async remove(userId: number, productId: number) {
    const item = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!item) throw new NotFoundException("Not in wishlist");

    return this.prisma.wishlist.delete({ where: { id: item.id } });
  }

  async findAll(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.wishlist.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
              _count: { select: { reviews: true } },
            },
          },
        },
      }),
      this.prisma.wishlist.count({ where: { userId } }),
    ]);

    const products = data.map((w) => {
      const p: any = { ...w.product };
      if (typeof p.images === "string") {
        try {
          p.images = JSON.parse(p.images);
        } catch {
          p.images = [];
        }
      }
      return { id: w.id, createdAt: w.createdAt, product: p };
    });

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isWishlisted(userId: number, productIds: number[]) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId, productId: { in: productIds } },
      select: { productId: true },
    });
    return new Set(items.map((i) => i.productId));
  }
}
