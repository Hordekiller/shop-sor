import { Injectable, Optional } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { NotificationTemplatesService } from "../notification-templates/notification-templates.service";

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private templatesService?: NotificationTemplatesService,
  ) {}

  async findByUser(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { data, total, unreadCount, page, limit };
  }

  async unreadCount(userId: number) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async create(
    userId: number,
    type: string,
    title: string,
    message?: string,
    link?: string,
    vars?: Record<string, string | number>,
  ) {
    // Try to use template
    if (this.templatesService && vars) {
      const rendered = await this.templatesService.renderNotification(
        type,
        vars,
      );
      if (rendered) {
        return this.prisma.notification.create({
          data: {
            userId,
            type,
            title: rendered.title,
            message: rendered.message || message || "",
            link,
          },
        });
      }
    }
    // Fallback to provided values
    return this.prisma.notification.create({
      data: { userId, type, title, message },
    });
  }

  async delete(id: number, userId: number) {
    return this.prisma.notification.deleteMany({ where: { id, userId } });
  }

  async findAllAdmin(page = 1, limit = 20, userId?: number) {
    const where: any = {};
    if (userId) where.userId = userId;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, total, page, limit };
  }
}
