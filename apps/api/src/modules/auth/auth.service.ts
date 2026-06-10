import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: { name: string; email: string; phone?: string; password: string }) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, ...(data.phone ? [{ phone: data.phone }] : [])],
      },
    });

    if (existing) {
      throw new ConflictException('Email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
      },
    });

    const token = this.generateToken(user.id, user.role);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const token = this.generateToken(user.id, user.role);

    return {
      user: this.sanitizeUser(user),
      token,
    };
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
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private generateToken(userId: number, role: string) {
    return this.jwtService.sign({ sub: userId, role });
  }

  sanitizeUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}
