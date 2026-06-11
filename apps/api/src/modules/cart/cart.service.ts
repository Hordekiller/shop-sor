import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            salePrice: true,
            discountStartAt: true,
            discountEndAt: true,
            stock: true,
            minOrderQty: true,
            maxOrderQty: true,
            images: true,
            isActive: true,
            status: true,
            weight: true,
          },
        },
      },
    });

    const variantIds = [
      ...new Set(items.filter((i) => i.variantId > 0).map((i) => i.variantId)),
    ];
    const variants =
      variantIds.length > 0
        ? await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              images: true,
            },
          })
        : [];
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const now = new Date();

    return items.map((item) => {
      let images: string[] = [];
      images = Array.isArray(item.product.images) ? item.product.images as unknown as string[] : [];
      const variant =
        item.variantId > 0 ? variantMap.get(item.variantId) : undefined;

      const variantImages: string[] = [];
      if (Array.isArray(variant?.images)) {
        variantImages.push(...(variant.images as unknown as string[]));
      }

      const basePrice =
        variant?.price ?? item.product.salePrice ?? item.product.price;
      const discountValid =
        item.product.salePrice != null &&
        (!item.product.discountStartAt ||
          item.product.discountStartAt <= now) &&
        (!item.product.discountEndAt || item.product.discountEndAt >= now);

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId || undefined,
        variantName: variant?.name ?? null,
        title: item.product.title,
        price: discountValid ? basePrice : (item.product.price ?? basePrice),
        image: variantImages[0] ?? images[0] ?? null,
        quantity: item.quantity,
        stock: variant?.stock ?? item.product.stock,
        slug: item.product.slug,
        isActive: item.product.isActive,
        minOrderQty: item.product.minOrderQty,
        maxOrderQty: item.product.maxOrderQty,
        weight: item.product.weight ?? 0,
      };
    });
  }

  async add(userId: number, productId: number, variantId = 0, quantity = 1) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    if (product.status === "OUT_OF_STOCK")
      throw new BadRequestException("Product is out of stock");

    let variantStock = product.stock;
    const variantMaxOrderQty = product.maxOrderQty;

    if (variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant || !variant.isActive)
        throw new NotFoundException("Variant not found");
      variantStock = variant.stock;
    }

    const minQty = product.minOrderQty;
    const maxQty = variantId
      ? variantMaxOrderQty || variantStock || 99
      : product.maxOrderQty || product.stock || 99;

    const clampedQty = Math.max(minQty, Math.min(quantity, maxQty));

    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_productId_variantId: { userId, productId, variantId } },
    });

    const newQty = existing ? existing.quantity + clampedQty : clampedQty;

    if (newQty > variantStock) {
      throw new BadRequestException(
        `Only ${variantStock} items available in stock. You already have ${existing?.quantity || 0} in cart.`,
      );
    }

    if (newQty < minQty) {
      throw new BadRequestException(`Minimum order quantity is ${minQty}`);
    }

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(newQty, 99) },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId,
        variantId,
        quantity: Math.min(clampedQty, 99),
      },
    });
  }

  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
    variantId = 0,
  ) {
    const item = await this.prisma.cartItem.findUnique({
      where: { userId_productId_variantId: { userId, productId, variantId } },
    });
    if (!item) throw new NotFoundException("Item not found in cart");

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

    if (quantity > effectiveStock) {
      throw new BadRequestException(
        `Only ${effectiveStock} items available in stock`,
      );
    }

    if (quantity < product.minOrderQty) {
      throw new BadRequestException(
        `Minimum order quantity is ${product.minOrderQty}`,
      );
    }

    return this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.max(1, Math.min(quantity, 99)) },
    });
  }

  async remove(userId: number, productId: number, variantId = 0) {
    const item = await this.prisma.cartItem.findUnique({
      where: { userId_productId_variantId: { userId, productId, variantId } },
    });
    if (!item) throw new NotFoundException("Item not found in cart");

    return this.prisma.cartItem.delete({ where: { id: item.id } });
  }

  async clear(userId: number) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }

  async count(userId: number) {
    return this.prisma.cartItem.count({ where: { userId } });
  }

  // ─── Save for Later ─────────────────────────────────────

  async saveForLater(userId: number, productId: number, variantId = 0) {
    const item = await this.prisma.cartItem.findUnique({
      where: { userId_productId_variantId: { userId, productId, variantId } },
    });
    if (!item) throw new NotFoundException("Item not found in cart");
    await this.prisma.cartItem.delete({ where: { id: item.id } });

    const existing = await this.prisma.savedItem.findUnique({
      where: { userId_productId_variantId: { userId, productId, variantId } },
    });
    if (!existing) {
      await this.prisma.savedItem.create({
        data: { userId, productId, variantId },
      });
    }
    return { saved: true };
  }

  async getSavedItems(userId: number) {
    const items = await this.prisma.savedItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            salePrice: true,
            discountStartAt: true,
            discountEndAt: true,
            stock: true,
            images: true,
            isActive: true,
            status: true,
          },
        },
      },
    });

    const variantIds = [
      ...new Set(items.filter((i) => i.variantId > 0).map((i) => i.variantId)),
    ];
    const variants =
      variantIds.length > 0
        ? await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              images: true,
            },
          })
        : [];
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const now = new Date();
    return items.map((item) => {
      let images: string[] = [];
      images = Array.isArray(item.product.images) ? item.product.images as unknown as string[] : [];
      const variant =
        item.variantId > 0 ? variantMap.get(item.variantId) : undefined;
      const variantImages: string[] = [];
      if (Array.isArray(variant?.images)) {
        variantImages.push(...(variant.images as unknown as string[]));
      }

      const basePrice =
        variant?.price ?? item.product.salePrice ?? item.product.price;
      const discountValid =
        item.product.salePrice != null &&
        (!item.product.discountStartAt ||
          item.product.discountStartAt <= now) &&
        (!item.product.discountEndAt || item.product.discountEndAt >= now);

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId || undefined,
        variantName: variant?.name ?? null,
        title: item.product.title,
        price: discountValid ? basePrice : (item.product.price ?? basePrice),
        image: variantImages[0] ?? images[0] ?? null,
        stock: variant?.stock ?? item.product.stock,
        slug: item.product.slug,
        isActive: item.product.isActive,
      };
    });
  }

  async moveToCart(userId: number, productId: number, variantId = 0) {
    const saved = await this.prisma.savedItem.findUnique({
      where: { userId_productId_variantId: { userId, productId, variantId } },
    });
    if (!saved) throw new NotFoundException("Saved item not found");
    await this.prisma.savedItem.delete({ where: { id: saved.id } });

    await this.add(userId, productId, variantId, 1);
    return { moved: true };
  }
}
