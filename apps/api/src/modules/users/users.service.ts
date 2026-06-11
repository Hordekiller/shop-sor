import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true,
        _count: { select: { orders: true, reviews: true } },
      },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true,
        _count: { select: { orders: true, reviews: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
