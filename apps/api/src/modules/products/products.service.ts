import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    shopId?: number;
    minPrice?: number;
    maxPrice?: number;
    type?: string;
    sort?: string;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.shopId) where.shopId = query.shopId;
    if (query.type) where.type = query.type;

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = query.minPrice;
      if (query.maxPrice) where.price.lte = query.maxPrice;
    }

    const orderBy: any = {};
    if (query.sort === 'price_asc') orderBy.price = 'asc';
    else if (query.sort === 'price_desc') orderBy.price = 'desc';
    else if (query.sort === 'newest') orderBy.createdAt = 'desc';
    else if (query.sort === 'oldest') orderBy.createdAt = 'asc';
    else orderBy.createdAt = 'desc';

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          shop: { select: { id: true, name: true, slug: true } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        shop: { include: { owner: { select: { id: true, name: true } } } },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        shop: { include: { owner: { select: { id: true, name: true } } } },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const data: any = { ...dto };

    if (dto.images) {
      data.images = typeof dto.images === 'string' ? dto.images : JSON.stringify(dto.images);
    }

    return this.prisma.product.create({ data });
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findById(id);

    const data: any = { ...dto };
    if (dto.images) {
      data.images = typeof dto.images === 'string' ? dto.images : JSON.stringify(dto.images);
    }

    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async updateImages(id: number, images: string[]) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { images: JSON.stringify(images) },
    });
  }
}
