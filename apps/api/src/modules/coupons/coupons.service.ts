import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateCouponDto, UpdateCouponDto } from "./dto/create-coupon.dto";

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { usages: true } },
      },
    });
  }

  async findById(id: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        usages: {
          include: { user: true, order: true },
          orderBy: { usedAt: "desc" },
        },
      },
    });
    if (!coupon) throw new NotFoundException("Coupon not found");

    const totalDiscount = coupon.usages.reduce((sum, u) => sum + u.discount.toNumber(), 0);

    return {
      ...coupon,
      _stats: {
        usageCount: coupon.usages.length,
        totalDiscount,
      },
    };
  }

  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } });
    if (!coupon) throw new NotFoundException("Coupon not found");
    return coupon;
  }

  async validate(
    code: string,
    subtotal: number,
    userId?: number,
    productIds?: number[],
    categoryIds?: number[],
  ) {
    const coupon = await this.findByCode(code);

    if (!coupon.isActive) throw new BadRequestException("Coupon is inactive");

    if (coupon.startsAt && new Date() < coupon.startsAt) {
      throw new BadRequestException("Coupon has not started yet");
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new BadRequestException("Coupon has expired");
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException("Coupon usage limit reached");
    }

    if (userId) {
      const userUsageCount = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (userUsageCount >= coupon.maxUsesPerUser) {
        throw new BadRequestException(
          "You have reached the usage limit for this coupon",
        );
      }
    }

    if (subtotal < coupon.minOrder.toNumber()) {
      throw new BadRequestException(
        `Minimum order amount is ${coupon.minOrder}`,
      );
    }

    const applicableProducts: number[] = Array.isArray(
      coupon.applicableProducts,
    )
      ? coupon.applicableProducts as unknown as number[]
      : [];
    if (applicableProducts.length > 0 && productIds && productIds.length > 0) {
      const hasMatch = productIds.some((pid) =>
        applicableProducts.includes(pid),
      );
      if (!hasMatch)
        throw new BadRequestException(
          "Coupon does not apply to any product in your cart",
        );
    }

    const applicableCategories: number[] = Array.isArray(
      coupon.applicableCategories,
    )
      ? coupon.applicableCategories as unknown as number[]
      : [];
    if (
      applicableCategories.length > 0 &&
      categoryIds &&
      categoryIds.length > 0
    ) {
      const hasMatch = categoryIds.some((cid) =>
        applicableCategories.includes(cid),
      );
      if (!hasMatch)
        throw new BadRequestException(
          "Coupon does not apply to any category in your cart",
        );
    }

    let discount: number;
    if (coupon.type === "PERCENT") {
      discount = (subtotal * coupon.value.toNumber()) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount.toNumber()) {
        discount = coupon.maxDiscountAmount.toNumber();
      }
    } else if (coupon.type === "FIXED") {
      discount = Math.min(coupon.value.toNumber(), subtotal);
    } else {
      discount = 0;
    }

    return {
      valid: true,
      discount,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      couponId: coupon.id,
    };
  }

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new BadRequestException("Coupon code already exists");

    return this.prisma.coupon.create({
      data: {
        code: dto.code,
        type: dto.type as any,
        value: dto.value,
        minOrder: dto.minOrder ?? 0,
        maxUsesPerUser: dto.maxUsesPerUser ?? 1,
        maxUses: dto.maxUses,
        maxDiscountAmount: dto.maxDiscountAmount,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        applicableProducts: dto.applicableProducts ?? [],
        applicableCategories: dto.applicableCategories ?? [],
      },
    });
  }

  async update(id: number, dto: UpdateCouponDto) {
    await this.findById(id);

    const data: any = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.minOrder !== undefined) data.minOrder = dto.minOrder;
    if (dto.maxUsesPerUser !== undefined)
      data.maxUsesPerUser = dto.maxUsesPerUser;
    if (dto.maxUses !== undefined) data.maxUses = dto.maxUses;
    if (dto.maxDiscountAmount !== undefined)
      data.maxDiscountAmount = dto.maxDiscountAmount;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt !== undefined) data.expiresAt = new Date(dto.expiresAt);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.applicableProducts !== undefined)
      data.applicableProducts = dto.applicableProducts;
    if (dto.applicableCategories !== undefined)
      data.applicableCategories = dto.applicableCategories;

    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  async getStats(id: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: { select: { usages: true } },
        usages: {
          take: 20,
          orderBy: { usedAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            order: { select: { id: true, orderNumber: true } },
          },
        },
      },
    });
    if (!coupon) throw new NotFoundException("Coupon not found");

    const aggregation = await this.prisma.couponUsage.aggregate({
      where: { couponId: id },
      _sum: { discount: true },
    });

    return {
      totalUsages: coupon._count.usages,
      totalDiscount: aggregation._sum.discount ?? 0,
      usages: coupon.usages.map((u) => ({
        id: u.id,
        discount: u.discount,
        usedAt: u.usedAt,
        user: { name: u.user.name },
        order: { orderNumber: u.order.orderNumber },
      })),
    };
  }
}
