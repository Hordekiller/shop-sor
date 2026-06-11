import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class PopupsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.popup.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.popup.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number) {
    const popup = await this.prisma.popup.findUnique({ where: { id } });
    if (!popup) throw new NotFoundException("Popup not found");
    return popup;
  }

  async create(dto: {
    title: string;
    description?: string;
    image?: string;
    link?: string;
    btnText?: string;
    type?: string;
    displayMode?: string;
    delay?: number;
    startAt?: string;
    endAt?: string;
    isActive?: boolean;
  }) {
    return this.prisma.popup.create({
      data: {
        ...(dto as any),
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
      },
    });
  }

  async update(
    id: number,
    dto: Partial<{
      title: string;
      description: string;
      image: string;
      link: string;
      btnText: string;
      type: string;
      displayMode: string;
      delay: number;
      startAt: string;
      endAt: string;
      isActive: boolean;
    }>,
  ) {
    await this.findById(id);
    const data: any = { ...dto };
    if (dto.startAt !== undefined)
      data.startAt = dto.startAt ? new Date(dto.startAt) : null;
    if (dto.endAt !== undefined)
      data.endAt = dto.endAt ? new Date(dto.endAt) : null;
    return this.prisma.popup.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.popup.delete({ where: { id } });
  }
}
