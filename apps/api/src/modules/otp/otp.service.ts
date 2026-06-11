import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  async request(phone: string): Promise<{ expiresIn: number }> {
    const existing = await this.prisma.otp.findFirst({
      where: { phone, verified: false, expiresAt: { gt: new Date() } },
    });
    if (existing) {
      const remaining = Math.ceil(
        (existing.expiresAt.getTime() - Date.now()) / 1000,
      );
      return { expiresIn: remaining };
    }

    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await this.prisma.otp.deleteMany({ where: { phone, verified: false } });
    await this.prisma.otp.create({ data: { phone, code, expiresAt } });

    console.log(`[OTP] Code for ${phone}: ${code}`);

    return { expiresIn: 120 };
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const otp = await this.prisma.otp.findFirst({
      where: { phone, code, verified: false, expiresAt: { gt: new Date() } },
    });
    if (!otp)
      throw new BadRequestException("کد تأیید نامعتبر یا منقضی شده است");
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });
    return true;
  }
}
