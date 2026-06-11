import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { join, extname } from "path";

@Injectable()
export class UploadService {
  private readonly ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  private readonly ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
  private readonly ALLOWED_DOC_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  private readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
  private readonly MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB
  private readonly MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_USER_DAILY_UPLOADS = 10;
  private readonly THUMB_SIZES = [
    { name: "thumbnail", size: 150 },
    { name: "small", size: 300 },
    { name: "medium", size: 600 },
    { name: "large", size: 900 },
    { name: "xlarge", size: 1200 },
  ] as const;

  constructor(private prisma: PrismaService) {}

  getAllowedTypes(sourceType?: string): string[] {
    if (sourceType === "user_review") {
      return [...this.ALLOWED_IMAGE_TYPES, ...this.ALLOWED_VIDEO_TYPES];
    }
    return [
      ...this.ALLOWED_IMAGE_TYPES,
      ...this.ALLOWED_VIDEO_TYPES,
      ...this.ALLOWED_DOC_TYPES,
    ];
  }

  getMaxSize(mimetype: string): number {
    if (mimetype.startsWith("video/")) return this.MAX_VIDEO_SIZE;
    if (mimetype.startsWith("image/")) return this.MAX_IMAGE_SIZE;
    return this.MAX_DOC_SIZE;
  }

  validateFile(mimetype: string, size: number, sourceType?: string): void {
    const allowed = this.getAllowedTypes(sourceType);
    if (!allowed.includes(mimetype)) {
      throw new BadRequestException(
        `نوع فایل نامعتبر است. فرمت‌های مجاز: ${allowed.join(", ")}`,
      );
    }
    const maxSize = this.getMaxSize(mimetype);
    if (size > maxSize) {
      throw new BadRequestException(
        `حجم فایل بیشتر از حد مجاز است (حداکثر ${Math.round((maxSize / 1024 / 1024) * 100) / 100}MB)`,
      );
    }
  }

  async checkUserUploadLimit(userId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await this.prisma.mediaFile.count({
      where: {
        uploadedById: userId,
        createdAt: { gte: today },
      },
    });
    if (count >= this.MAX_USER_DAILY_UPLOADS) {
      throw new ForbiddenException(
        "محدودیت آپلود روزانه: حداکثر ۱۰ فایل در روز",
      );
    }
  }

  async getImageDimensions(
    filepath: string,
  ): Promise<{ width: number; height: number } | null> {
    try {
      const sharp = await import("sharp").then((m) => m.default);
      const metadata = await sharp(filepath).metadata();
      if (metadata.width && metadata.height) {
        return { width: metadata.width, height: metadata.height };
      }
    } catch {}
    return null;
  }

  async resizeImage(filepath: string, maxWidth = 1920): Promise<void> {
    try {
      const sharp = await import("sharp").then((m) => m.default);
      const metadata = await sharp(filepath).metadata();
      if (metadata.width && metadata.width > maxWidth) {
        await sharp(filepath)
          .resize({ width: maxWidth, withoutEnlargement: true })
          .toFile(filepath + "_resized");
        const fs = await import("fs/promises");
        await fs.rename(filepath + "_resized", filepath);
      }
    } catch {}
  }

