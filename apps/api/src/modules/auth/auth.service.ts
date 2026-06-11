import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../common/prisma.service";
import { OtpService } from "../otp/otp.service";
import {
  validateMobile,
  validateNationalId,
  validatePersianName,
} from "../../common/iran-validators";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async register(data: {
    name: string;
    email: string;
    phone?: string;
    nationalId?: string;
    birthDate?: string;
    password: string;
    address?: {
      title?: string;
      receiverName: string;
      phone: string;
      province: string;
      city: string;
      postalCode: string;
      addressText: string;
    };
  }) {
    if (!validatePersianName(data.name)) {
      throw new BadRequestException("نام باید به فارسی وارد شود");
    }
    if (data.phone && !validateMobile(data.phone)) {
      throw new BadRequestException(
        "شماره موبایل نامعتبر است (مثال: 09123456789)",
      );
    }
    if (data.nationalId && !validateNationalId(data.nationalId)) {
      throw new BadRequestException("کد ملی نامعتبر است");
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException("Email or phone already exists");
    }

    const registerPhoneRequired = await this.prisma.siteConfig.findUnique({
      where: { key: "register_phone_required" },
    });
    const registerAddressRequired = await this.prisma.siteConfig.findUnique({
      where: { key: "register_address_required" },
    });
    const registerPostalcodeRequired = await this.prisma.siteConfig.findUnique({
      where: { key: "register_postalcode_required" },
    });

    if (registerPhoneRequired?.value === "true" && !data.phone) {
      throw new BadRequestException("Phone number is required");
    }
    if (registerAddressRequired?.value === "true" && !data.address) {
      throw new BadRequestException("Address is required");
    }
    if (
      registerPostalcodeRequired?.value === "true" &&
      data.address &&
      !data.address.postalCode
    ) {
      throw new BadRequestException("Postal code is required");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? "SUPER_ADMIN" : "CUSTOMER";

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        nationalId: data.nationalId,
        birthDate: data.birthDate,
        password: hashedPassword,
        role,
      },
    });

    if (data.address) {
      await this.prisma.address.create({
        data: {
          userId: user.id,
          title: data.address.title || "خانه",
          receiverName: data.address.receiverName,
          phone: data.address.phone,
          province: data.address.province,
          city: data.address.city,
          postalCode: data.address.postalCode,
          addressText: data.address.addressText,
          isDefault: true,
        },
      });
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is disabled");
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async otpLogin(phone: string, code: string) {
    if (!validateMobile(phone)) {
      throw new BadRequestException("شماره موبایل نامعتبر است");
    }
    const verified = await this.otpService.verify(phone, code);
    if (!verified) {
      throw new BadRequestException("کد تأیید نامعتبر است");
    }

    let user = await this.prisma.user.findFirst({ where: { phone } });
    if (!user) {
      const name = "کاربر " + phone.slice(-4);
      user = await this.prisma.user.create({
        data: {
          name,
          email: `user_${phone}@temp.com`,
          phone,
          password: await bcrypt.hash(phone + process.env.JWT_SECRET, 12),
          role: "CUSTOMER",
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException("حساب کاربری غیرفعال است");
    }

    const token = this.generateToken(user.id, user.role);
    return { user: this.sanitizeUser(user), token };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        ownedShop: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.sanitizeUser(user);
  }

  private generateToken(userId: number, role: string) {
    return this.jwtService.sign({ sub: userId, role });
  }

  async updateProfile(
    userId: number,
    data: {
      name?: string;
      phone?: string;
      nationalId?: string;
      birthDate?: string;
      avatar?: string;
    },
  ) {
    if (data.name && !validatePersianName(data.name)) {
      throw new BadRequestException("نام باید به فارسی وارد شود");
    }
    if (data.phone && !validateMobile(data.phone)) {
      throw new BadRequestException("شماره موبایل نامعتبر است");
    }
    if (data.nationalId && !validateNationalId(data.nationalId)) {
      throw new BadRequestException("کد ملی نامعتبر است");
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitizeUser(user);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("User not found");
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new BadRequestException("رمز عبور فعلی اشتباه است");
    }
    if (newPassword.length < 6) {
      throw new BadRequestException("رمز عبور باید حداقل ۶ کاراکتر باشد");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return { message: "رمز عبور با موفقیت تغییر کرد" };
  }

  sanitizeUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}
