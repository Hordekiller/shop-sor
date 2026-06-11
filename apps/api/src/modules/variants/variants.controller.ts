import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { VariantsService } from "./variants.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Variants")
@Controller("products/:productId/variants")
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Get()
  @ApiOperation({ summary: "Get active variants for a product" })
  async findAll(@Param("productId") productId: string) {
    return this.variantsService.findByProduct(+productId);
  }

  @Get("all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "VENDOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all variants (admin)" })
  async findAllAdmin(@Param("productId") productId: string) {
    return this.variantsService.findAll(+productId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get variant by id" })
  async findOne(@Param("id") id: string) {
    return this.variantsService.findById(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "VENDOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create variant" })
  async create(@Param("productId") productId: string, @Body() body: any) {
    return this.variantsService.create(+productId, body);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "VENDOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update variant" })
  async update(@Param("id") id: string, @Body() body: any) {
    return this.variantsService.update(+id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN", "VENDOR")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete variant" })
  async remove(@Param("id") id: string) {
    return this.variantsService.remove(+id);
  }
}
