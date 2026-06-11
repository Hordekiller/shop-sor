import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class VariantsService {
  constructor(private prisma: PrismaService) {}

  private transform(v: any) {
    if (!v) return v;
    if (typeof v.images === "string") {
      try {
        v.images = JSON.parse(v.images);
      } catch {
        v.images = [];
      }
    }
    if (typeof v.attributes === "string") {
      try {
        v.attributes = JSON.parse(v.attributes);
      } catch {
        v.attributes = {};
      }
    }
    return v;
  }

  async findByProduct(productId: number) {
    const list = await this.prisma.productVariant.findMany({
      where: { productId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return list.map((v) => this.transform(v));
  }

  async findAll(productId: number) {
    const list = await this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
    });
    return list.map((v) => this.transform(v));
  }

  async findById(id: number) {
    const v = await this.prisma.productVariant.findUnique({ where: { id } });
    if (!v) throw new NotFoundException("Variant not found");
    return this.transform(v);
  }

  async create(
    productId: number,
    data: {
      name: string;
      sku?: string;
      price?: number;
      stock?: number;
      attributes?: any;
      images?: string[];
      isActive?: boolean;
    },
  ) {
    return this.transform(
      this.prisma.productVariant.create({
        data: {
          productId,
          name: data.name,
          sku: data.sku,
          price: data.price,
          stock: data.stock || 0,
          attributes: data.attributes || {},
          images: data.images || [],
          isActive: data.isActive ?? true,
        },
      }),
    );
  }

  async update(
    id: number,
    data: {
      name?: string;
      sku?: string;
      price?: number;
      stock?: number;
      attributes?: any;
      images?: string[];
      isActive?: boolean;
    },
  ) {
    const existing = await this.findById(id);
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.attributes !== undefined) updateData.attributes = data.attributes;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.transform(
      this.prisma.productVariant.update({
        where: { id },
        data: updateData,
      }),
    );
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.productVariant.delete({ where: { id } });
  }
}
