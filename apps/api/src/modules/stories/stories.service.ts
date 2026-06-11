import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.story.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async findActive() {
    return this.prisma.story.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findById(id: number) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException("Story not found");
    return story;
  }

  async create(dto: {
    title: string;
    subtitle?: string;
    bgColor?: string;
    image?: string;
    videoUrl?: string;
    link?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.prisma.story.create({ data: dto });
  }

  async update(
    id: number,
    dto: Partial<{
      title: string;
      subtitle: string;
      bgColor: string;
      image: string;
      videoUrl: string;
      link: string;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) {
    await this.findById(id);
    return this.prisma.story.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.story.delete({ where: { id } });
  }
}
