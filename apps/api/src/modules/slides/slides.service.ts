import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class SlidesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.siteSlide.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async findActive() {
    return this.prisma.siteSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findById(id: number) {
    const slide = await this.prisma.siteSlide.findUnique({ where: { id } });
    if (!slide) throw new NotFoundException("Slide not found");
    return slide;
  }

  async create(dto: {
    title: string;
    description?: string;
    bgColor?: string;
    image?: string;
    link?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.prisma.siteSlide.create({ data: dto });
  }

  async update(
    id: number,
    dto: Partial<{
      title: string;
      description: string;
      bgColor: string;
      image: string;
      link: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) {
    await this.findById(id);
    return this.prisma.siteSlide.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.siteSlide.delete({ where: { id } });
  }
}
