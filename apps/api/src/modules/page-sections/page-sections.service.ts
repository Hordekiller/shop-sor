import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class PageSectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.pageSection.findMany({
      where: { isActive: true },
      include: {
        blocks: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findOne(id: number) {
    const section = await this.prisma.pageSection.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!section) throw new NotFoundException("Page section not found");
    return section;
  }

  async create(dto: {
    type?: string;
    title?: string;
    subtitle?: string;
    sortOrder?: number;
    settings?: string;
    isActive?: boolean;
    blocks?: {
      title?: string;
      subtitle?: string;
      image?: string;
      videoUrl?: string;
      link?: string;
      badge?: string;
      badgeColor?: string;
      sortOrder?: number;
      settings?: string;
    }[];
  }) {
    const { blocks, ...sectionData } = dto;

    return this.prisma.pageSection.create({
      data: {
        ...sectionData,
        blocks: blocks
          ? {
              create: blocks,
            }
          : undefined,
      },
      include: {
        blocks: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  async update(
    id: number,
    dto: {
      type?: string;
      title?: string;
      subtitle?: string;
      sortOrder?: number;
      settings?: string;
      isActive?: boolean;
      blocks?: {
        id?: number;
        title?: string;
        subtitle?: string;
        image?: string;
        videoUrl?: string;
        link?: string;
        badge?: string;
        badgeColor?: string;
        sortOrder?: number;
        settings?: string;
      }[];
    },
  ) {
    await this.findOne(id);

    const { blocks, ...sectionData } = dto;
    const data: any = { ...sectionData };

    if (blocks) {
      const existingBlocks = await this.prisma.sectionBlock.findMany({
        where: { sectionId: id },
        select: { id: true },
      });
      const existingIds = existingBlocks.map((b) => b.id);
      const incomingIds = blocks.filter((b) => b.id).map((b) => b.id!);
      const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));

      if (toDelete.length > 0) {
        await this.prisma.sectionBlock.deleteMany({
          where: { id: { in: toDelete } },
        });
      }

      data.blocks = {
        upsert: blocks.map((block) => {
          const { id: blockId, ...blockData } = block;
          return {
            where: { id: blockId ?? 0 },
            create: blockData as any,
            update: blockData as any,
          };
        }),
      };
    }

    return this.prisma.pageSection.update({
      where: { id },
      data,
      include: {
        blocks: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.pageSection.delete({ where: { id } });
  }

  async reorder(ids: number[]) {
    for (let i = 0; i < ids.length; i++) {
      await this.prisma.pageSection.update({
        where: { id: ids[i] },
        data: { sortOrder: i },
      });
    }

    return { success: true };
  }
}
