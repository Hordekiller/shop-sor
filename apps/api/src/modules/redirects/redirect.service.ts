import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class RedirectService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findById(id: number) {
    const redirect = await this.prisma.redirect.findUnique({ where: { id } });
    if (!redirect) throw new NotFoundException("Redirect not found");
    return redirect;
  }

  async resolve(source: string) {
    const redirect = await this.prisma.redirect.findUnique({
      where: { source },
    });
    if (!redirect || !redirect.isActive) return null;
    return redirect;
  }

  async create(dto: { source: string; target: string; type?: number }) {
    const existing = await this.prisma.redirect.findUnique({
      where: { source: dto.source },
    });
    if (existing)
      throw new BadRequestException(
        "A redirect with this source path already exists",
      );
    return this.prisma.redirect.create({
      data: { source: dto.source, target: dto.target, type: dto.type ?? 301 },
    });
  }

  async update(
    id: number,
    dto: {
      source?: string;
      target?: string;
      type?: number;
      isActive?: boolean;
    },
  ) {
    await this.findById(id);
    if (dto.source) {
      const existing = await this.prisma.redirect.findUnique({
        where: { source: dto.source },
      });
      if (existing && existing.id !== id)
        throw new BadRequestException(
          "A redirect with this source path already exists",
        );
    }
    return this.prisma.redirect.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.redirect.delete({ where: { id } });
  }
}
