import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../../common/prisma.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getStats() {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      ordersToday,
      revenueToday,
      totalShops,
      totalCoupons,
      recentOrders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { total: true } }),
      this.prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      (async () => {
        const orders = await this.prisma.order.findMany({
          where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
          select: { total: true },
        });
        return orders.reduce((sum, o) => sum + o.total, 0);
      })(),
      this.prisma.shop.count(),
      this.prisma.coupon.count(),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      ordersToday,
      revenueToday,
      totalShops,
      totalCoupons,
      recentOrders,
    };
  }
}
