import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { PrismaService } from "../../common/prisma.service";
import { AdminSettingsService } from "./admin-settings.service";
import { WalletService } from "../wallet/wallet.service";
import { NotificationsService } from "../notifications/notifications.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@ApiTags("Admin")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private adminSettings: AdminSettingsService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
  ) {}

  @Get("stats")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get dashboard statistics" })
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
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      (async () => {
        const orders = await this.prisma.order.findMany({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
          select: { total: true },
        });
        return orders.reduce((sum, o) => sum + o.total.toNumber(), 0);
      })(),
      this.prisma.shop.count(),
      this.prisma.coupon.count(),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum?.total || 0,
      ordersToday,
      revenueToday,
      totalShops,
      totalCoupons,
      recentOrders,
    };
  }

  @Get("sales-report")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get sales report for a date range" })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  async getSalesReport(@Query("from") from?: string, @Query("to") to?: string) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, paidCount, totalRevenue, orders] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          paymentStatus: "PAID",
        },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          paymentStatus: "PAID",
        },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        orderBy: { createdAt: "asc" },
        select: { total: true, createdAt: true, paymentStatus: true },
      }),
    ]);

    const dayMap: Record<string, { total: number; count: number }> = {};
    for (const o of orders) {
      const d = o.createdAt.toISOString().slice(0, 10);
      if (!dayMap[d]) dayMap[d] = { total: 0, count: 0 };
      dayMap[d].count++;
      if (o.paymentStatus === "PAID") dayMap[d].total += o.total.toNumber();
    }

    return {
      from: fromDate,
      to: toDate,
      totalOrders: total,
      paidOrders: paidCount,
      totalRevenue: totalRevenue._sum?.total || 0,
      daily: Object.entries(dayMap).map(([date, data]) => ({ date, ...data })),
    };
  }

  @Get("monthly-sales")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get monthly sales for the last 12 months" })
  async getMonthlySales() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: twelveMonthsAgo }, paymentStatus: "PAID" },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const monthMap: Record<string, number> = {};
    for (const o of orders) {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + o.total.toNumber();
    }

    return Object.entries(monthMap).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }

  @Get("low-stock")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get low stock products" })
  async getLowStock(@Query("threshold") threshold?: string) {
    const limit = Math.max(1, Number(threshold) || 10);
    const products = await this.prisma.product.findMany({
      where: { stock: { lte: limit }, isActive: true },
      orderBy: { stock: "asc" },
      take: 50,
      select: {
        id: true,
        title: true,
        slug: true,
        sku: true,
        stock: true,
        price: true,
        images: true,
      },
    });

    const outOfStock = products.filter((p) => p.stock === 0).length;
    return { total: products.length, outOfStock, threshold: limit, products };
  }

  @Get("user-report")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get user report for date range" })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  async getUserReport(@Query("from") from?: string, @Query("to") to?: string) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, newUsers, usersWithOrders] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.user.count({
        where: {
          orders: { some: { createdAt: { gte: fromDate, lte: toDate } } },
        },
      }),
    ]);

    return {
      totalUsers,
      newUsers,
      activeUsers: usersWithOrders,
      periodStart: fromDate,
      periodEnd: toDate,
    };
  }

  @Get("most-viewed")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get most viewed products" })
  async getMostViewed(@Query("take") take?: string) {
    const limit = Math.min(100, Math.max(1, Number(take) || 20));
    return this.prisma.product.findMany({
      orderBy: { viewCount: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        stock: true,
        price: true,
        images: true,
      },
    });
  }

  @Post("products/:id/view")
  @ApiOperation({ summary: "Increment product view count" })
  async incrementView(@Param("id") id: string) {
    return this.prisma.product.update({
      where: { id: Number(id) },
      data: { viewCount: { increment: 1 } },
    });
  }

  @Get("settings")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get shop settings (admin)" })
  async getSettings() {
    return this.adminSettings.get();
  }

  @Put("settings")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Update shop settings (admin)" })
  async updateSettings(@Body() body: UpdateSettingsDto, @Req() req: any) {
    return this.adminSettings.update(body, req.user?.id);
  }

  @Get("wallet/users")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get users with wallet info" })
  @ApiQuery({ name: "search", required: false })
  async getWalletUsers(@Query("search") search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        wallet: { select: { balance: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      balance: u.wallet?.balance ?? 0,
    }));
  }

  @Post("wallet/:userId/adjust")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Adjust user wallet balance (admin)" })
  async adjustWallet(
    @Param("userId") userId: string,
    @Body() body: { amount: number; description: string },
    @Req() req: any,
  ) {
    const adminName = req.user?.name || "ادمین";
    const desc = body.description || `توسط ${adminName}`;
    return this.walletService.adminAdjust(+userId, body.amount, desc);
  }

  @Get("wallet/settings")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get wallet bonus settings" })
  async getWalletSettings() {
    const settings = await this.adminSettings.get();
    return {
      bonusPercent: settings.walletBonusPercent || 0,
      bonusFromDate: settings.walletBonusFromDate,
      bonusToDate: settings.walletBonusToDate,
    };
  }

  @Put("wallet/settings")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Update wallet bonus settings" })
  async updateWalletSettings(
    @Body()
    body: {
      bonusPercent?: number;
      bonusFromDate?: string;
      bonusToDate?: string;
    },
  ) {
    const data: any = {};
    if (body.bonusPercent !== undefined)
      data.walletBonusPercent = body.bonusPercent;
    if (body.bonusFromDate !== undefined)
      data.walletBonusFromDate = body.bonusFromDate
        ? new Date(body.bonusFromDate)
        : null;
    if (body.bonusToDate !== undefined)
      data.walletBonusToDate = body.bonusToDate
        ? new Date(body.bonusToDate)
        : null;
    return this.adminSettings.update(data);
  }

  @Get("wallet/transactions")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get all wallet transactions" })
  @ApiQuery({ name: "userId", required: false })
  @ApiQuery({ name: "page", required: false })
  async getAllTransactions(
    @Query("userId") userId?: string,
    @Query("page") page?: string,
  ) {
    const where: any = {};
    if (userId) where.wallet = { userId: +userId };
    const p = Number(page) || 1;
    const limit = 30;
    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        include: { wallet: { select: { userId: true } } },
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * limit,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    const userIds = [...new Set(data.map((t) => t.wallet.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
    return {
      data: data.map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
        userName: userMap[t.wallet.userId] || "—",
        userId: t.wallet.userId,
      })),
      total,
      page: p,
      limit,
    };
  }

  @Get("notifications")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get all notifications (admin)" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "userId", required: false })
  async getAllNotifications(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("userId") userId?: string,
  ) {
    return this.notificationsService.findAllAdmin(
      +(page || "1"),
      +(limit || "20"),
      userId ? +userId : undefined,
    );
  }

  // ─── Shipping Methods CRUD ───

  @Get("shipping-methods")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "List all shipping methods" })
  async getShippingMethods() {
    return this.prisma.shippingMethod.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  @Post("shipping-methods")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Create shipping method" })
  async createShippingMethod(@Body() body: any) {
    return this.prisma.shippingMethod.create({ data: body });
  }

  @Put("shipping-methods/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Update shipping method" })
  async updateShippingMethod(@Param("id") id: string, @Body() body: any) {
    return this.prisma.shippingMethod.update({
      where: { id: +id },
      data: body,
    });
  }

  @Get("shipping-methods/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiOperation({ summary: "Get shipping method" })
  async getShippingMethod(@Param("id") id: string) {
    return this.prisma.shippingMethod.findUnique({ where: { id: +id } });
  }
}
