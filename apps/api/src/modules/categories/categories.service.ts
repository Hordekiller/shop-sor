import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: { select: { products: true, children: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findTree() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const map = new Map<number, any>();
    const roots: any[] = [];

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId).children.push(map.get(cat.id));
      } else {
        roots.push(map.get(cat.id));
      }
    }

    return roots;
  }

  async findById(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findById(id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findById(id);

    await this.prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });

    return this.prisma.category.delete({ where: { id } });
  }
}
