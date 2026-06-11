import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { StockAlertsService } from "./stock-alerts.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Stock Alerts")
@Controller("stock-alerts")
export class StockAlertsController {
  constructor(private readonly stockAlertsService: StockAlertsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create stock alert for out-of-stock product" })
  async create(
    @Req() req: any,
    @Body() body: { productId: number; variantId?: number },
  ) {
    return this.stockAlertsService.create(
      req.user.id,
      body.productId,
      body.variantId,
    );
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my stock alerts" })
  async findMy(@Req() req: any) {
    return this.stockAlertsService.findMyAlerts(req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove stock alert" })
  async remove(@Req() req: any, @Param("id") id: string) {
    return this.stockAlertsService.remove(req.user.id, +id);
  }
}
