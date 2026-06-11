import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  private buildItemTree(items: any[]) {
    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const item of items) {
      map.set(item.id, { ...item, children: [] });
    }

    for (const item of items) {
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId).children.push(map.get(item.id));
      } else {
        roots.push(map.get(item.id));
      }
    }

    return roots;
  }

  async findAll() {
    const menus = await this.prisma.menu.findMany({
      include: {
        _count: { select: { items: true } },
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return menus.map((menu) => ({
      ...menu,
      items: this.buildItemTree(menu.items),
    }));
  }

  async findOne(id: number) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        _count: { select: { items: true } },
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!menu) throw new NotFoundException("Menu not found");

    return {
      ...menu,
      items: this.buildItemTree(menu.items),
    };
  }

  async create(dto: { name: string; location?: string; isActive?: boolean }) {
    return this.prisma.menu.create({ data: dto as any });
  }

  async update(
    id: number,
    dto: { name?: string; location?: string; isActive?: boolean },
  ) {
    await this.findOne(id);
    return this.prisma.menu.update({ where: { id }, data: dto as any });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.menu.delete({ where: { id } });
  }

  async addItem(
    menuId: number,
    dto: {
      title: string;
      linkType?: string;
      linkValue?: string;
      parentId?: number | null;
      icon?: string;
      image?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    await this.findOne(menuId);
    return this.prisma.menuItem.create({
      data: { ...dto, menuId },
    });
  }

  async updateItem(
    id: number,
    dto: {
      title?: string;
      linkType?: string;
      linkValue?: string;
      parentId?: number | null;
      icon?: string;
      image?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Menu item not found");

    return this.prisma.menuItem.update({ where: { id }, data: dto });
  }

  async removeItem(id: number) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Menu item not found");

    return this.prisma.menuItem.delete({ where: { id } });
  }

  async reorderItems(
    items: { id: number; parentId?: number | null; sortOrder: number }[],
  ) {
    for (const item of items) {
      await this.prisma.menuItem.update({
        where: { id: item.id },
        data: {
          parentId: item.parentId ?? null,
          sortOrder: item.sortOrder,
        },
      });
    }

    return { success: true };
  }
}
