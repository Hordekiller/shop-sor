import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  private toSlug(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^\w\s\-ًٌٍَُِْآا-ی]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async findAll() {
    return this.prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async findById(id: number) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) throw new NotFoundException("Brand not found");
    return brand;
  }

  async findBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) throw new NotFoundException("Brand not found");
    return brand;
  }

  async create(data: { name: string; description?: string; logo?: string }) {
    const slug = this.toSlug(data.name);

    const existing = await this.prisma.brand.findUnique({ where: { slug } });
    if (existing)
      throw new ConflictException("Brand with this name already exists");

    return this.prisma.brand.create({
      data: { ...data, slug },
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      logo?: string;
      isActive?: boolean;
    },
  ) {
    await this.findById(id);

    if (data.name) {
      const slug = this.toSlug(data.name);
      const existing = await this.prisma.brand.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing)
        throw new ConflictException("Brand with this name already exists");
      return this.prisma.brand.update({
        where: { id },
        data: { ...data, slug },
      });
    }

    return this.prisma.brand.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findById(id);
    const productCount = await this.prisma.product.count({
      where: { brandId: id },
    });
    if (productCount > 0) {
      // Detach brand from products instead of blocking
      await this.prisma.product.updateMany({
        where: { brandId: id },
        data: { brandId: null },
      });
    }
    return this.prisma.brand.delete({ where: { id } });
  }
}
