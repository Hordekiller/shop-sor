import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class ReturnsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    dto: {
      orderId: number;
      reason: string;
      description?: string;
      items: { itemId: number; quantity: number }[];
    },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException("Order not found");
    if (order.userId !== userId) throw new ForbiddenException("Access denied");

    const validStatuses = ["DELIVERED", "SHIPPED"];
    if (!validStatuses.includes(order.status)) {
      throw new BadRequestException(
        "Only delivered or shipped orders can be returned",
      );
    }

    const validReasons = [
      "DEFECTIVE",
      "WRONG_ITEM",
      "NOT_AS_DESCRIBED",
      "OTHER",
    ];
    if (!validReasons.includes(dto.reason)) {
      throw new BadRequestException(
        `Invalid reason. Valid: ${validReasons.join(", ")}`,
      );
    }

    const existing = await this.prisma.returnRequest.findFirst({
      where: {
        orderId: dto.orderId,
        userId,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        "A return request for this order is already pending or approved",
      );
    }

    for (const item of dto.items) {
      const orderItem = order.items.find((oi) => oi.id === item.itemId);
      if (!orderItem)
        throw new NotFoundException(`Order item #${item.itemId} not found`);
      if (item.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Requested quantity for item #${item.itemId} exceeds ordered quantity`,
        );
      }
    }

    return this.prisma.returnRequest.create({
      data: {
        orderId: dto.orderId,
        userId,
        reason: dto.reason as any,
        description: dto.description,
        items: dto.items as any,
        status: "PENDING",
      },
      include: {
        order: { select: { orderNumber: true } },
      },
    });
  }

  async findByUser(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          order: { select: { orderNumber: true } },
        },
      }),
      this.prisma.returnRequest.count({ where: { userId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number, userId?: number) {
    const record = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: { select: { id: true, title: true, slug: true } },
              },
            },
          },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!record) throw new NotFoundException("Return request not found");
    if (userId && record.userId !== userId)
      throw new ForbiddenException("Access denied");
    return record;
  }

  async findAllAdmin(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          order: { select: { orderNumber: true, total: true } },
        },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(
    id: number,
    dto: { status: string; adminNote?: string; refundAmount?: number },
  ) {
    const record = await this.prisma.returnRequest.findUnique({
      where: { id },
    });
    if (!record) throw new NotFoundException("Return request not found");

    const validTransitions: Record<string, string[]> = {
      pending: ["approved", "rejected"],
      approved: ["completed", "rejected"],
      rejected: [],
      completed: [],
    };

    const allowed = validTransitions[record.status];
    if (!allowed || !allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from "${record.status}" to "${dto.status}". Allowed: ${allowed?.join(", ") || "none"}`,
      );
    }

    const updateData: any = { status: dto.status };
    if (dto.adminNote !== undefined) updateData.adminNote = dto.adminNote;
    if (dto.refundAmount !== undefined)
      updateData.refundAmount = dto.refundAmount;

    return this.prisma.returnRequest.update({
      where: { id },
      data: updateData,
      include: {
        order: { select: { orderNumber: true } },
        user: { select: { id: true, name: true } },
      },
    });
  }
}
