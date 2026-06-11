import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { CouponsService } from "./coupons.service";
import { CreateCouponDto, UpdateCouponDto } from "./dto/create-coupon.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Coupons")
@Controller("coupons")
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all coupons (admin)" })
  async findAll() {
    return this.couponsService.findAll();
  }

  @Get("validate")
  @ApiOperation({ summary: "Validate a coupon code" })
  async validate(
    @Query("code") code: string,
    @Query("subtotal") subtotal: string,
    @Query("userId") userId?: string,
    @Query("productIds") productIds?: string,
    @Query("categoryIds") categoryIds?: string,
  ) {
    return this.couponsService.validate(
      code,
      Number(subtotal) || 0,
      userId ? Number(userId) : undefined,
      productIds ? productIds.split(",").map(Number) : undefined,
      categoryIds ? categoryIds.split(",").map(Number) : undefined,
    );
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get coupon by ID (admin)" })
  async findOne(@Param("id") id: string) {
    return this.couponsService.findById(Number(id));
  }

  @Get(":id/stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get coupon usage stats (admin)" })
  async getStats(@Param("id") id: string) {
    return this.couponsService.getStats(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create coupon (admin)" })
  async create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update coupon (admin)" })
  async update(@Param("id") id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(Number(id), dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete coupon (admin)" })
  async remove(@Param("id") id: string) {
    return this.couponsService.remove(Number(id));
  }
}
