import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class MegaMenuService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    const config = await this.prisma.megaMenuConfig.findFirst({
      include: {
        menu: {
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!config) return null;

    const result: any = { ...config };

    if (config.menu) {
      result.menu = {
        ...config.menu,
        items: this.buildItemTree(config.menu.items),
      };
    }

    return result;
  }

  async upsertConfig(dto: {
    menuId?: number | null;
    showCategories?: boolean;
    showBrands?: boolean;
    tabs?: string;
    sidebarTitle?: string | null;
    sidebarLinks?: string;
    sidebarBanner?: string | null;
    sidebarBannerLink?: string | null;
    sidebarBannerSize?: string | null;
  }) {
    const existing = await this.prisma.megaMenuConfig.findFirst();

    if (existing) {
      return this.prisma.megaMenuConfig.update({
        where: { id: existing.id },
        data: dto,
        include: { menu: true },
      });
    }

    return this.prisma.megaMenuConfig.create({
      data: dto,
      include: { menu: true },
    });
  }

  async getCategoryConfig(categoryId: number) {
    const config = await this.prisma.megaMenuCategoryConfig.findUnique({
      where: { categoryId },
      include: { category: true },
    });

    return config;
  }

  async upsertCategoryConfig(
    categoryId: number,
    dto: {
      icon?: string;
      iconType?: string;
      sidebarBanner?: string | null;
      sidebarBannerLink?: string | null;
      sidebarLinks?: string;
    },
  ) {
    return this.prisma.megaMenuCategoryConfig.upsert({
      where: { categoryId },
      create: { categoryId, ...dto },
      update: dto,
      include: { category: true },
    });
  }

  async getAllCategoryConfigs() {
    return this.prisma.megaMenuCategoryConfig.findMany({
      include: { category: true },
      orderBy: { id: "asc" },
    });
  }

  async deleteCategoryConfig(id: number) {
    const config = await this.prisma.megaMenuCategoryConfig.findUnique({
      where: { id },
    });

    if (!config) throw new NotFoundException("Category config not found");

    return this.prisma.megaMenuCategoryConfig.delete({ where: { id } });
  }

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
}