  async generateThumbnails(
    filePath: string,
    uploadDir: string,
    urlPrefix = "/uploads/",
  ): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {
      thumbnailUrl: null,
      smallUrl: null,
      mediumUrl: null,
      largeUrl: null,
      xlargeUrl: null,
    };
    try {
      const sharp = await import("sharp").then((m) => m.default);
      const ext = extname(filePath).toLowerCase();
      const isImage = ext.match(/\.(jpe?g|png|webp|gif)$/i);
      if (!isImage) return result;

      const baseName = filePath.slice(0, -ext.length);
      const filename = filePath.slice(uploadDir.length + 1, -ext.length);

      for (const { name, size } of this.THUMB_SIZES) {
        const thumbPath = `${baseName}-${name}.webp`;
        await sharp(filePath)
          .resize({ width: size, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(thumbPath);
        result[`${name}Url`] = `${urlPrefix}${filename}-${name}.webp`;
      }
    } catch {}
    return result;
  }

  async createMediaRecord(data: {
    url: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    width?: number;
    height?: number;
    thumbnailUrl?: string | null;
    smallUrl?: string | null;
    mediumUrl?: string | null;
    largeUrl?: string | null;
    xlargeUrl?: string | null;
    sourceType: string;
    uploadedById?: number;
    attachedTo?: string;
    isApproved?: boolean;
  }): Promise<any> {
    const format = data.mimetype.split("/")[1] || null;
    return this.prisma.mediaFile.create({
      data: {
        url: data.url,
        filename: data.filename,
        originalName: data.originalName,
        mimetype: data.mimetype,
        size: data.size,
        width: data.width || null,
        height: data.height || null,
        format,
        thumbnailUrl: data.thumbnailUrl ?? null,
        smallUrl: data.smallUrl ?? null,
        mediumUrl: data.mediumUrl ?? null,
        largeUrl: data.largeUrl ?? null,
        xlargeUrl: data.xlargeUrl ?? null,
        sourceType: data.sourceType,
        uploadedById: data.uploadedById || null,
        attachedTo: data.attachedTo || null,
        isApproved:
          data.isApproved ?? (data.sourceType === "user_review" ? false : true),
      },
    });
  }

  async getMediaList(query: {
    page?: number;
    limit?: number;
    sourceType?: string;
    type?: string;
    search?: string;
    isApproved?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 30;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.sourceType) {
      where.sourceType = query.sourceType;
    }
    if (query.type === "image") {
      where.mimetype = { startsWith: "image/" };
    } else if (query.type === "video") {
      where.mimetype = { startsWith: "video/" };
    } else if (query.type === "file") {
      where.NOT = [
        { mimetype: { startsWith: "image/" } },
        { mimetype: { startsWith: "video/" } },
      ];
    }
    if (query.search) {
      where.OR = [
        { originalName: { contains: query.search } },
        { filename: { contains: query.search } },
      ];
    }
    if (query.isApproved === "pending") {
      where.isApproved = false;
    } else if (query.isApproved === "approved") {
      where.isApproved = true;
    }

    const [data, total] = await Promise.all([
      this.prisma.mediaFile.findMany({
        where,
        include: { uploader: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.mediaFile.count({ where }),
    ]);

    return {
      data: data.map((f) => ({
        id: f.id,
        url: f.url,
        filename: f.filename,
        originalName: f.originalName,
        mimetype: f.mimetype,
        size: f.size,
        width: f.width,
        height: f.height,
        format: f.format,
        thumbnailUrl: f.thumbnailUrl,
        smallUrl: f.smallUrl,
        mediumUrl: f.mediumUrl,
        largeUrl: f.largeUrl,
        xlargeUrl: f.xlargeUrl,
        sourceType: f.sourceType,
        uploadedBy: f.uploader?.name || "—",
        uploadedById: f.uploadedById,
        attachedTo: f.attachedTo,
        alt: f.alt,
        caption: f.caption,
        isApproved: f.isApproved,
        createdAt: f.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteMedia(id: number): Promise<void> {
    const file = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!file) throw new BadRequestException("فایل یافت نشد");

    // Check if file is used in products
    const productsWithFile = await this.prisma.product.findFirst({
      where: { images: { path: "$", string_contains: file.filename } as any },
    });
    if (productsWithFile) {
      throw new BadRequestException(
        "این فایل در یک محصول استفاده شده است. ابتدا آن را از محصول حذف کنید.",
      );
    }

    // Delete from filesystem
    try {
      const fs = await import("fs");
      const { join } = await import("path");
      const uploadDir = join(process.cwd(), "uploads");
      const filepath = join(uploadDir, file.filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      // Delete thumbnail files
      const baseName = file.filename.slice(0, file.filename.lastIndexOf("."));
      for (const { name } of this.THUMB_SIZES) {
        const thumbPath = join(uploadDir, `${baseName}-${name}.webp`);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }
    } catch {}

    await this.prisma.mediaFile.delete({ where: { id } });
  }

  async updateMedia(
    id: number,
    data: { alt?: string; caption?: string; isApproved?: boolean },
  ) {
    return this.prisma.mediaFile.update({
      where: { id },
      data,
    });
  }
}
