import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateProductDto, UpdateProductDto } from "./dto/create-product.dto";
import { ProductPublishStatus, ProductStatus } from "@prisma/client";

@Injectable()
export class ProductsService {
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

  private async generateUniqueSlug(
    base: string,
    excludeId?: number,
  ): Promise<string> {
    let slug = this.toSlug(base);
    if (!slug) slug = "product";

    let counter = 0;
    let candidate = slug;
    while (true) {
      const existing = await this.prisma.product.findUnique({
        where: { slug: candidate },
      });
      if (!existing || (excludeId && existing.id === excludeId))
        return candidate;
      counter++;
      candidate = `${slug}-${counter}`;
    }
  }

  private parseImages(images: any): { url: string; alt?: string }[] {
    if (!images) return [];
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed)
          ? parsed.map((item: any) => {
              if (typeof item === "string") return { url: item, alt: "" };
              return { url: item.url || "", alt: item.alt || "" };
            })
          : [];
      } catch {
        return [];
      }
    }
    if (Array.isArray(images)) {
      return images.map((item: any) => {
        if (typeof item === "string") return { url: item, alt: "" };
        return { url: item.url || "", alt: item.alt || "" };
      });
    }
    return [];
  }

  private normalizeImages(images: any): { url: string; alt?: string }[] {
    return this.parseImages(images);
  }

  private transform(product: any) {
    if (!product) return product;
    if (Array.isArray(product)) {
      return product.map((p) => this.transform(p));
    }

    product.images = this.parseImages(product.images);

    if (product.tags && typeof product.tags === "string") {
      try {
        product.tags = JSON.parse(product.tags);
      } catch {
        product.tags = [];
      }
    }
    if (
      product.relatedProductIds &&
      typeof product.relatedProductIds === "string"
    ) {
      try {
        product.relatedProductIds = JSON.parse(product.relatedProductIds);
      } catch {
        product.relatedProductIds = [];
      }
    }

    if (product.variants) {
      for (const v of product.variants) {
        v.images = this.parseImages(v.images);
        if (typeof v.attributes === "string") {
          try {
            v.attributes = JSON.parse(v.attributes);
          } catch {
            v.attributes = {};
          }
        }
      }
    }
    if (product.attrDefs) {
      for (const a of product.attrDefs) {
        if (typeof a.values === "string") {
          try {
            a.values = JSON.parse(a.values);
          } catch {
            a.values = [];
          }
        }
      }
    }
    if (product.specifications) {
      for (const s of product.specifications) {
        // Already parsed from relation
      }
    }
    if (product.categories) {
      product.categories = product.categories.map(
        (pc: any) => pc.category || pc,
      );
    }

    // Calculate effective discount
    if (
      product.price &&
      product.salePrice &&
      product.salePrice < product.price
    ) {
      product.discountPercent = Math.round(
        ((product.price - product.salePrice) / product.price) * 100,
      );
    }

    return product;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    take?: number;
    search?: string;
    categoryId?: number;
    brandId?: number;
    shopId?: number;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: string;
    type?: string;
    status?: string;
    publishStatus?: string;
    sort?: string;
    hasDiscount?: string;
    tags?: string;
    isActive?: string;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.take || query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const conditions: any[] = [];

    if (query.search) {
      conditions.push({
        OR: [
          { title: { contains: query.search } },
          { shortDescription: { contains: query.search } },
          { description: { contains: query.search } },
          { sku: { contains: query.search } },
        ],
      });
    }

    if (query.categoryId) conditions.push({ categoryId: query.categoryId });
    if (query.brandId) conditions.push({ brandId: query.brandId });
    if (query.shopId) conditions.push({ shopId: query.shopId });
    if (query.type) conditions.push({ type: query.type });
    if (query.status) conditions.push({ status: query.status });
    if (query.publishStatus)
      conditions.push({ publishStatus: query.publishStatus });

    if (query.hasDiscount === "true") {
      conditions.push({ salePrice: { not: null } });
    }

    if (query.inStock === "true") {
      conditions.push({ stock: { gt: 0 }, status: ProductStatus.IN_STOCK });
    }

    if (query.minRating) {
      conditions.push({ averageRating: { gte: query.minRating } });
    }

    const now = new Date();
    conditions.push({
      OR: [{ discountEndAt: null }, { discountEndAt: { gte: now } }],
    });

    const priceFilter: any = {};
    if (query.minPrice) priceFilter.gte = Number(query.minPrice);
    if (query.maxPrice) priceFilter.lte = Number(query.maxPrice);
    if (Object.keys(priceFilter).length > 0) {
      conditions.push({
        OR: [{ price: priceFilter }, { salePrice: priceFilter }],
      });
    }

    const where: any = {};
    if (query.publishStatus) {
      where.publishStatus = query.publishStatus;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === "true";
    } else if (!query.publishStatus) {
      where.isActive = true;
      where.publishStatus = ProductPublishStatus.PUBLISHED;
    }
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    let orderBy: any;
    if (query.sort === "cheapest" || query.sort === "price_asc") {
      orderBy = [
        { salePrice: { sort: "asc", nulls: "last" } },
        { price: "asc" },
      ];
    } else if (query.sort === "expensive" || query.sort === "price_desc") {
      orderBy = [
        { salePrice: { sort: "desc", nulls: "last" } },
        { price: "desc" },
      ];
    } else if (query.sort === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (query.sort === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (query.sort === "best_selling") {
      orderBy = { numReviews: "desc" };
    } else if (query.sort === "top_rated" || query.sort === "popular") {
      orderBy = [{ averageRating: "desc" }, { numReviews: "desc" }];
    } else {
      orderBy = { createdAt: "desc" };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          shop: { select: { id: true, name: true, slug: true } },
          _count: { select: { reviews: true } },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              attributes: true,
              images: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: this.transform(products),
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
        brand: true,
        shop: { include: { owner: { select: { id: true, name: true } } } },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        },
        variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
        attrDefs: true,
        specifications: { orderBy: { sortOrder: "asc" } },
        categories: {
          include: { category: true },
        },
      },
    });

    if (!product) throw new NotFoundException("Product not found");
    return this.transform(product);
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        shop: { include: { owner: { select: { id: true, name: true } } } },
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        },
        variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
        attrDefs: true,
        specifications: { orderBy: { sortOrder: "asc" } },
        categories: {
          include: { category: true },
        },
      },
    });

    if (!product) throw new NotFoundException("Product not found");
    return this.transform(product);
  }

  async create(dto: CreateProductDto) {
    // Auto-generate slug
    const slug = dto.slug
      ? this.toSlug(dto.slug)
      : await this.generateUniqueSlug(dto.title);

    // Validate slug uniqueness
    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Slug "${slug}" already exists`);
    }

    // Validate SKU uniqueness
    if (dto.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: { sku: dto.sku },
      });
      if (existingSku)
        throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }

    // Validate barcode uniqueness
    if (dto.barcode) {
      const existingBarcode = await this.prisma.product.findFirst({
        where: { barcode: dto.barcode },
      });
      if (existingBarcode)
        throw new ConflictException(`Barcode "${dto.barcode}" already exists`);
    }

    // Validate salePrice < price
    if (dto.salePrice !== undefined && dto.salePrice >= dto.price) {
      throw new BadRequestException(
        "Sale price must be less than regular price",
      );
    }

    // Validate discount dates
    if (dto.discountStartAt && dto.discountEndAt) {
      const start = new Date(dto.discountStartAt);
      const end = new Date(dto.discountEndAt);
      if (start >= end) {
        throw new BadRequestException(
          "Discount start date must be before end date",
        );
      }
    }

    // Calculate discount percent if not provided but salePrice is
    let discountPercent = dto.discountPercent;
    if (
      discountPercent === undefined &&
      dto.salePrice !== undefined &&
      dto.price > 0
    ) {
      discountPercent = Math.round(
        ((dto.price - dto.salePrice) / dto.price) * 100,
      );
    }

    const {
      variants: variantsData,
      attrDefs: attrDefsData,
      specifications: specsData,
      categories: extraCategories,
      images,
      tags,
      relatedProductIds,
      ...rest
    } = dto as any;

    const data: any = {
      ...rest,
      slug,
      discountPercent,
      images: this.normalizeImages(images),
      tags: tags || [],
      relatedProductIds: relatedProductIds || [],
    };

    return this.transform(
      this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({ data });

        // Create attribute definitions
        if (attrDefsData && attrDefsData.length > 0) {
          await tx.productAttribute.createMany({
            data: attrDefsData.map((a: any) => ({
              productId: product.id,
              name: a.name,
              values: a.values || [],
            })),
          });
        }

        // Create variants
        if (variantsData && variantsData.length > 0) {
          for (const v of variantsData) {
            await tx.productVariant.create({
              data: {
                productId: product.id,
                name: v.name,
                sku: v.sku || null,
                price: v.price || null,
                stock: v.stock || 0,
                attributes:
                  typeof v.attributes === "object"
                    ? v.attributes
                    : v.attributes || {},
                images: this.normalizeImages(v.images),
                isActive: v.isActive ?? true,
              },
            });
          }
        }

        // Create specifications
        if (specsData && specsData.length > 0) {
          await tx.productSpecification.createMany({
            data: specsData.map((s: any, idx: number) => ({
              productId: product.id,
              name: s.name,
              value: s.value,
              sortOrder: s.sortOrder ?? idx,
            })),
          });
        }

        // Create additional category assignments
        if (extraCategories && extraCategories.length > 0) {
          const allCategoryIds = [
            ...new Set([dto.categoryId, ...extraCategories]),
          ];
          await tx.productCategory.createMany({
            data: allCategoryIds.map((catId: number) => ({
              productId: product.id,
              categoryId: catId,
            })),
          });
        }

        return product;
      }),
    );
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findById(id);

    const {
      variants: variantsData,
      attrDefs: attrDefsData,
      specifications: specsData,
      categories: extraCategories,
      images,
      tags,
      relatedProductIds,
      ...rest
    } = dto as any;
    const data: any = { ...rest };

    if (relatedProductIds !== undefined) {
      data.relatedProductIds = relatedProductIds;
    }

    // Handle slug
    if (data.slug) {
      data.slug = this.toSlug(data.slug);
      const existingSlug = await this.prisma.product.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (existingSlug)
        throw new ConflictException(`Slug "${data.slug}" already exists`);
    }

    // Handle SKU uniqueness
    if (data.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: { sku: data.sku, id: { not: id } },
      });
      if (existingSku)
        throw new ConflictException(`SKU "${data.sku}" already exists`);
    }

    // Handle barcode uniqueness
    if (data.barcode) {
      const existingBarcode = await this.prisma.product.findFirst({
        where: { barcode: data.barcode, id: { not: id } },
      });
      if (existingBarcode)
        throw new ConflictException(`Barcode "${data.barcode}" already exists`);
    }

    if (images !== undefined) {
      data.images = this.normalizeImages(images);
    }

    if (tags !== undefined) {
      data.tags = tags;
    }

    // Validate salePrice < price
    const price =
      data.price ??
      (
        await this.prisma.product.findUnique({
          where: { id },
          select: { price: true },
        })
      )?.price;
    const salePrice = data.salePrice;
    if (salePrice !== undefined && price !== undefined && salePrice >= price) {
      throw new BadRequestException(
        "Sale price must be less than regular price",
      );
    }

    // Handle discount percent
    if (data.price && data.salePrice) {
      data.discountPercent = Math.round(
        ((data.price - data.salePrice) / data.price) * 100,
      );
    }

    return this.transform(
      this.prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({ where: { id }, data });

        // Update attribute definitions
        if (attrDefsData) {
          await tx.productAttribute.deleteMany({ where: { productId: id } });
          if (attrDefsData.length > 0) {
            await tx.productAttribute.createMany({
              data: attrDefsData.map((a: any) => ({
                productId: id,
                name: a.name,
                values: a.values || [],
              })),
            });
          }
        }

        // Update variants
        if (variantsData) {
          const existingIds = (
            await tx.productVariant.findMany({
              where: { productId: id },
              select: { id: true },
            })
          ).map((v) => v.id);
          const incomingIds = variantsData
            .filter((v: any) => v.id)
            .map((v: any) => v.id);
          const toDelete = existingIds.filter(
            (eid) => !incomingIds.includes(eid),
          );
          if (toDelete.length > 0) {
            await tx.productVariant.deleteMany({
              where: { id: { in: toDelete } },
            });
          }

          for (const v of variantsData) {
            const variantData = {
              name: v.name,
              sku: v.sku || null,
              price: v.price || null,
              stock: v.stock || 0,
              attributes:
                typeof v.attributes === "object"
                  ? v.attributes
                  : v.attributes || {},
              images: this.normalizeImages(v.images),
              isActive: v.isActive ?? true,
            };
            if (v.id && incomingIds.includes(v.id)) {
              await tx.productVariant.update({
                where: { id: v.id },
                data: variantData,
              });
            } else {
              await tx.productVariant.create({
                data: { ...variantData, productId: id },
              });
            }
          }
        }

        // Update specifications
        if (specsData) {
          await tx.productSpecification.deleteMany({
            where: { productId: id },
          });
          if (specsData.length > 0) {
            await tx.productSpecification.createMany({
              data: specsData.map((s: any, idx: number) => ({
                productId: id,
                name: s.name,
                value: s.value,
                sortOrder: s.sortOrder ?? idx,
              })),
            });
          }
        }

        // Update additional categories
        if (extraCategories) {
          await tx.productCategory.deleteMany({ where: { productId: id } });
          const allCategoryIds = [
            ...new Set([
              dto.categoryId ||
                (await tx.product.findUnique({
                  where: { id },
                  select: { categoryId: true },
                }))!.categoryId,
              ...extraCategories,
            ]),
          ];
          await tx.productCategory.createMany({
            data: allCategoryIds.map((catId: number) => ({
              productId: id,
              categoryId: catId,
            })),
          });
        } else if (dto.categoryId) {
          // Also sync product_categories when only categoryId changes
          const existingPrimary = await tx.productCategory.findFirst({
            where: { productId: id, categoryId: dto.categoryId },
          });
          if (!existingPrimary) {
            await tx.productCategory.create({
              data: { productId: id, categoryId: dto.categoryId },
            });
          }
        }

        return updated;
      }),
    );
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  async bulkDelete(ids: number[]) {
    return this.prisma.product.deleteMany({ where: { id: { in: ids } } });
  }

  async bulkUpdate(
    ids: number[],
    data: {
      isActive?: boolean;
      publishStatus?: string;
      status?: string;
      categoryId?: number;
    },
  ) {
    return this.prisma.product.updateMany({ where: { id: { in: ids } }, data: data as any });
  }

  async bulkPriceUpdate(
    ids: number[],
    operation: "set" | "percent" | "fixed",
    value: number,
    target: "price" | "salePrice",
  ) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, price: true, salePrice: true },
    });
    const updates = products.map((p) => {
      const current = (target === "price" ? p.price : p.salePrice || p.price).toNumber();
      let newValue: number;
      switch (operation) {
        case "set":
          newValue = value;
          break;
        case "percent":
          newValue = Math.round(current * (1 + value / 100));
          break;
        case "fixed":
          newValue = current + value;
          break;
      }
      if (newValue < 0) newValue = 0;
      return this.prisma.product.update({
        where: { id: p.id },
        data: { [target]: newValue },
      });
    });
    return this.prisma.$transaction(updates);
  }

  async bulkImport(products: any[]) {
    const results: { title: string; success: boolean; error?: string }[] = [];
    for (const p of products) {
      try {
        const slug =
          p.slug ||
          p.title?.replace(/\s+/g, "-").toLowerCase() ||
          `import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const category = p.categoryId
          ? await this.prisma.category.findUnique({
              where: { id: Number(p.categoryId) },
            })
          : null;
        await this.create({
          title: p.title || "بدون عنوان",
          slug,
          price: Number(p.price) || 0,
          salePrice: p.salePrice ? Number(p.salePrice) : undefined,
          stock: Number(p.stock) || 0,
          categoryId: category?.id || 1,
          status: p.status ? (p.status.toUpperCase() as ProductStatus) : ProductStatus.IN_STOCK,
          isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
          tags: p.tags
            ? String(p.tags)
                .split(",")
                .map((t: string) => t.trim())
            : [],
        } as any);
        results.push({ title: p.title, success: true });
      } catch (err: any) {
        results.push({ title: p.title, success: false, error: err.message });
      }
    }
    return results;
  }

  async updateImages(id: number, images: { url: string; alt?: string }[]) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { images: this.normalizeImages(images) },
    });
  }
}
