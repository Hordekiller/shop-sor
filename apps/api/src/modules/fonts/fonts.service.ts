import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class FontsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.font.findMany({
      orderBy: { name: "asc" },
      include: { media: true },
    });
  }

  async findActive() {
    return this.prisma.font.findMany({ where: { isActive: true } });
  }

  async findDefault() {
    return this.prisma.font.findFirst({
      where: { isDefault: true, isActive: true },
    });
  }

  async findOne(id: number) {
    const font = await this.prisma.font.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!font) throw new NotFoundException("Font not found");
    return font;
  }

  async create(data: {
    name: string;
    source: string;
    url?: string;
    mediaId?: number;
    filepath?: string;
    weights?: string;
    subsets?: string;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.font.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.font.create({
      data: { ...data, weights: data.weights || "400" },
    });
  }

  async update(
    id: number,
    data: {
      name?: string;
      source?: string;
      url?: string;
      mediaId?: number;
      filepath?: string;
      weights?: string;
      subsets?: string;
      isActive?: boolean;
      isDefault?: boolean;
    },
  ) {
    await this.findOne(id);
    if (data.isDefault) {
      await this.prisma.font.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.font.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.font.delete({ where: { id } });
  }

  async getCss(): Promise<string> {
    const fonts = await this.prisma.font.findMany({
      where: { isActive: true },
      include: { media: true },
    });
    const rules: string[] = [];
    for (const font of fonts) {
      if (font.source === "link" && font.url) {
        rules.push(`@import url('${font.url}');`);
      } else if (font.source === "upload" && font.filepath) {
        const weights = font.weights.split(",").map((w) => w.trim());
        const url =
          font.filepath.startsWith("http") || font.filepath.startsWith("/")
            ? font.filepath
            : `/uploads/${font.filepath}`;
        for (const w of weights) {
          rules.push(
            `@font-face { font-family: '${font.name}'; src: url('${url}') format('${this.getFormat(url)}'); font-weight: ${w}; font-display: swap; }`,
          );
        }
      }
    }
    return rules.join("\n");
  }

  private getFormat(url: string): string {
    if (url.endsWith(".woff2")) return "woff2";
    if (url.endsWith(".woff")) return "woff";
    if (url.endsWith(".ttf")) return "truetype";
    if (url.endsWith(".otf")) return "opentype";
    return "woff2";
  }
}
