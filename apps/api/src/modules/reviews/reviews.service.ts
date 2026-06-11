import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

interface CreateReviewDto {
  productId: number;
  orderId?: number;
  rating: number;
  title?: string;
  comment?: string;
  pros?: string | string[];
  cons?: string | string[];
  media?: string[];
}

interface FindAllOptions {
  page?: number;
  limit?: number;
  status?: string;
  isExpert?: string;
  search?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateReviewDto) {
    const { productId, orderId, rating, title, comment, pros, cons, media } =
      dto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException("Product not found");

    let isVerified = false;

    if (orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { where: { productId }, select: { id: true } } },
      });
      if (!order) throw new NotFoundException("Order not found");
      if (order.userId !== userId)
        throw new BadRequestException("Order does not belong to you");
      if (order.status !== "DELIVERED")
        throw new BadRequestException("Order is not delivered yet");
      if (order.items.length === 0)
        throw new BadRequestException("Product not found in this order");
      isVerified = true;
    } else {
      const bought = await this.prisma.orderItem.findFirst({
        where: {
          productId,
          order: { userId, status: "DELIVERED" },
        },
      });
      if (bought) isVerified = true;
    }

    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing)
      throw new ConflictException("You have already reviewed this product");

    const prosStr = pros
      ? Array.isArray(pros)
        ? JSON.stringify(pros)
        : pros
      : undefined;
    const consStr = cons
      ? Array.isArray(cons)
        ? JSON.stringify(cons)
        : cons
      : undefined;

    const review = await this.prisma.review.create({
      data: {
        rating,
        title,
        comment,
        pros: prosStr,
        cons: consStr,
        isVerified,
        userId,
        productId,
        orderId: orderId || null,
        ...(media && media.length > 0
          ? {
              media: {
                create: media.map((url) => ({
                  url,
                  type: this.inferMediaType(url),
                })),
              },
            }
          : {}),
      },
      include: { media: true },
    });

    await this.recalculateRating(productId);

    return review;
  }

  async findByProduct(
    productId: number,
    page = 1,
    limit = 20,
    isExpert?: boolean,
    userId?: number,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { productId, isApproved: true };
    if (isExpert !== undefined) where.isExpert = isExpert;

    const [reviews, total, product] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          media: true,
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.product.findUnique({
        where: { id: productId },
        select: { averageRating: true, numReviews: true },
      }),
    ]);

    let likedSet = new Set<number>();
    if (userId) {
      const likes = await this.prisma.reviewLike.findMany({
        where: { userId, reviewId: { in: reviews.map((r) => r.id) } },
        select: { reviewId: true },
      });
      likedSet = new Set(likes.map((l) => l.reviewId));
    }

    const data = reviews.map((r) => ({
      ...r,
      isLiked: likedSet.has(r.id),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      averageRating: product?.averageRating || 0,
      numReviews: product?.numReviews || 0,
    };
  }

  async findAll(options: FindAllOptions) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status === "approved") where.isApproved = true;
    else if (options.status === "pending") where.isApproved = false;
    if (options.isExpert === "true") where.isExpert = true;
    else if (options.isExpert === "false") where.isExpert = false;
    if (options.search) {
      where.OR = [
        { title: { contains: options.search } },
        { comment: { contains: options.search } },
      ];
    }

    const [data, total, totalAll, pendingCount, avgResult] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          product: { select: { id: true, title: true, slug: true } },
          user: { select: { id: true, name: true, email: true } },
          media: true,
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.count(),
      this.prisma.review.count({ where: { isApproved: false } }),
      this.prisma.review.aggregate({ _avg: { rating: true } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalReviews: totalAll,
        pendingReviews: pendingCount,
        avgRating: avgResult._avg.rating || 0,
      },
    };
  }

  async approve(id: number) {
    const review = await this.findById(id);
    if (review.isApproved)
      throw new BadRequestException("Review is already approved");
    await this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });
    await this.recalculateRating(review.productId);
    return { message: "Review approved" };
  }

  async delete(id: number) {
    const review = await this.findById(id);
    await this.prisma.review.delete({ where: { id } });
    await this.recalculateRating(review.productId);
    return { message: "Review deleted" };
  }

  async findById(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        media: true,
      },
    });
    if (!review) throw new NotFoundException("Review not found");
    return review;
  }

  async recalculateRating(productId: number) {
    const result = await this.prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: result._avg.rating || 0,
        numReviews: result._count.rating,
      },
    });
  }

  async like(userId: number, reviewId: number) {
    await this.findById(reviewId);
    const existing = await this.prisma.reviewLike.findUnique({
      where: { userId_reviewId: { userId, reviewId } },
    });
    if (existing) throw new ConflictException("Already liked");
    await this.prisma.reviewLike.create({ data: { userId, reviewId } });
    await this.prisma.review.update({
      where: { id: reviewId },
      data: { likes: { increment: 1 } },
    });
    return { message: "Review liked" };
  }

  async unlike(userId: number, reviewId: number) {
    await this.findById(reviewId);
    const existing = await this.prisma.reviewLike.findUnique({
      where: { userId_reviewId: { userId, reviewId } },
    });
    if (!existing) throw new NotFoundException("Not liked yet");
    await this.prisma.reviewLike.delete({ where: { id: existing.id } });
    await this.prisma.review.update({
      where: { id: reviewId },
      data: { likes: { decrement: 1 } },
    });
    return { message: "Review unliked" };
  }

  private inferMediaType(url: string): string {
    const ext = url.split(".").pop()?.toLowerCase();
    if (ext && ["mp4", "webm", "ogg", "mov", "avi"].includes(ext))
      return "video";
    return "image";
  }
}
