import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { InventoryService } from "./inventory.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Inventory")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN", "VENDOR")
@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("products")
  @ApiOperation({ summary: "Get all products with stock info" })
  async getProducts(
    @Query() query: { page?: string; limit?: string; search?: string },
  ) {
    return this.inventoryService.getAllProducts(
      Number(query.page) || 1,
      Number(query.limit) || 50,
      query.search,
    );
  }

  @Get("movements/:productId")
  @ApiOperation({ summary: "Get stock movements for a product" })
  async getMovements(
    @Param("productId") productId: string,
    @Query() query: { page?: string; limit?: string },
  ) {
    return this.inventoryService.getMovements(
      +productId,
      Number(query.page) || 1,
      Number(query.limit) || 20,
    );
  }

  @Post("adjust")
  @ApiOperation({ summary: "Adjust stock for a product" })
  async adjustStock(
    @Body()
    body: {
      productId: number;
      type: string;
      quantity: number;
      reason: string;
      variantId?: number;
    },
    @Req() req: any,
  ) {
    return this.inventoryService.adjustStock(
      body.productId,
      body.type,
      body.quantity,
      body.reason,
      req.user.id,
      body.variantId,
    );
  }
}
