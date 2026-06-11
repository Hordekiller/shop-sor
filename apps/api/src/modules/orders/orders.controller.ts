import {
  Controller,
  Get,
  Post,
  Put,
  Res,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, UpdateOrderStatusDto } from "./dto/create-order.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Orders")
@Controller("orders")
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new order from cart" })
  async create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List user orders" })
  async findMyOrders(@Req() req: any, @Query("page") page?: string) {
    return this.ordersService.getUserOrders(req.user.id, Number(page) || 1);
  }

  @Get("all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all orders (admin)" })
  async findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get order details" })
  async findOne(@Req() req: any, @Param("id") id: string) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return this.ordersService.findByOrderNumber(id);
    }
    return this.ordersService.findById(
      numericId,
      req.user.role === "CUSTOMER" ? req.user.id : undefined,
    );
  }

  @Put(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update order status (admin)" })
  async updateStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(Number(id), dto, req.user.id);
  }

  @Put(":id/cancel")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cancel own order (user)" })
  async cancel(@Req() req: any, @Param("id") id: string) {
    return this.ordersService.cancel(Number(id), req.user.id);
  }

  @Get(":id/invoice")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Download order invoice (HTML)" })
  async invoice(
    @Req() req: any,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const numericId = Number(id);
    const order = await this.ordersService.findById(
      numericId,
      req.user.role === "CUSTOMER" ? req.user.id : undefined,
    );

    const itemsRows = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${item.product?.title || `Product #${item.productId}`}${item.variantName ? `<br><small>${item.variantName}</small>` : ""}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:left">${item.price.toNumber().toLocaleString()}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;text-align:left">${(item.price.toNumber() * item.quantity).toLocaleString()}</td>
      </tr>
    `,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="utf-8"><title>فاکتور ${order.orderNumber}</title>
<style>
body{font-family:Tahoma,Arial,sans-serif;margin:40px;color:#333}
.invoice{max-width:800px;margin:auto;border:1px solid #ddd;padding:30px;border-radius:8px}
h1{color:#7c3aed;text-align:center;margin-bottom:5px}
.meta{display:flex;justify-content:space-between;margin:20px 0;padding:15px 0;border-top:2px solid #7c3aed;border-bottom:2px solid #7c3aed}
table{width:100%;border-collapse:collapse;margin:15px 0}
th{background:#f5f3ff;padding:8px;text-align:center}
.total-row td{padding:8px;font-weight:bold}
.grand-total{font-size:18px;color:#7c3aed}
.footer{text-align:center;margin-top:30px;color:#999;font-size:12px}
</style></head>
<body>
<div class="invoice">
  <h1>فاکتور فروش</h1>
  <div style="text-align:center;color:#666">${order.orderNumber}</div>
  <div class="meta">
    <div><strong>تاریخ:</strong> ${new Date(order.createdAt).toLocaleDateString("fa-IR")}</div>
    <div><strong>مشتری:</strong> ${order.user?.name || "—"}</div>
    <div><strong>شماره همراه:</strong> ${order.user?.phone || "—"}</div>
  </div>
  <table>
    <thead><tr>
      <th>محصول</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th>
    </tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>
  <div style="border-top:2px solid #333;padding-top:10px">
    <div class="total-row" style="display:flex;justify-content:space-between">
      <span>زیرمجموع:</span><span>${order.subtotal.toNumber().toLocaleString()} ریال</span>
    </div>
    <div class="total-row" style="display:flex;justify-content:space-between">
      <span>هزینه ارسال:</span><span>${order.shippingCost.equals(0) ? "رایگان" : `${order.shippingCost.toNumber().toLocaleString()} ریال`}</span>
    </div>
    ${
      order.discount.greaterThan(0)
        ? `<div class="total-row" style="display:flex;justify-content:space-between;color:#16a34a">
      <span>تخفیف:</span><span>-${order.discount.toNumber().toLocaleString()} ریال</span>
    </div>`
        : ""
    }
    <div class="total-row grand-total" style="display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:8px;margin-top:8px">
      <span>مبلغ قابل پرداخت:</span><span>${order.total.toNumber().toLocaleString()} ریال</span>
    </div>
  </div>
  <div class="footer">این فاکتور به صورت خودکار صادر شده است.</div>
</div>
</body></html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice-${order.orderNumber}.html"`,
    );
    res.send(html);
  }
}
