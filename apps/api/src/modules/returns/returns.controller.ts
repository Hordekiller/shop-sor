import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ReturnsService } from "./returns.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Returns")
@Controller()
export class ReturnsController {
  constructor(private returnsService: ReturnsService) {}

  @Post("returns")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a return request" })
  async create(
    @Req() req: any,
    @Body()
    dto: {
      orderId: number;
      reason: string;
      description?: string;
      items: { itemId: number; quantity: number }[];
    },
  ) {
    return this.returnsService.create(req.user.id, dto);
  }

  @Get("returns")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List user return requests" })
  async findMy(@Req() req: any, @Query("page") page?: string) {
    return this.returnsService.findByUser(req.user.id, Number(page) || 1);
  }

  @Get("returns/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get return request detail" })
  async findOne(@Req() req: any, @Param("id") id: string) {
    return this.returnsService.findById(
      Number(id),
      req.user.role === "CUSTOMER" ? req.user.id : undefined,
    );
  }

  @Get("admin/returns")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "List all return requests (admin)" })
  async findAllAdmin(
    @Query("page") page?: string,
    @Query("status") status?: string,
  ) {
    return this.returnsService.findAllAdmin(Number(page) || 1, 20, status);
  }

  @Put("admin/returns/:id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update return request status (admin)" })
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: { status: string; adminNote?: string; refundAmount?: number },
  ) {
    return this.returnsService.updateStatus(Number(id), dto);
  }
}
