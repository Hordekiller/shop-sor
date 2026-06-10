import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
