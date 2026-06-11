import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number, userId: number) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });
    if (!address || address.userId !== userId) {
      throw new NotFoundException("Address not found");
    }
    return address;
  }

  async create(
    userId: number,
    dto: {
      title?: string;
      receiverName: string;
      phone: string;
      province: string;
      city: string;
      postalCode: string;
      addressText: string;
      isDefault?: boolean;
    },
  ) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const count = await this.prisma.address.count({ where: { userId } });

    return this.prisma.address.create({
      data: {
        userId,
        title: dto.title ?? "خانه",
        receiverName: dto.receiverName,
        phone: dto.phone,
        province: dto.province,
        city: dto.city,
        postalCode: dto.postalCode,
        addressText: dto.addressText,
        isDefault: count === 0 ? true : (dto.isDefault ?? false),
      },
    });
  }

  async update(
    id: number,
    userId: number,
    dto: {
      title?: string;
      receiverName?: string;
      phone?: string;
      province?: string;
      city?: string;
      postalCode?: string;
      addressText?: string;
      isDefault?: boolean;
    },
  ) {
    await this.findById(id, userId);

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId: number) {
    await this.findById(id, userId);
    return this.prisma.address.delete({ where: { id } });
  }

  async setDefault(id: number, userId: number) {
    await this.findById(id, userId);

    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return this.prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}
