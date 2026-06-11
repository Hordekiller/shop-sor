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
import { BrandsService } from "./brands.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("Brands")
@Controller("brands")
export class BrandsController {
  constructor(private brandsService: BrandsService) {}

  @Get()
  @ApiOperation({ summary: "List all brands" })
  async findAll() {
    return this.brandsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get brand by ID or slug" })
  async findOne(@Param("id") id: string) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return this.brandsService.findBySlug(id);
    }
    return this.brandsService.findById(numericId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create brand (admin)" })
  async create(
    @Body() body: { name: string; description?: string; logo?: string },
  ) {
    return this.brandsService.create(body);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update brand (admin)" })
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      logo?: string;
      isActive?: boolean;
    },
  ) {
    return this.brandsService.update(Number(id), body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete brand (admin)" })
  async remove(@Param("id") id: string) {
    return this.brandsService.remove(Number(id));
  }
}
